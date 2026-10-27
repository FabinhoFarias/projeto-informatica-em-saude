"""Consolida o esboço DER sem executar SQL. Use --force para substituir uma revisão existente."""
from pathlib import Path
import argparse
import re
import unicodedata

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / 'DER'
OUTPUT = ROOT / 'modelo_completo.puml'
GLOBAL = {'cliente', 'usuario', 'municipio', 'modulo', 'permissao'}
TARGETS = {
    'unidade_pai': 'unidade_organizacional', 'unidade': 'unidade_organizacional',
    'unidade_responsavel': 'unidade_organizacional', 'unidade_origem': 'unidade_organizacional',
    'unidade_destino': 'unidade_organizacional', 'autor': 'vinculo_usuario',
    'aprovador': 'vinculo_usuario', 'aprovado_por': 'vinculo_usuario',
    'responsavel': 'vinculo_usuario', 'coletor': 'vinculo_usuario',
    'digitador': 'vinculo_usuario', 'confirmado_por': 'vinculo_usuario',
    'origem_versao': 'territorio_versao', 'destino_versao': 'territorio_versao',
    'retorno_de_visita': 'visita', 'visita_origem': 'visita',
    'visita_resolucao': 'visita', 'visita_executada': 'visita',
    'categoria_versao': 'categoria_deposito_versao', 'observacao': 'observacao_deposito',
    'acao': 'acao_controle', 'carga': 'carga_produto', 'recipiente': 'recipiente_coleta',
    'substitui_resultado': 'resultado_analise', 'resultado': 'resultado_analise',
    'documento': 'documento_emitido', 'previsao': 'previsao_territorial',
    'decisao': 'decisao_gerencial', 'encaminhamento': 'encaminhamento_ocorrencia',
    'original': 'anexo', 'fonte': 'fonte_dados', 'lote': 'lote_ingestao',
    'dataset_treino': 'dataset_versao', 'dataset': 'dataset_versao',
    'execucao': 'execucao_modelo', 'execucao_base': 'execucao_modelo',
    'politica': 'politica_visibilidade', 'agenda': 'agenda_predicao',
    'destinatario': 'vinculo_usuario', 'entrega': 'entrega_predicao',
    'comunicacao': 'comunicacao_equipe',
}
LABELS = {'cliente_prefeitura': 'cliente', 'secretaria_unidade': 'unidade_organizacional',
          'modulo_do_cliente': 'cliente_modulo', 'modulo_da_unidade': 'unidade_modulo'}

def normalize(label):
    text = re.sub(r'\[ref\]|\(geografia\)', '', label, flags=re.I)
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode().lower()
    key = re.sub(r'[^a-z0-9]+', '_', text).strip('_')
    return LABELS.get(key, key)

def read_dictionary():
    content = (SOURCE / 'dicionario_entidades.md').read_text()
    tables = {}
    for name, body in re.findall(r'^### `([^`]+)`\n\n```text\n(.*?)\n```', content, re.M | re.S):
        if name in tables:
            raise ValueError(f'Entidade duplicada: {name}')
        fields, notes = {}, []
        for raw in body.splitlines():
            line = raw.strip()
            if not line:
                continue
            if line.startswith('UNIQUE(') or not re.match(r'^[a-z][a-z0-9_]*(?:\s*/|\s*:|\s*;|$)', line):
                notes.append(line)
                continue
            before, sep, suffix = line.partition(':')
            names = before.split(';')[0].strip().split(' / ')
            for item in names:
                item = item.strip()
                # Separate prose annotations from the actual attribute name.
                field = re.match(r'^([a-z][a-z0-9_]*)\b', item)
                if not field:
                    raise ValueError(f'Campo ilegível: {name}: {raw}')
                field = field[1]
                details = (suffix if sep else '') + ' ' + item[len(field):] + ' ' + before.partition(';')[2]
                pk = 'PK' in details
                fk = 'FK' in details and field.endswith('_id')
                typ = 'A_DEFINIR'
                if field == 'id' or field.endswith('_id'):
                    typ = 'UUID'
                elif sep:
                    explicit = re.match(r'\s*(uuid|int|boolean|text|date|time|timestamptz)\b', suffix)
                    if explicit:
                        typ = explicit[1].upper()
                optional = 'opcional' in details
                target = None
                if fk:
                    base = field[:-3]
                    target = TARGETS.get(base, base)
                value = dict(type=typ, pk=pk, fk=fk, target=target, optional=optional)
                if field in fields and fields[field] != value:
                    raise ValueError(f'Campo conflitante: {name}.{field}')
                fields[field] = value
            notes.append('Origem: ' + line)
        tables[name] = dict(fields=fields, notes=notes)
    if not tables:
        raise ValueError('Dicionário sem entidades.')
    for name, table in tables.items():
        for field, info in table['fields'].items():
            if info['target'] and info['target'] not in tables:
                raise ValueError(f'FK sem destino: {name}.{field} -> {info["target"]}')
        if not any(f['pk'] for f in table['fields'].values()):
            raise ValueError(f'Entidade sem chave: {name}')
        if name not in GLOBAL and 'cliente_id' not in table['fields']:
            raise ValueError(f'Entidade operacional sem cliente: {name}')
    return tables

def read_relationships(tables):
    found = {}
    for file in sorted(SOURCE.glob('[0-9][0-9]_*.puml')):
        if file.name.startswith('00_'):
            continue
        source = file.read_text()
        aliases = {}
        for label, alias in re.findall(r'^entity "([^"]+)" as (\w+) \{', source, re.M):
            name = normalize(label)
            if name not in tables:
                raise ValueError(f'{file.name}: entidade sem dicionário: {label}')
            aliases[alias] = name
        for label, relation in re.findall(r'^relationship "([^"]+)" as (\w+) \{', source, re.M):
            edges = re.findall(rf'^{relation} -\(([^)]+)\)- (\w+)$', source, re.M)
            if len(edges) != 2:
                raise ValueError(f'{file.name}: {relation} precisa de dois extremos')
            (ca, a), (cb, b) = edges
            a, b = aliases[a], aliases[b]
            key = (label, a, b, ca, cb)
            found[key] = dict(label=label, a=a, b=b, ca=ca, cb=cb)
    return list(found.values())

def generate():
    tables = read_dictionary()
    relationships = read_relationships(tables)
    known_pairs = {frozenset((r['a'], r['b'])) for r in relationships}
    # Explicit field-level references fill links omitted in the modular views.
    # Keep role names where two FKs point to the same table.
    for child, table in tables.items():
        for field, info in table['fields'].items():
            if not info['fk']:
                continue
            parent = info['target']
            if frozenset((parent, child)) in known_pairs:
                continue
            relationships.append(dict(label=f'Referencia {field}', a=parent, b=child,
                                      ca='0,1' if child == 'prefeitura' and field == 'cliente_id' else '0,N',
                                      cb='0,1' if info['optional'] else '1,1'))
    lines = [
        '@startchen Denguinhos_Modelo_Completo', 'left to right direction',
        "' ARQUIVO CONSOLIDADO DE REVISÃO DO BANCO — requisitos v2.2.",
        "' Preserva entidades, atributos e relações de DER/01..07 e seu dicionário.",
        "' Não executar SQL a partir deste arquivo sem refinamento físico e revisão.",
        "' A_DEFINIR = tipo ainda não estabelecido na origem; não é tipo PostgreSQL.",
        "' Atributos agrupados na origem foram separados; não se inferiu tipo de enum/data/número.",
        "' UUID para IDs e FKs é convenção explícita do esboço; demais tipos só quando declarados.",
        "' FK nula/opcional é indicada em comentário; a coluna cliente_id é sempre NOT NULL.",
        "' FKs operacionais são compostas com cliente_id para impedir relações entre tenants.",
        "' Prefeitura = cliente; secretaria = unidade; município = geografia.",
        "' Concessão por unidade/finalidade; compartilhamento interno precisa de aprovação.",
        "' Em autorrelacionamentos, extremos: origem e destino, respectivamente.", '',
    ]
    unknown = 0
    for name, table in tables.items():
        lines.append(f'entity "{name}" as E_{name} {{')
        for field, info in table['fields'].items():
            key = ' <<key>>' if info['pk'] else ''
            lines.append(f'  "{field}" as F_{name}_{field} : {info["type"]}{key}')
            if info['target']:
                lines.append(f"  ' FK {field} -> {info['target']}." + ('cliente_id' if info['target'] == 'prefeitura' else 'id') + ('; opcional' if info['optional'] else '; obrigatório'))
            unknown += info['type'] == 'A_DEFINIR'
        lines.append('}')
        lines += ["' " + name + ': ' + note for note in table['notes']]
        lines.append('')
    for i, rel in enumerate(relationships, 1):
        rid = f'REL_{i:03}'
        lines += [f'relationship "{rel["label"]}" as {rid} {{', '}',
                  f'{rid} -({rel["ca"]})- E_{rel["a"]}',
                  f'{rid} -({rel["cb"]})- E_{rel["b"]}', '']
    lines += [
        "' REGRAS TRANSVERSAIS QUE EXIGEM DDL/TRIGGERS/POLÍTICAS NO SCHEMA FÍSICO:",
        "' 1. UNIQUE(cliente_id, operation_uuid); reenvio não gera visita.",
        "' 2. Revisão e snapshot aprovados são imutáveis; correção gera versão nova.",
        "' 3. Item de consolidação usa uma revisão por visita; FK comprova que a revisão pertence à visita.",
        "' 4. Proibir ciclos em unidade-pai, retorno de visita, original de anexo e substituição de resultado.",
        "' 5. Mapeamento externo: um alvo (imóvel OU território); anexo: uma origem principal.",
        "' 6. Quantidades não negativas; zero, desconhecido e não aplicável são diferentes.",
        "' 7. Não somar preparo da carga em cada aplicação; preservar produto/unidade.",
        "' 8. Agenda/ocorrência/destinatário únicos; leitura e comunicação não comprovam execução.",
        "' 9. Revalidar concessão/lotação/módulo, RLS por cliente/unidade e compartilhamento vigente.",
        "' 10. Amostra, tubito, espécime, depósito e imóvel possuem identidades/contagens distintas.",
        "' 11. Cliente do tipo PREFEITURA exige perfil prefeitura; código IBGE não é tenant.",
        "' 12. Validar destinos de todos os campos FK antes de migrar. Dados reais exigem controle de finalidade.",
        f"' TOTAL: {len(tables)} entidades; {sum(len(t['fields']) for t in tables.values())} atributos; {len(relationships)} relações; {unknown} tipos A_DEFINIR.",
        '@endchen', '',
    ]
    return '\n'.join(lines), tables, relationships, unknown

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--force', action='store_true')
    args = parser.parse_args()
    if OUTPUT.exists() and not args.force:
        raise SystemExit('Modelo já existe. Revise alterações e use --force para regenerar.')
    text, tables, relationships, unknown = generate()
    OUTPUT.write_text(text)
    print(f'{OUTPUT.name}: {len(tables)} entidades, {len(relationships)} relações, {unknown} tipos ainda a definir.')
