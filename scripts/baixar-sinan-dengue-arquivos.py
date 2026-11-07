#!/usr/bin/env python3
"""Baixa do zero os ZIPs oficiais de dengue e consolida um CSV ordenado por ano de origem."""
import argparse
import csv
import errno
import io
from operator import itemgetter
from concurrent.futures import ThreadPoolExecutor, as_completed
from html.parser import HTMLParser
from http.client import IncompleteRead
import json
from pathlib import Path, PurePosixPath
import re
import shutil
import sys
import time
from urllib.error import HTTPError
from urllib.parse import unquote, urlparse
from urllib.request import Request, urlopen
import zipfile
from contextlib import contextmanager

CATALOG = 'https://dadosabertos.saude.gov.br/dataset/arboviroses-dengue'
DEFAULT_OUTPUT = Path(__file__).resolve().parents[1] / 'data/sinan-arquivos'
BLOCK = 1024 * 1024


def request(url, method='GET', headers=None):
    return urlopen(Request(url, method=method, headers={'User-Agent': 'Denguinhos-dataset-downloader/1.0', **(headers or {})}), timeout=120)


def retry(operation):
    for attempt in range(6):
        try:
            return operation()
        except (OSError, EOFError, IncompleteRead) as error:
            if isinstance(error, OSError) and error.errno in (errno.ENOSPC, errno.EDQUOT, errno.EACCES):
                raise
            if isinstance(error, HTTPError) and error.code not in (408, 429, 500, 502, 503, 504):
                raise
            if attempt == 5:
                raise
            delay = min(30, 2 ** attempt)
            print(f'Falha temporária: {error}; nova tentativa em {delay}s', flush=True)
            time.sleep(delay)


class CatalogParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.capturing = False
        self.parts = []

    def handle_starttag(self, tag, attrs):
        if tag == 'script' and dict(attrs).get('id') == '__NEXT_DATA__':
            self.capturing = True

    def handle_data(self, data):
        if self.capturing:
            self.parts.append(data)

    def handle_endtag(self, tag):
        if tag == 'script':
            self.capturing = False


def resources_from_html(html):
    parser = CatalogParser()
    parser.feed(html)
    payload = json.loads(''.join(parser.parts))
    resources = payload['props']['pageProps']['resources']
    selected = {}
    for resource in resources:
        url = resource.get('url', '')
        path = urlparse(url).path.lower()
        if resource.get('state', 'active') != 'active':
            continue
        if resource.get('format', '').upper() != 'CSV' and not path.endswith(('.csv', '.csv.zip')):
            continue
        if urlparse(url).scheme != 'https':
            raise ValueError(f'URL de download inesperada: {url}')
        if not path.endswith(('.zip', '.csv')):
            raise ValueError(f'Recurso CSV sem arquivo reconhecido: {url}')
        selected[url] = resource
    if not selected:
        raise ValueError('Nenhum CSV encontrado no catálogo. A estrutura do portal pode ter mudado.')
    return list(selected.values())


def load_catalog():
    def load():
        with request(CATALOG) as response:
            return resources_from_html(response.read().decode('utf-8'))
    return retry(load)


def write_json(path, payload):
    temporary = path.with_suffix(path.suffix + '.tmp')
    temporary.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n')
    temporary.replace(path)


def download(resource, folder):
    """Cada execução e cada tentativa baixa o arquivo inteiro, sem consultar cache."""
    url = resource['url']
    name = Path(unquote(urlparse(url).path)).name
    if name in ('', '.', '..'):
        raise ValueError('Nome de arquivo inválido')
    target = folder / name
    partial = target.with_suffix(target.suffix + '.part')

    def transfer():
        with request(url) as response:
            if response.status != 200:
                raise ValueError(f'Resposta HTTP inesperada: {response.status}')
            size_header = response.headers.get('Content-Length')
            expected = int(size_header) if size_header is not None else None
            with partial.open('wb') as stream:
                shutil.copyfileobj(response, stream, BLOCK)
            size = partial.stat().st_size
            if expected is not None and size != expected:
                raise OSError(f'Download incompleto: {name}')
            return {'url': url, 'etag': response.headers.get('ETag'), 'size': size,
                    'modified': response.headers.get('Last-Modified')}
    print(f'Baixando do zero: {name}', flush=True)
    identity = retry(transfer)
    partial.replace(target)
    return target, identity


def extract(archive, output, identity):
    destination = output / archive.name.removesuffix('.zip')
    destination.mkdir(parents=True, exist_ok=True)
    marker = destination / 'extracao.json'
    results = []
    if archive.suffix.lower() == '.zip':
        with zipfile.ZipFile(archive) as zipped:
            members = [member for member in zipped.infolist() if not member.is_dir() and member.filename.lower().endswith('.csv')]
            if not members:
                raise ValueError(f'ZIP não contém CSV: {archive.name}')
            for member in members:
                parts = PurePosixPath(member.filename)
                if parts.is_absolute() or '..' in parts.parts or '\\' in member.filename or ':' in member.filename:
                    raise ValueError(f'Caminho inválido no ZIP: {member.filename}')
                target = destination / Path(*parts.parts)
                target.parent.mkdir(parents=True, exist_ok=True)
                temporary = target.with_suffix(target.suffix + '.part')
                temporary.unlink(missing_ok=True)
                if shutil.disk_usage(destination).free < member.file_size:
                    raise OSError(errno.ENOSPC, f'Espaço insuficiente para extrair {member.filename} ({member.file_size / BLOCK:.1f} MiB)')
                # A leitura até EOF verifica o CRC do ZIP, sem carregar o CSV em memória.
                try:
                    with zipped.open(member) as source, temporary.open('wb') as stream:
                        shutil.copyfileobj(source, stream, BLOCK)
                except BaseException:
                    temporary.unlink(missing_ok=True)
                    raise
                temporary.replace(target)
                results.append({'arquivo': member.filename, 'bytes': member.file_size})
    else:
        target = destination / archive.name
        temporary = target.with_suffix(target.suffix + '.part')
        shutil.copyfile(archive, temporary)
        temporary.replace(target)
        results.append({'arquivo': archive.name, 'bytes': target.stat().st_size})
    write_json(marker, {'origem': identity, 'csvs': results})
    print(f'Descompactado: {archive.name} ({len(results)} CSV)', flush=True)
    return results


def process(resource, output, extract_files=False):
    archive, identity = download(resource, output / 'zips')
    if not extract_files:
        return {'recurso': resource['name'], 'url': resource['url'], 'arquivo': str(archive), 'origem': identity, 'concluido': True}
    csvs = extract(archive, output / 'csv', identity)
    return {'recurso': resource['name'], 'url': resource['url'], 'arquivo': str(archive), 'origem': identity, 'csvs': csvs, 'concluido': True}


def resource_year(resource):
    match = re.search(r'\b(20\d{2}|19\d{2})\b', resource['recurso'])
    if not match:
        raise ValueError(f'Ano não identificado no recurso: {resource["recurso"]}')
    return int(match[1])


@contextmanager
def csv_source(spec, encoding):
    archive = Path(spec['arquivo'])
    if spec['membro'] is None:
        with archive.open('r', encoding=encoding, newline='') as stream:
            yield stream
    else:
        with zipfile.ZipFile(archive) as zipped, zipped.open(spec['membro']) as raw:
            with io.TextIOWrapper(raw, encoding=encoding, newline='') as stream:
                yield stream


def inspect_sources(results, encoding):
    specs, columns = [], ['ANO_ARQUIVO']
    for result in sorted(results, key=lambda item: (resource_year(item), item['url'])):
        archive = Path(result['arquivo'])
        if archive.suffix.lower() == '.zip':
            with zipfile.ZipFile(archive) as zipped:
                members = sorted((i.filename, i.file_size) for i in zipped.infolist() if not i.is_dir() and i.filename.lower().endswith('.csv'))
        else:
            members = [(None, archive.stat().st_size)]
        if not members:
            raise ValueError(f'Arquivo sem CSV: {archive}')
        for member, size in members:
            spec = {'arquivo': str(archive), 'membro': member, 'bytes': size, 'ano': resource_year(result), 'origem': result['origem']}
            with csv_source(spec, encoding) as stream:
                first_line = stream.readline()
                try:
                    delimiter = csv.Sniffer().sniff(first_line, delimiters=',;\t').delimiter
                except csv.Error:
                    if any(character in first_line for character in ',;\t'):
                        raise
                    delimiter = ','  # CSV com uma única coluna
                header = [name.strip().upper() for name in next(csv.reader([first_line], delimiter=delimiter))]
            if not header or any(not name for name in header) or len(set(header)) != len(header) or 'ANO_ARQUIVO' in header:
                raise ValueError(f'Cabeçalho inválido ou repetido: {archive} / {member}')
            spec.update(colunas=header, delimitador=delimiter)
            specs.append(spec)
            columns.extend(name for name in header if name not in columns)
    return specs, columns


def consolidate(results, output, encoding='utf-8-sig'):
    """Reconstrói integralmente o CSV em fluxo a partir dos downloads desta execução."""
    output.parent.mkdir(parents=True, exist_ok=True)
    specs, columns = inspect_sources(results, encoding)
    manifest_path = output.with_suffix('.manifest.json')
    temporary = output.with_suffix(output.suffix + '.part')
    state = {'registros': 0, 'por_ano_arquivo': {}}
    # Limite inferior: união de colunas pode produzir um resultado ainda maior.
    minimum = sum(spec['bytes'] for spec in specs)
    if shutil.disk_usage(output.parent).free < minimum:
        raise OSError(errno.ENOSPC, f'Consolidação precisa de pelo menos {minimum / 1024**3:.2f} GiB livres; a união de colunas pode exigir mais. Use --output em um disco com espaço.')
    with temporary.open('w', encoding='utf-8', newline='', buffering=BLOCK) as stream:
        writer = csv.writer(stream, lineterminator='\n')
        writer.writerow(columns)
        for index in range(len(specs)):
            spec = specs[index]
            source_columns = spec['colunas']
            positions = {name: position for position, name in enumerate(source_columns)}
            # itemgetter remapeia as colunas em C, sem um dict por registro.
            reorder = itemgetter(*(positions.get(name, len(source_columns)) for name in columns[1:]))
            count = 0
            year = str(spec['ano'])
            with csv_source(spec, encoding) as source:
                reader = csv.reader(source, delimiter=spec['delimitador'], strict=True)
                next(reader)
                for row in reader:
                    if len(row) != len(source_columns):
                        raise ValueError(f'Quantidade de campos inválida: {spec["arquivo"]}, linha {reader.line_num}')
                    row.append('')
                    values = reorder(row)
                    if len(columns) == 2:
                        values = (values,)
                    writer.writerow((year,) + values)
                    count += 1
            stream.flush()
            state['registros'] += count
            state['por_ano_arquivo'][year] = state['por_ano_arquivo'].get(year, 0) + count
            print(f'Consolidado {year}: {count:,} registros | fontes: {index + 1}/{len(specs)} | total: {state["registros"]:,}', flush=True)
    temporary.replace(output)
    manifest = {**state, 'bytes': output.stat().st_size, 'colunas': columns, 'encoding': encoding, 'fontes': specs,
                'ordenacao': 'ANO_ARQUIVO crescente; ordem original dentro de cada arquivo', 'concluido': True}
    write_json(manifest_path, manifest)
    return manifest


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output-dir', type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument('--threads', type=int, default=4, help='Downloads de arquivos simultâneos (padrão: 4).')
    parser.add_argument('--output', type=Path, help='CSV consolidado (padrão: OUTPUT_DIR/dengue-completo.csv).')
    parser.add_argument('--encoding', default='utf-8-sig', help='Codificação dos CSVs de origem.')
    parser.add_argument('--extract-files', action='store_true', help='Também grava cópias individuais descompactadas (usa mais disco).')
    parser.add_argument('--list-only', action='store_true', help='Lista os recursos sem baixar.')
    args = parser.parse_args()
    if args.threads < 1:
        parser.error('--threads deve ser positivo')
    resources = load_catalog()
    print(f'Catálogo: {len(resources)} arquivos CSV disponíveis.', flush=True)
    if args.list_only:
        for resource in resources:
            print(resource['name'], resource['url'])
        return
    (args.output_dir / 'zips').mkdir(parents=True, exist_ok=True)
    write_json(args.output_dir / 'catalogo.json', {'fonte': CATALOG, 'resources': resources})
    print('Etapa 1/2: baixando todos os arquivos do catálogo.', flush=True)
    results = []
    with ThreadPoolExecutor(max_workers=args.threads) as pool:
        futures = {pool.submit(process, resource, args.output_dir, args.extract_files): resource for resource in resources}
        for future in as_completed(futures):
            resource = futures[future]
            try:
                results.append(future.result())
            except Exception as error:
                print(f'Falha em {resource["name"]}: {error}', file=sys.stderr, flush=True)
                results.append({'recurso': resource['name'], 'url': resource['url'], 'concluido': False, 'erro': str(error)})
            write_json(args.output_dir / 'manifesto.json', {'fonte': CATALOG, 'total': len(resources), 'resultados': results})
            print(f'Progresso: {len(results)}/{len(resources)} arquivos processados', flush=True)
    if any(not result['concluido'] for result in results):
        raise ValueError('Alguns arquivos falharam. Execute novamente para baixar tudo do zero.')
    output = args.output or args.output_dir / 'dengue-completo.csv'
    print(f'Etapa 2/2: descompactando os ZIPs e reunindo todos os registros em {output}, por ano crescente.', flush=True)
    manifest = consolidate(results, output, args.encoding)
    print(f'Pipeline concluído: {output} | {manifest["registros"]:,} registros', flush=True)
    return output


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print('Interrompido. A próxima execução baixará tudo do zero.', file=sys.stderr)
        sys.exit(130)
    except Exception as error:
        print(f'Erro: {error}', file=sys.stderr)
        sys.exit(1)
