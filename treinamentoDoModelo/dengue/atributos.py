from __future__ import annotations

import numpy as np
import pandas as pd
from scipy.sparse import csr_matrix

from .base import LOG, arquivo, config_preparo, reservar_municipios, resolver, salvar_json, salvar_parquet
from .fontes import CLIMA


def juntar_asof(painel, externo, data_externa, colunas):
    """Correspondência para trás, nunca vê publicação posterior à emissão."""
    left = painel[['codigo_ibge', 'semana_inicio']].copy()
    left['_ordem'] = np.arange(len(left))
    right = externo[['codigo_ibge', data_externa] + colunas].copy()
    right[data_externa] = pd.to_datetime(right[data_externa], errors='raise')
    if right.duplicated(['codigo_ibge', data_externa]).any():
        raise ValueError(f'Fonte ambígua: {data_externa} duplicada por município.')
    merged = pd.merge_asof(left.sort_values('semana_inicio'), right.sort_values(data_externa),
                           left_on='semana_inicio', right_on=data_externa, by='codigo_ibge',
                           direction='backward', allow_exact_matches=True)
    merged = merged.sort_values('_ordem').reset_index(drop=True)
    return merged


def enriquecer_populacao(cfg, painel):
    pop = pd.read_parquet(arquivo(cfg, 'prata', 'populacao.parquet'))
    pop['codigo_ibge'] = pop.codigo_ibge.astype(str)
    aligned = juntar_asof(painel, pop, 'disponivel_em', ['populacao', 'ano_populacao'])
    idade = painel.semana_inicio.dt.year - aligned.ano_populacao
    painel['populacao'] = aligned.populacao.where(idade.le(cfg['populacao']['max_idade_anos']))
    painel['ano_populacao'] = aligned.ano_populacao
    painel['f_populacao_idade'] = idade
    painel['f_populacao_ausente'] = painel.populacao.isna().astype('int8')
    painel['f_log_populacao'] = np.log1p(painel.populacao)
    painel['f_densidade'] = painel.populacao / painel.area_km2
    painel['porte'] = pd.cut(painel.populacao, [0, 20000, 50000, 100000, 500000, np.inf],
                              labels=['ate_20k', '20a50k', '50a100k', '100a500k', 'mais_500k']).astype(str)
    # Nunca inventa denominador populacional via mediana de outra cidade.
    salvar_json(arquivo(cfg, 'relatorios', 'populacao.json'), {
        'linhas_sem_denominador': int(painel.populacao.isna().sum()),
        'preenchimento': 'ultima ancora publicada antes da emissao; sem bfill/interpolacao futura',
        'idade_max_anos': cfg['populacao']['max_idade_anos'],
        'vintage': 'dados IBGE revisados atuais; data de publicacao conservadora assumida, nao vintage historico',
    })
    return painel


def enriquecer_opcionais(cfg, painel):
    for fonte in cfg['fontes_opcionais']:
        nome, cols = fonte['nome'], fonte['colunas']
        if not nome.isidentifier() or not all(c.isidentifier() for c in cols):
            raise ValueError('Nome/colunas de fonte precisam ser identificadores simples.')
        dados = pd.read_csv(resolver(fonte['caminho']), dtype={'codigo_ibge': str})
        required = {'codigo_ibge', 'competencia', 'disponivel_em', *cols}
        if required - set(dados):
            raise ValueError(f'{nome}: faltam {required-set(dados)}')
        for c in ['competencia', 'disponivel_em']:
            dados[c] = pd.to_datetime(dados[c], errors='raise')
        if (dados.competencia > dados.disponivel_em).any():
            raise ValueError(f'{nome}: competência futura em relação à disponibilidade.')
        for c in cols:
            dados[c] = pd.to_numeric(dados[c], errors='raise')
            if (dados[c].dropna() < 0).any():
                raise ValueError(f'{nome}: valores negativos não permitidos.')
        aligned = juntar_asof(painel, dados, 'disponivel_em', ['competencia'] + cols)
        idade = (painel.semana_inicio - aligned.competencia).dt.days
        for c in cols:
            out = 'f_' + nome + '_' + c
            painel[out] = aligned[c].where(idade.le(fonte['max_idade_dias']))
            painel[out + '_ausente'] = painel[out].isna().astype('int8')
        painel['f_' + nome + '_idade_dias'] = idade
    return painel


def enriquecer_clima(cfg, painel):
    if cfg['clima']['provedor'] == 'nenhum':
        return painel
    clima = pd.read_parquet(arquivo(cfg, 'prata', 'clima.parquet'))
    clima['codigo_ibge'] = clima.codigo_ibge.astype(str)
    # desloca a observação para a primeira origem em que pode ser usada
    clima['semana_inicio'] += pd.to_timedelta(cfg['clima']['atraso_semanas'] * 7, unit='D')
    p = painel.merge(clima, on=['codigo_ibge', 'semana_inicio'], how='left', validate='one_to_one')
    p = p.sort_values(['codigo_ibge', 'semana_inicio']).reset_index(drop=True)
    missing = {}
    for c in CLIMA:
        missing[c] = float(p[c].isna().mean())
        p['f_' + c + '_observacao_ausente'] = p[c].isna().astype('int8')
        if c + '_dias' in p:
            p['f_' + c + '_cobertura'] = (p[c + '_dias'] / 7).clip(0, 1)
        # Ffill só de temperatura/umidade. Chuva ausente nunca significa seca.
        if c != 'precipitacao' and cfg['clima']['ffill_semanas'] > 0:
            preenchida = p.groupby('codigo_ibge', observed=True)[c].ffill(limit=cfg['clima']['ffill_semanas'])
        else:
            preenchida = p[c]
        p['f_' + c + '_ffill'] = (p[c].isna() & preenchida.notna()).astype('int8')
        p[c] = preenchida
        g = p.groupby('codigo_ibge', observed=True)[c]
        for lag in cfg['atributos']['clima_lags']:
            p[f'f_{c}_lag{lag + cfg["clima"]["atraso_semanas"]}'] = g.shift(lag)
        for w in cfg['atributos']['clima_janelas']:
            p[f'f_{c}_media{w}'] = g.transform(lambda s: s.rolling(w, min_periods=max(1, w//2)).mean())
        # Climatologia expansiva da mesma semana, usando apenas anos anteriores.
        season = p.groupby(['codigo_ibge', 'numero_semana'], observed=True)[c]
        normal = season.transform(lambda s: s.shift(1).expanding(min_periods=2).mean())
        p['f_' + c + '_anomalia'] = p[c] - normal
    p['f_distancia_clima_km'] = p.distancia_clima_km
    salvar_json(arquivo(cfg, 'relatorios', 'cobertura_clima_painel.json'), missing)
    if max(missing.values()) > cfg['clima']['max_fracao_ausente']:
        raise ValueError(f'Clima excede ausência máxima: {missing}. Confira fonte ou rode ablação com provedor=nenhum.')
    return p.drop(columns=[c for c in ['ponto', 'fonte_clima', 'distancia_clima_km'] + CLIMA +
                                         [c + '_dias' for c in CLIMA] if c in p])


def atributos_vizinhos(cfg, p, casos_defasados):
    edges = pd.read_parquet(arquivo(cfg, 'prata', 'vizinhos.parquet'))
    codigos = sorted(p.codigo_ibge.unique())
    indice = {c: i for i, c in enumerate(codigos)}
    edges = edges[edges.codigo_ibge.isin(indice) & edges.vizinho.isin(indice)]
    # Cidades do holdout não fornecem nem rótulos nem séries de vizinhos ao treino.
    import json
    reservados = set(json.loads(arquivo(cfg, 'ouro', 'municipios_reservados.json').read_text()))
    edges = edges[~edges.vizinho.isin(reservados)]
    matriz = csr_matrix((np.ones(len(edges)),
                        ([indice[c] for c in edges.codigo_ibge], [indice[c] for c in edges.vizinho])),
                       shape=(len(codigos), len(codigos)))
    grau = np.asarray(matriz.sum(axis=1)).ravel()
    wide = pd.DataFrame({'codigo_ibge': p.codigo_ibge, 'semana_inicio': p.semana_inicio,
                         'valor': casos_defasados}).pivot(index='codigo_ibge', columns='semana_inicio', values='valor')
    wide = wide.reindex(codigos)
    values = wide.to_numpy(dtype=float)
    soma = matriz @ np.nan_to_num(values)
    conhecidos = matriz @ np.isfinite(values).astype(float)
    cobertura = np.divide(conhecidos, grau[:, None], out=np.zeros_like(conhecidos), where=grau[:, None] > 0)
    soma[(cobertura < 1) | (grau[:, None] == 0)] = np.nan
    # Ordem da grade é município, semana: a mesma do painel já validado.
    p['f_vizinhos_soma'] = soma.ravel().astype('float32')
    p['f_vizinhos_cobertura'] = cobertura.ravel().astype('float32')
    p['f_vizinhos_quantidade'] = np.repeat(grau, wide.shape[1]).astype('float32')
    for lag in [1, 3]:
        p[f'f_vizinhos_soma_lag{lag}'] = p.groupby('codigo_ibge', observed=True).f_vizinhos_soma.shift(lag)
    return p


def construir_atributos(cfg):
    LOG.info('Construindo enriquecimentos e atributos causais...')
    p = pd.read_parquet(arquivo(cfg, 'ouro', 'painel.parquet'))
    p['codigo_ibge'] = p.codigo_ibge.astype(str)
    p = enriquecer_populacao(cfg, p)
    reservar_municipios(cfg, p)
    p = enriquecer_opcionais(cfg, p)
    p = enriquecer_clima(cfg, p)
    p = p.sort_values(['codigo_ibge', 'semana_inicio']).reset_index(drop=True)
    g = p.groupby('codigo_ibge', observed=True).casos
    delay = cfg['atributos']['atraso_casos_semanas']
    atual = g.shift(delay)
    for lag in cfg['atributos']['lags']:
        p[f'f_casos_lag{delay + lag}'] = g.shift(delay + lag)
    # Janelas terminam na última semana liberada pela margem de maturação.
    grupo_atual = atual.groupby(p.codigo_ibge, observed=True)
    for w in cfg['atributos']['janelas']:
        p[f'f_casos_media{w}'] = grupo_atual.transform(lambda s: s.rolling(w, min_periods=w).mean())
        p[f'f_casos_max{w}'] = grupo_atual.transform(lambda s: s.rolling(w, min_periods=w).max())
        p[f'f_casos_std{w}'] = grupo_atual.transform(lambda s: s.rolling(w, min_periods=w).std())
    p['f_tendencia4'] = atual - g.shift(delay + 4)
    p['f_incidencia_recente'] = atual / p.populacao * 100000
    p['f_seno_semana'] = np.sin(2 * np.pi * p.numero_semana / 52.1775)
    p['f_cosseno_semana'] = np.cos(2 * np.pi * p.numero_semana / 52.1775)
    p['f_latitude'], p['f_longitude'] = p.latitude, p.longitude
    p['f_log_area'] = np.log1p(p.area_km2)
    p['f_historia_ausente'] = atual.isna().astype('int8')
    p = atributos_vizinhos(cfg, p, atual)
    # Baselines têm a MESMA disponibilidade do candidato, incluindo delay.
    p['baseline_recente'] = atual
    p['baseline_media4'] = grupo_atual.transform(lambda s: s.rolling(4, min_periods=4).mean())
    for h in cfg['treino']['horizontes']:
        p[f'alvo_h{h}'] = g.shift(-h)
        p[f'data_alvo_h{h}'] = p.semana_inicio + pd.to_timedelta(7*h, unit='D')
        # y(t+h-52), não y(t-52): alinha corretamente o baseline por horizonte.
        p[f'baseline_sazonal_h{h}'] = g.shift(52-h)
    features = sorted(c for c in p if c.startswith('f_'))
    for c in features:
        p[c] = pd.to_numeric(p[c], errors='coerce').replace([np.inf, -np.inf], np.nan).astype('float32')
    # Evita replicar dezenas de colunas de identificação/diagnóstico no treino.
    keep = ['codigo_ibge', 'uf', 'porte', 'ano_epi', 'numero_semana', 'semana_inicio',
            'semana_fim', 'populacao', 'casos', 'zero_inferido', 'fonte_recebida', 'semana_madura']
    keep += features + [c for c in p if c.startswith(('alvo_', 'data_alvo_', 'baseline_'))]
    p = p[keep]
    salvar_parquet(p, arquivo(cfg, 'ouro', 'atributos.parquet'))
    salvar_json(arquivo(cfg, 'ouro', 'schema_atributos.json'), {
        'numericas': features, 'categoricas': ['codigo_ibge', 'uf', 'porte'],
        'ausencias_antes_imputacao': {c: float(p[c].isna().mean()) for c in features},
        'cenario': 'retrospectivo_base_revisada; sem snapshots as-of',
        'atraso_casos_semanas': delay,
        'config_preparo': config_preparo(cfg),
    })
    LOG.info('Atributos prontos: %d linhas, %d numéricos + 3 categóricos.', len(p), len(features))
    return p


class ImputadorTreino:
    """Ajuste por fold, serializável; nenhum parâmetro aprende com validação/teste."""

    def fit(self, df, numericas, categoricas):
        self.numericas, self.categoricas = list(numericas), list(categoricas)
        self.ativas = [c for c in numericas if df[c].notna().any()]
        self.excluidas = sorted(set(numericas) - set(self.ativas))
        self.medianas = df[self.ativas].median()
        self.climaticas = [c for c in self.ativas if c.startswith(('f_temperatura', 'f_umidade', 'f_precipitacao'))
                           and not c.endswith(('_ausente', '_ffill'))]
        self.por_uf_semana = df.groupby(['uf', 'numero_semana'], observed=True)[self.climaticas].median()
        self.por_uf = df.groupby('uf', observed=True)[self.climaticas].median()
        self.relatorio = {'ativas': self.ativas, 'excluidas_100pct_ausentes_no_treino': self.excluidas,
                          'medianas_treino': {c: float(v) for c, v in self.medianas.items()},
                          'clima': 'mediana UF/semana do treino -> UF -> global do treino'}
        return self

    def transform(self, df):
        x = df[self.ativas].copy()
        for c in self.climaticas:
            lookup = pd.MultiIndex.from_frame(df[['uf', 'numero_semana']])
            v = self.por_uf_semana[c].reindex(lookup).to_numpy()
            x[c] = x[c].fillna(pd.Series(v, index=x.index))
            x[c] = x[c].fillna(df.uf.map(self.por_uf[c]))
        # Indicador preserva diferença entre dado observado e imputado.
        flags = pd.DataFrame({c + '__ausente': df[c].isna().astype('int8') for c in self.ativas}, index=df.index)
        x = pd.concat([x.fillna(self.medianas), flags], axis=1)
        for c in self.categoricas:
            x[c] = df[c].astype('string').fillna('DESCONHECIDO').astype(str)
        return x
