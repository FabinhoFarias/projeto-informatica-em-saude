from __future__ import annotations

import hashlib
import json
import logging
import platform
from datetime import date, datetime, timedelta, timezone
from importlib.metadata import version
from pathlib import Path

import duckdb
import numpy as np
import pandas as pd
import requests
import yaml
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

LOG = logging.getLogger('dengue')
RAIZ = Path(__file__).resolve().parents[2]
UFS = dict(zip(map(str, range(21, 30)), ['MA', 'PI', 'CE', 'RN', 'PB', 'PE', 'AL', 'SE', 'BA']))


def carregar_config(caminho):
    cfg = yaml.safe_load(Path(caminho).read_text(encoding='utf-8'))
    for k in ('entrada', 'saida'):
        cfg[k] = str(resolver(cfg[k]))
    if not set(cfg['ufs']).issubset(UFS):
        raise ValueError('UF fora do Nordeste na configuração.')
    if not 2015 <= cfg['ano_inicio'] <= cfg['ano_fim']:
        raise ValueError('A regra atual de CLASSI_FIN exige início >= 2015.')
    if cfg['treino']['testes_anos'] and cfg['treino']['treino_final_ate'] >= min(cfg['treino']['testes_anos']):
        raise ValueError('Treino final invade os testes bloqueados.')
    if cfg['treino']['treino_final_ate'] >= min(cfg['treino']['validacao_anos']):
        raise ValueError('Treino final invade a validação temporal.')
    if set(cfg['treino']['validacao_anos']) & set(cfg['treino']['testes_anos']):
        raise ValueError('Validação e teste devem ser disjuntos.')
    if cfg['painel']['zeros'] not in ('snapshot_anual', 'somente_observados'):
        raise ValueError('Política de zeros desconhecida.')
    if cfg['clima']['provedor'] not in ('nasa_power', 'inmet', 'nenhum'):
        raise ValueError('Provedor de clima desconhecido.')
    if cfg['atributos']['atraso_casos_semanas'] < 1 or cfg['clima']['atraso_semanas'] < 1:
        raise ValueError('Atrasos de casos e clima devem ser >= 1.')
    if not 0 <= cfg['treino']['fracao_municipios_reservados'] < 0.5:
        raise ValueError('Fração espacial deve estar entre 0 e 0,5.')
    smote = cfg['treino'].get('smote', {})
    if smote and (not 0 < float(smote.get('razao_pos_neg_max', 0)) <= 1 or
                  int(smote.get('k_vizinhos', 0)) < 1 or
                  int(smote.get('max_sinteticos_por_uf', -1)) < 0):
        raise ValueError('Configuração SMOTE inválida.')
    for p in ('bronze', 'prata', 'ouro', 'relatorios', 'modelos', 'temporarios'):
        (Path(cfg['saida']) / p).mkdir(parents=True, exist_ok=True)
    return cfg


def resolver(caminho):
    p = Path(caminho)
    return p if p.is_absolute() else RAIZ / p


def arquivo(cfg, camada, nome):
    return Path(cfg['saida']) / camada / nome


def sha256(caminho):
    h = hashlib.sha256()
    with open(caminho, 'rb') as f:
        for b in iter(lambda: f.read(2**20), b''):
            h.update(b)
    return h.hexdigest()


def salvar_json(caminho, valor):
    caminho = Path(caminho)
    caminho.parent.mkdir(parents=True, exist_ok=True)
    tmp = caminho.with_suffix(caminho.suffix + '.part')
    tmp.write_text(json.dumps(valor, ensure_ascii=False, indent=2, default=str,
                              allow_nan=False), encoding='utf-8')
    tmp.replace(caminho)


def salvar_parquet(df, caminho):
    caminho = Path(caminho)
    tmp = caminho.with_suffix('.parquet.part')
    df.to_parquet(tmp, index=False, compression='zstd')
    tmp.replace(caminho)


def sessao():
    s = requests.Session()
    retry = Retry(total=4, backoff_factor=1.5, status_forcelist=[429, 500, 502, 503, 504],
                  allowed_methods=['GET'], respect_retry_after_header=True)
    s.mount('https://', HTTPAdapter(max_retries=retry))
    s.headers['User-Agent'] = 'Denguinhos-pesquisa/1.0 (dados publicos agregados)'
    return s


def baixar(cfg, url, nome):
    """Cada execução on-line baixa de novo. Offline só usa os arquivos indicados."""
    destino = arquivo(cfg, 'bronze', nome)
    destino.parent.mkdir(parents=True, exist_ok=True)
    if cfg.get('offline'):
        if not destino.is_file():
            raise FileNotFoundError(f'Modo offline: falta {destino}')
        return destino
    LOG.info('Baixando %s', nome)
    tmp = destino.with_suffix(destino.suffix + '.part')
    with sessao() as s, s.get(url, timeout=(20, 180), stream=True) as r:
        r.raise_for_status()
        with tmp.open('wb') as f:
            for bloco in r.iter_content(2**20):
                f.write(bloco)
        meta = {'url': r.url, 'coletado_em': datetime.now(timezone.utc).isoformat(),
                'bytes': tmp.stat().st_size, 'sha256': sha256(tmp),
                'etag': r.headers.get('ETag'), 'last_modified': r.headers.get('Last-Modified')}
    tmp.replace(destino)
    salvar_json(destino.with_suffix(destino.suffix + '.meta.json'), meta)
    return destino


def json_baixado(cfg, url, nome):
    return json.loads(baixar(cfg, url, nome).read_text(encoding='utf-8-sig'))


def literal(valor):
    return "'" + str(valor).replace("'", "''") + "'"


def conexao(cfg):
    con = duckdb.connect()
    con.execute(f"SET threads={int(cfg['threads'])}")
    con.execute(f"SET memory_limit={literal(cfg['memoria_duckdb'])}")
    con.execute(f"SET temp_directory={literal(arquivo(cfg, 'temporarios', 'duckdb'))}")
    con.execute('SET preserve_insertion_order=false')
    return con


def inicio_ano_epi(ano):
    # Domingo da semana que contém 4/janeiro: primeira com >=4 dias do ano.
    jan4 = date(ano, 1, 4)
    return jan4 - timedelta(days=(jan4.weekday() + 1) % 7)


def calendario(inicio, fim):
    linhas = []
    for ano in range(inicio, fim + 1):
        d, limite, semana = inicio_ano_epi(ano), inicio_ano_epi(ano + 1), 1
        while d < limite:
            linhas.append((f'{ano}{semana:02}', ano, semana, d, d + timedelta(days=6)))
            d += timedelta(days=7)
            semana += 1
    df = pd.DataFrame(linhas, columns=['semana_epi', 'ano_epi', 'numero_semana',
                                       'semana_inicio', 'semana_fim'])
    for c in ('semana_inicio', 'semana_fim'):
        df[c] = pd.to_datetime(df[c])
    return df


def inicio_semana(datas):
    datas = pd.to_datetime(datas)
    return datas - pd.to_timedelta((datas.dt.dayofweek + 1) % 7, unit='D')


def numero(s):
    # Marcadores oficiais (-, ..., X) ficam ausentes; nunca zero automático.
    return pd.to_numeric(s.astype(str).str.replace(',', '.', regex=False), errors='coerce')


def ambiente():
    pacotes = ['duckdb', 'pandas', 'numpy', 'pyarrow', 'catboost', 'scikit-learn',
               'imbalanced-learn', 'shapely', 'xgboost', 'lightgbm',
               'interpret-core', 'statsmodels']
    return {'python': platform.python_version(), 'pacotes': {p: version(p) for p in pacotes}}


def config_preparo(cfg):
    """Contrato do dataset: mudar hiperparâmetros não exige refazer enriquecimento."""
    keys = ['entrada', 'ano_inicio', 'ano_fim', 'data_corte', 'ufs', 'municipios',
            'painel', 'geografia', 'populacao', 'clima', 'fontes_opcionais', 'atributos', 'semente']
    result = {k: cfg[k] for k in keys}
    result['reserva_espacial'] = {'fracao': cfg['treino']['fracao_municipios_reservados'],
                                 'ano_estratificacao': min(cfg['treino']['validacao_anos'])-1}
    result['horizontes'] = cfg['treino']['horizontes']
    return result


def reservar_municipios(cfg, p):
    """Estratifica por UF/porte antes da primeira validação, sem olhar y futuro."""
    ref = p[p.ano_epi < min(cfg['treino']['validacao_anos'])]
    ref = ref.sort_values('semana_inicio').drop_duplicates('codigo_ibge', keep='last')
    escolhidos = []
    for _, grupo in ref.groupby(['uf', 'porte'], observed=True):
        codigos = sorted(grupo.codigo_ibge.astype(str), key=lambda c:
                         hashlib.sha256(f'{cfg["semente"]}:{c}'.encode()).hexdigest())
        n = int(np.floor(len(codigos) * cfg['treino']['fracao_municipios_reservados']))
        if len(codigos) >= 5 and cfg['treino']['fracao_municipios_reservados'] > 0:
            n = max(n, 1)
        escolhidos.extend(codigos[:n])
    salvar_json(arquivo(cfg, 'ouro', 'municipios_reservados.json'), sorted(escolhidos))
    return set(escolhidos)
