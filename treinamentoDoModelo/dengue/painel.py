from __future__ import annotations

import json

import numpy as np
import pandas as pd

from .base import (LOG, arquivo, calendario, conexao, literal, resolver,
                   salvar_json, salvar_parquet)


def construir_painel(cfg):
    """Projeta poucas colunas do Parquet e agrega no DuckDB antes de usar pandas."""
    LOG.info('SINAN: leitura colunar e agregação do Nordeste...')
    dim = pd.read_parquet(arquivo(cfg, 'prata', 'municipios.parquet'))
    cal = calendario(cfg['ano_inicio'], cfg['ano_fim'])
    salvar_parquet(cal, arquivo(cfg, 'prata', 'calendario.parquet'))
    con = conexao(cfg)
    try:
        con.execute(f'CREATE VIEW origem AS SELECT * FROM read_parquet({literal(cfg["entrada"])})')
        colunas = {r[0] for r in con.execute('DESCRIBE origem').fetchall()}
        obrigatorias = {'ID_MN_RESI', 'SEM_PRI', 'DT_SIN_PRI', 'CLASSI_FIN', 'ANO_ARQUIVO'}
        if obrigatorias - colunas:
            raise ValueError(f'Colunas ausentes: {obrigatorias-colunas}')
        def coluna(nome):
            return f'cast("{nome}" AS VARCHAR)' if nome in colunas else 'NULL::VARCHAR'
        def data(nome):
            return f"try_cast(substr(trim({coluna(nome)}),1,10) AS DATE)"
        # As chaves curtas são aceitas só por correspondência com código oficial.
        # Código de 7 posições precisa bater integralmente; não ignora dígito inválido.
        mapa = dim[['codigo_ibge', 'codigo_sinan']].copy()
        mapa['inicio_vigencia'], mapa['fim_vigencia'] = pd.Timestamp('2015-01-01'), pd.Timestamp('2100-01-01')
        if cfg['painel'].get('mapa_municipios_csv'):
            mapa = pd.read_csv(resolver(cfg['painel']['mapa_municipios_csv']), dtype=str)
            requeridas = ['codigo_ibge', 'codigo_sinan', 'inicio_vigencia', 'fim_vigencia']
            if not set(requeridas).issubset(mapa):
                raise ValueError(f'Mapa precisa de {requeridas}')
            for c in ['inicio_vigencia', 'fim_vigencia']:
                mapa[c] = pd.to_datetime(mapa[c], errors='raise')
            mapa = mapa[mapa.codigo_ibge.isin(dim.codigo_ibge)].copy()
        if mapa.codigo_sinan.duplicated().any():
            raise ValueError('Mapa precisa de um vínculo não ambíguo por código SINAN neste recorte.')
        # Semântica das vigências: [início, fim), incluído o começo e excluído o fim.
        # DATE, não TIMESTAMP_NS: anos inválidos como 0620 no SINAN não cabem
        # em nanosegundos e precisam alcançar a quarentena sem overflow no join.
        for c in ['inicio_vigencia', 'fim_vigencia']:
            mapa[c] = pd.to_datetime(mapa[c]).dt.date
        cal_sql = cal.copy()
        for c in ['semana_inicio', 'semana_fim']:
            cal_sql[c] = cal_sql[c].dt.date
        con.register('mapa', mapa)
        con.register('cal', cal_sql)
        ufs = ','.join(literal(u) for u in cfg['ufs'])
        filtro_amostra = ''
        if cfg['municipios']:
            seis = ','.join(literal(c[:6]) for c in cfg['municipios'])
            filtro_amostra = f'AND left(trim(cast(ID_MN_RESI AS VARCHAR)),6) IN ({seis})'
        con.execute(f'''CREATE TEMP TABLE regional AS SELECT
            regexp_replace(trim({coluna('ID_MN_RESI')}), '\\.0+$', '') AS codigo_original,
            regexp_replace(trim({coluna('SEM_PRI')}), '\\.0+$', '') AS semana_original,
            {data('DT_SIN_PRI')} AS sintomas,
            {data('DT_NOTIFIC')} AS notificacao,
            {data('DT_DIGITA')} AS digitacao,
            {data('DT_ENCERRA')} AS encerramento,
            regexp_replace(trim({coluna('CLASSI_FIN')}), '\\.0+$', '') AS classificacao,
            regexp_replace(trim({coluna('NDUPLIC_N')}), '\\.0+$', '') AS duplicidade,
            try_cast({coluna('ANO_ARQUIVO')} AS INTEGER) AS ano_arquivo
            FROM origem WHERE left(trim({coluna('ID_MN_RESI')}),2) IN ({ufs}) {filtro_amostra}''')
        anos = con.execute('SELECT DISTINCT ano_arquivo FROM regional WHERE ano_arquivo IS NOT NULL').fetchall()
        recursos_anos = {int(r[0]) for r in anos}
        con.execute(f'''CREATE TEMP TABLE classificados AS
            SELECT r.*, m.codigo_ibge, coalesce(c.semana_inicio, d.semana_inicio) AS semana_inicio,
                coalesce(c.ano_epi,d.ano_epi) AS ano_epi,
                CASE WHEN c.semana_inicio IS NULL AND d.semana_inicio IS NOT NULL THEN 1 ELSE 0 END AS semana_recuperada,
                CASE
                    WHEN m.codigo_ibge IS NULL THEN 'municipio_invalido'
                    WHEN c.semana_inicio IS NULL AND d.semana_inicio IS NULL THEN 'semana_data_invalida'
                    WHEN c.semana_inicio IS NOT NULL AND sintomas IS NOT NULL AND
                         (sintomas<c.semana_inicio OR sintomas>c.semana_fim) THEN 'data_semana_divergente'
                    WHEN coalesce(sintomas,coalesce(c.semana_inicio,d.semana_inicio)) < m.inicio_vigencia
                         OR coalesce(sintomas,coalesce(c.semana_inicio,d.semana_inicio)) >= m.fim_vigencia
                         THEN 'fora_vigencia_municipio'
                    WHEN sintomas > {literal(cfg['data_corte'])}::DATE THEN 'evento_futuro'
                    ELSE 'valido' END AS motivo
            FROM regional r
            LEFT JOIN mapa m ON ((length(codigo_original)=6 AND codigo_original=m.codigo_sinan)
                                OR (length(codigo_original)=7 AND codigo_original=m.codigo_ibge))
            LEFT JOIN cal c ON semana_original=c.semana_epi
            LEFT JOIN cal d ON sintomas BETWEEN d.semana_inicio AND d.semana_fim
            WHERE (ano_arquivo BETWEEN {cfg['ano_inicio']} AND {cfg['ano_fim']}
                OR year(sintomas) BETWEEN {cfg['ano_inicio']} AND {cfg['ano_fim']}
                OR try_cast(left(semana_original,4) AS INTEGER) BETWEEN {cfg['ano_inicio']} AND {cfg['ano_fim']})''')
        motivos = dict(con.execute('SELECT motivo,count(*) FROM classificados GROUP BY motivo').fetchall())
        total = sum(motivos.values())
        quarentena = total - motivos.get('valido', 0)
        con.execute(f'''COPY (SELECT * FROM classificados WHERE motivo<>'valido')
            TO {literal(arquivo(cfg, 'prata', 'quarentena.parquet'))} (FORMAT PARQUET, COMPRESSION ZSTD)''')
        duplicados = con.execute("SELECT count(*) FROM classificados WHERE motivo='valido' AND duplicidade='2'").fetchone()[0]
        distribuicao_classes = dict(con.execute("SELECT coalesce(classificacao,'AUSENTE'),count(*) FROM classificados WHERE motivo='valido' GROUP BY 1").fetchall())
        classes = ','.join(literal(c) for c in cfg['painel']['classificacoes'])
        dup = "AND coalesce(duplicidade,'')<>'2'" if cfg['painel']['excluir_duplicidade_marcada'] else ''
        # Taxas de atraso são diagnósticos retrospectivos e não entram como
        # atributos contemporâneos da própria semana prevista.
        ag = con.execute(f'''SELECT codigo_ibge,semana_inicio,
            count(*)::INTEGER AS notificacoes,
            count(*) FILTER(WHERE classificacao IN ({classes}) {dup})::INTEGER AS casos,
            count(*) FILTER(WHERE classificacao IS NULL OR classificacao='')::INTEGER AS sem_classificacao,
            sum(semana_recuperada)::INTEGER AS semanas_recuperadas,
            median(date_diff('day',sintomas,notificacao)) FILTER(WHERE notificacao>=sintomas) AS atraso_mediano_dias
            FROM classificados WHERE motivo='valido' AND ano_epi BETWEEN {cfg['ano_inicio']} AND {cfg['ano_fim']}
            GROUP BY codigo_ibge,semana_inicio''').df()
        relatorio = {'recorte_lido': int(con.execute('SELECT count(*) FROM regional').fetchone()[0]),
                     'registros_periodo': total, 'motivos': motivos,
                     'duplicidade_marcada_2': int(duplicados),
                     'classificacoes_registros_validos': distribuicao_classes,
                     'casos_antes_cobertura': int(ag.casos.sum()),
                     'anos_arquivo_presentes': sorted(recursos_anos),
                     'entrada': cfg['entrada'], 'data_corte': cfg['data_corte'],
                     'regra_alvo': cfg['painel']['id_alvo'],
                     'sem_vintages': True, 'tipo_avaliacao': 'retrospectiva_base_revisada'}
        salvar_json(arquivo(cfg, 'relatorios', 'qualidade_sinan.json'), relatorio)
        if not total or quarentena / total > cfg['painel']['max_fracao_quarentena']:
            raise ValueError(f'Quarentena {quarentena}/{total} excede portão. Veja qualidade_sinan.json.')
    finally:
        con.close()
    grid = dim.merge(cal, how='cross').merge(ag, on=['codigo_ibge', 'semana_inicio'],
                                            how='left', validate='one_to_one')
    grid['fonte_recebida'] = grid.ano_epi.isin(recursos_anos)
    if cfg['painel']['zeros'] == 'somente_observados':
        grid['fonte_recebida'] = grid.notificacoes.notna()
    cobertura = cfg['painel'].get('cobertura_csv')
    tem_cobertura = bool(cobertura)
    if cobertura:
        cobertura = pd.read_csv(resolver(cobertura), dtype={'codigo_ibge': str})
        cobertura['semana_inicio'] = pd.to_datetime(cobertura.semana_inicio)
        if not cobertura.fonte_recebida.isin([0, 1]).all():
            raise ValueError('Cobertura: fonte_recebida só aceita 0/1.')
        grid = grid.merge(cobertura[['codigo_ibge', 'semana_inicio', 'fonte_recebida']],
                          on=['codigo_ibge', 'semana_inicio'], how='left',
                          suffixes=('', '_informada'), validate='one_to_one')
        # Ausência na tabela de cobertura significa desconhecido.
        grid['fonte_recebida'] = grid.fonte_recebida_informada.eq(1)
        grid = grid.drop(columns='fonte_recebida_informada')
    grid['semana_madura'] = ((pd.Timestamp(cfg['data_corte']) - grid.semana_fim).dt.days >=
                             cfg['painel']['maturacao_dias'])
    conhecida = grid.fonte_recebida & grid.semana_madura
    grid['zero_inferido'] = (grid.casos.isna() & conhecida & (not tem_cobertura)).astype('int8')
    grid['casos'] = grid.casos.fillna(0).where(conhecida).astype('float32')
    grid['target_definition_id'] = cfg['painel']['id_alvo']
    grid['data_corte'] = pd.Timestamp(cfg['data_corte'])
    grid = grid.sort_values(['codigo_ibge', 'semana_inicio']).reset_index(drop=True)
    salvar_parquet(grid, arquivo(cfg, 'ouro', 'painel.parquet'))
    salvar_json(arquivo(cfg, 'relatorios', 'painel.json'), {
        'linhas': len(grid), 'municipios': int(grid.codigo_ibge.nunique()),
        'semanas': int(grid.semana_inicio.nunique()), 'casos': int(grid.casos.sum()),
        'alvos_nulos': int(grid.casos.isna().sum()), 'zeros_inferidos': int(grid.zero_inferido.sum()),
        'semanas_sem_casos': int(grid.casos.eq(0).sum()),
        'politica_zeros': cfg['painel']['zeros'], 'cobertura_explicita': tem_cobertura,
        'aviso': 'Presença do recurso anual não comprova cobertura municipal nem notificação negativa.'})
    LOG.info('Painel: %s linhas, %s municípios, %s casos.', f'{len(grid):,}',
             grid.codigo_ibge.nunique(), f'{int(grid.casos.sum()):,}')
    return grid
