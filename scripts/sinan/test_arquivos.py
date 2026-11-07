"""Testes do download direto do catálogo e da extração ZIP."""
import contextlib
import csv
import errno
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import zipfile

spec = importlib.util.spec_from_file_location('arquivos', Path(__file__).parents[1] / 'baixar-sinan-dengue-arquivos.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

class Response(io.BytesIO):
    def __init__(self, body=b'', status=200, headers=None):
        super().__init__(body)
        self.status = status
        self.headers = headers or {}

class FileTests(unittest.TestCase):
    def test_full_pipeline_downloads_zips_and_returns_single_ordered_csv(self):
        resources = []
        bodies = {}
        for year in (2026, 2010, 2000):
            url = f'https://example.test/{year}.csv.zip'
            resources.append({'name': f'Dengue - {year}', 'url': url})
            buffer = io.BytesIO()
            with zipfile.ZipFile(buffer, 'w') as zipped:
                zipped.writestr(f'{year}.csv', f'CODIGO,NU_ANO\n001,{year}\n002,{year}\n')
            bodies[url] = buffer.getvalue()
        def request(url):
            body = bodies[url]
            return Response(body, headers={'Content-Length': str(len(body))})
        with tempfile.TemporaryDirectory() as directory:
            with patch('sys.argv', ['pipeline', '--output-dir', directory]), \
                    patch.object(m, 'load_catalog', return_value=resources), \
                    patch.object(m, 'request', side_effect=request), contextlib.redirect_stdout(io.StringIO()):
                output = m.main()
            self.assertEqual(output, Path(directory) / 'dengue-completo.csv')
            self.assertEqual(list(Path(directory).glob('*.csv')), [output])
            with output.open() as stream:
                rows = list(csv.DictReader(stream))
            self.assertEqual([row['ANO_ARQUIVO'] for row in rows], ['2000', '2000', '2010', '2010', '2026', '2026'])
            self.assertEqual([row['CODIGO'] for row in rows], ['001', '002'] * 3)
            self.assertEqual(len(list((Path(directory) / 'zips').glob('*.zip'))), 3)
            self.assertFalse(output.with_suffix('.csv.part').exists())

    def fixture(self, root, year, body, version='v1'):
        archive = root / f'{year}.csv.zip'
        with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED) as z:
            z.writestr(f'{year}.csv', body)
        return {'arquivo': str(archive), 'recurso': f'Dengue - {year}', 'url': f'https://example.test/{year}.zip', 'origem': {'etag': version}}

    def test_merge_schemas_year_order_and_always_rebuild(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            old = self.fixture(root, 2000, 'CODIGO,VALOR\n001,"a,b"\n')
            new = self.fixture(root, 2010, 'VALOR,NOVO\n"linha\ndois",nan\n')
            output = root / 'completo.csv'
            with contextlib.redirect_stdout(io.StringIO()):
                manifest = m.consolidate([new, old], output)
            with output.open() as stream:
                rows = list(csv.DictReader(stream))
            self.assertEqual(manifest['registros'], 2)
            self.assertEqual([r['ANO_ARQUIVO'] for r in rows], ['2000', '2010'])
            self.assertEqual(rows[0]['CODIGO'], '001')
            self.assertEqual(rows[0]['NOVO'], '')
            self.assertEqual(rows[1]['VALOR'], 'linha\ndois')
            self.assertEqual(rows[1]['NOVO'], 'nan')
            output.write_text("resultado antigo inválido\n")
            with contextlib.redirect_stdout(io.StringIO()):
                m.consolidate([old, new], output)
            with output.open() as stream:
                self.assertEqual(len(list(csv.DictReader(stream))), 2)

    def test_updated_year_replaces_records_instead_of_appending(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            output = root / 'all.csv'
            source = self.fixture(root, 2010, 'CODIGO\n001\n002\n')
            with contextlib.redirect_stdout(io.StringIO()):
                m.consolidate([source], output)
                source = self.fixture(root, 2010, 'CODIGO\n003\n', 'v2')
                m.consolidate([source], output)
            with output.open() as stream:
                self.assertEqual(list(csv.DictReader(stream)), [{'ANO_ARQUIVO': '2010', 'CODIGO': '003'}])

    def test_failed_merge_preserves_final_and_restarts_without_duplicates(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            output = root / 'all.csv'
            output.write_text('resultado anterior\n')
            first = self.fixture(root, 2000, 'CODIGO,VALOR\n001,a\n')
            second = self.fixture(root, 2010, 'CODIGO,VALOR\n002,b\n003,c\n')
            original = m.csv_source
            @contextlib.contextmanager
            def failing(spec, encoding):
                with original(spec, encoding) as stream:
                    # Somente a leitura completa da segunda fonte falha após um registro.
                    if spec['ano'] == 2010 and 'colunas' in spec:
                        yield io.StringIO('CODIGO,VALOR\n002,b\n003,c,excedente\n')
                    else:
                        yield stream
            with patch.object(m, 'csv_source', failing), contextlib.redirect_stdout(io.StringIO()):
                with self.assertRaises(ValueError):
                    m.consolidate([first, second], output)
            self.assertEqual(output.read_text(), 'resultado anterior\n')
            self.assertFalse(output.with_suffix('.csv.checkpoint.json').exists())
            with contextlib.redirect_stdout(io.StringIO()):
                m.consolidate([first, second], output)
            with output.open() as stream:
                self.assertEqual([r['CODIGO'] for r in csv.DictReader(stream)], ['001', '002', '003'])

    def test_disk_full_does_not_retry(self):
        with patch.object(m.time, 'sleep') as sleep:
            def fail():
                raise OSError(errno.ENOSPC, 'disco cheio')
            with self.assertRaises(OSError):
                m.retry(fail)
            sleep.assert_not_called()

    def test_catalog_selects_only_csv_and_deduplicates_urls(self):
        resources = [
            {'format': 'CSV', 'url': 'https://example.test/2010.csv.zip'},
            {'format': 'CSV', 'url': 'https://example.test/2010.csv.zip'},
            {'format': 'PDF', 'url': 'https://example.test/dicionario.pdf'},
            {'format': 'API', 'url': 'https://example.test/api'},
            {'format': 'DBF', 'url': 'https://example.test/2010.dbf.zip'},
        ]
        html = '<script id="__NEXT_DATA__" type="application/json">' + json.dumps({'props': {'pageProps': {'resources': resources}}}) + '</script>'
        self.assertEqual(len(m.resources_from_html(html)), 1)

    def test_every_run_downloads_fully_without_head_or_reading_metadata(self):
        with tempfile.TemporaryDirectory() as directory:
            folder = Path(directory)
            resource = {'url': 'https://example.test/2010.csv.zip'}
            (folder / '2010.csv.zip').write_bytes(b'OLD')
            (folder / '2010.csv.zip.part').write_bytes(b'PARTIAL')
            (folder / '2010.csv.zip.download.json').write_text('metadados antigos inválidos')
            calls = []
            def request(url, method='GET', headers=None):
                calls.append((method, headers))
                return Response(b'abcdef', headers={'Content-Length': '6'})
            with patch.object(m, 'request', side_effect=request), contextlib.redirect_stdout(io.StringIO()):
                target, _ = m.download(resource, folder)
                self.assertEqual(target.read_bytes(), b'abcdef')
                target.write_bytes(b'outro dado')
                m.download(resource, folder)
            self.assertEqual(target.read_bytes(), b'abcdef')
            self.assertEqual(calls, [('GET', None), ('GET', None)])

    def test_retry_restarts_incomplete_download_from_zero(self):
        with tempfile.TemporaryDirectory() as directory:
            responses = [Response(b'abc', headers={'Content-Length': '6'}), Response(b'abcdef', headers={'Content-Length': '6'})]
            with patch.object(m, 'request', side_effect=responses) as request, patch.object(m.time, 'sleep'), contextlib.redirect_stdout(io.StringIO()):
                target, _ = m.download({'url': 'https://example.test/data.csv'}, Path(directory))
            self.assertEqual(target.read_bytes(), b'abcdef')
            self.assertEqual(request.call_count, 2)
            self.assertTrue(all(call.kwargs == {} for call in request.call_args_list))

    def test_extract_preserves_bytes_and_always_rebuilds(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            archive = root / '2010.csv.zip'
            data = b'codigo;valor\r\n001;nan\r\n'
            with zipfile.ZipFile(archive, 'w') as z:
                z.writestr('dados/2010.csv', data)
                z.writestr('nota.txt', 'texto')
            with contextlib.redirect_stdout(io.StringIO()):
                m.extract(archive, root / 'csv', {'etag': 'v1'})
            self.assertEqual((root / 'csv/2010.csv/dados/2010.csv').read_bytes(), data)
            (root / 'csv/2010.csv/extracao.json').write_text('metadados antigos inválidos')
            (root / 'csv/2010.csv/dados/2010.csv').write_bytes(b'antigo')
            with contextlib.redirect_stdout(io.StringIO()):
                m.extract(archive, root / 'csv', {'etag': 'v1'})
            self.assertEqual((root / 'csv/2010.csv/dados/2010.csv').read_bytes(), data)

    def test_rejects_zip_path_traversal(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            archive = root / 'bad.zip'
            with zipfile.ZipFile(archive, 'w') as z:
                z.writestr('../outside.csv', 'proibido')
            with self.assertRaises(ValueError):
                m.extract(archive, root / 'csv', {})
            self.assertFalse((root / 'outside.csv').exists())
