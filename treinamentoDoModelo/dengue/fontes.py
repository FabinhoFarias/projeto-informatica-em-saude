from __future__ import annotations

import io
import json
import re
import unicodedata
import zipfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import timedelta
from pathlib import Path
from urllib.parse import urlencode, urljoin

import numpy as np
import pandas as pd
from pyproj import Geod
from shapely import STRtree, make_valid
from shapely.geometry import shape

from .base import (LOG, UFS, arquivo, baixar, calendario, inicio_semana,
                   json_baixado, numero, resolver, salvar_json, salvar_parquet)

IBGE = 'https://servicodados.ibge.gov.br/api'
CLIMA = ['temperatura', 'umidade', 'precipitacao']


def geografia(cfg):
    """Códigos oficiais + malha fixa. Não inventa códigos de municípios antigos."""
    rows, geometries = [], {}
    geod = Geod(ellps='GRS80')
    periodo = cfg['geografia']['periodo']

    def obter_uf(uf):
        locais = json_baixado(cfg, f'{IBGE}/v1/localidades/estados/{uf}/municipios',
                              f'municipios_{uf}.json')
        params = urlencode({'formato': 'application/vnd.geo+json', 'qualidade':
                            cfg['geografia']['qualidade'], 'intrarregiao': 'municipio',
                            'periodo': periodo})
        malha = json_baixado(cfg, f'{IBGE}/v3/malhas/estados/{uf}?{params}',
                            f'malha_{uf}_{periodo}.geojson')
        return uf, locais, malha

    with ThreadPoolExecutor(max_workers=max(1, min(4, cfg['threads']))) as pool:
        referencias = list(pool.map(obter_uf, cfg['ufs']))
    for uf, locais, malha in referencias:
        por_codigo = {str(f['properties']['codarea']): make_valid(shape(f['geometry']))
                      for f in malha['features']}
        for mun in locais:
            cod = str(mun['id'])
            if cfg['municipios'] and cod not in cfg['municipios']:
                continue
            if cod not in por_codigo:
                raise ValueError(f'Município {cod} ausente na malha {periodo}. '
                                 'Forneça uma referência territorial compatível.')
            geom = por_codigo[cod]
            centro = geom.centroid
            # Aproximação geodésica da malha simplificada; não área oficial IBGE.
            area = abs(geod.geometry_area_perimeter(geom)[0]) / 1e6
            if area <= 0 or not np.isfinite(area):
                raise ValueError(f'Geometria inválida de {cod}')
            rows.append({'codigo_ibge': cod, 'codigo_sinan': cod[:6],
                         'nome': mun['nome'], 'uf': uf, 'uf_sigla': UFS[uf],
                         'latitude': centro.y, 'longitude': centro.x,
                         'area_km2': area, 'malha_ano': periodo})
            geometries[cod] = geom
    dim = pd.DataFrame(rows).sort_values('codigo_ibge').reset_index(drop=True)
    if dim.empty or dim['codigo_sinan'].duplicated().any():
        raise ValueError('Dimensão municipal vazia ou vínculo SINAN ambíguo.')
    if cfg['municipios'] and set(cfg['municipios']) - set(dim.codigo_ibge):
        raise ValueError('Municípios solicitados não encontrados nas UFs configuradas.')
    salvar_parquet(dim, arquivo(cfg, 'prata', 'municipios.parquet'))
    codes = dim.codigo_ibge.tolist()
    gs = [geometries[c] for c in codes]
    tree = STRtree(gs)
    edges = []
    for i, g in enumerate(gs):
        # Interseção inclui contiguidade por vértice (queen). Sem buffer inventado.
        for j in tree.query(g, predicate='intersects'):
            if i != j:
                edges.append((codes[i], codes[j]))
    viz = pd.DataFrame(edges, columns=['codigo_ibge', 'vizinho'])
    salvar_parquet(viz, arquivo(cfg, 'prata', 'vizinhos.parquet'))
    salvar_json(arquivo(cfg, 'relatorios', 'geografia.json'), {
        'municipios': len(dim), 'arestas_direcionadas': len(viz), 'malha_ano': periodo,
        'area': 'aproximacao_geodesica_malha_simplificada',
        'fronteiras': 'referencia_fixa; nao reconstrucao historica',
        'municipios_sem_vizinhos': sorted(set(codes) - set(viz.codigo_ibge)),
    })
    return dim


def series_ibge(resposta, variavel):
    rows = []
    for bloco in resposta:
        if str(bloco.get('id')) != str(variavel):
            continue
        for resultado in bloco['resultados']:
            for serie in resultado['series']:
                codigo = str(serie['localidade']['id'])
                for ano, valor in serie['serie'].items():
                    rows.append((codigo, int(ano), valor))
    return rows


def populacao(cfg, dim):
    rows = []
    areas = []
    for tabela, variavel in [('6579', '9324'), ('4714', '93')]:
        base = f'{IBGE}/v3/agregados/{tabela}'
        periodos = json_baixado(cfg, base + '/periodos', f'periodos_{tabela}.json')
        anos = sorted(int(p['id']) for p in periodos if str(p['id']).isdigit()
                      and cfg['populacao']['ano_ancora_inicio'] <= int(p['id']) <= cfg['ano_fim'])
        if tabela == '4714':
            anos = [a for a in anos if a == 2022]
        if not anos:
            raise ValueError(f'Sem períodos elegíveis na tabela IBGE {tabela}')
        # Uma requisição por UF/âncora, evitando limite da API e 1.794 chamadas.
        def obter_pop_uf(uf):
            params = urlencode({'localidades': f'N6[N3[{uf}]]'})
            vars_query = variavel if tabela != '4714' else '93|6318'
            url = base + '/periodos/' + '|'.join(map(str, anos)) + f'/variaveis/{vars_query}?{params}'
            data = json_baixado(cfg, url, f'populacao_{tabela}_{uf}.json')
            return data

        with ThreadPoolExecutor(max_workers=max(1, min(4, cfg['threads']))) as pool:
            respostas = list(pool.map(obter_pop_uf, cfg['ufs']))
        for data in respostas:
            for cod, ano, valor in series_ibge(data, variavel):
                rows.append((cod, ano, valor, tabela))
            if tabela == '4714':
                areas.extend(series_ibge(data, '6318'))
    pop = pd.DataFrame(rows, columns=['codigo_ibge', 'ano_populacao', 'populacao', 'tabela'])
    pop = pop[pop.codigo_ibge.isin(dim.codigo_ibge)].copy()
    pop['populacao'] = numero(pop['populacao'])
    pop = pop[pop.populacao.gt(0)]
    if pop.duplicated(['codigo_ibge', 'ano_populacao']).any():
        raise ValueError('População duplicada: tabela/ano ambíguo. Revisar fonte.')
    pop['disponivel_em'] = (pd.to_datetime(pop.ano_populacao.astype(str) + '-01-01') +
                           pd.to_timedelta(cfg['populacao']['defasagem_publicacao_dias'], unit='D'))
    # A divulgação do Censo 2022 ocorreu só em junho/2023: janeiro/2023
    # não é uma hipótese conservadora para essa âncora específica.
    censo = pop.tabela.eq('4714')
    limite_censo = pd.Timestamp(cfg['populacao'].get('censo2022_disponivel_em', '2023-06-28'))
    pop.loc[censo, 'disponivel_em'] = pop.loc[censo, 'disponivel_em'].clip(lower=limite_censo)
    salvar_parquet(pop, arquivo(cfg, 'prata', 'populacao.parquet'))
    area = pd.DataFrame(areas, columns=['codigo_ibge', 'ano_area', 'area_oficial_km2'])
    area['area_oficial_km2'] = numero(area['area_oficial_km2'])
    if area.codigo_ibge.duplicated().any():
        raise ValueError('Área oficial duplicada.')
    enriquecida = dim.merge(area, on='codigo_ibge', how='left', validate='one_to_one')
    enriquecida['area_aproximada'] = enriquecida.area_oficial_km2.isna().astype('int8')
    enriquecida['area_km2'] = enriquecida.area_oficial_km2.combine_first(enriquecida.area_km2)
    salvar_parquet(enriquecida, arquivo(cfg, 'prata', 'municipios.parquet'))
    return pop


def agregar_clima_diario(df, min_dias=6):
    df = df.copy()
    df['data'] = pd.to_datetime(df['data'])
    if df.data.duplicated().any():
        raise ValueError('Datas climáticas duplicadas no ponto/estação.')
    df['semana_inicio'] = inicio_semana(df['data'])
    for c in CLIMA:
        df[c] = pd.to_numeric(df[c], errors='coerce')
    df.loc[~df.temperatura.between(-20, 55), 'temperatura'] = np.nan
    df.loc[~df.umidade.between(0, 100), 'umidade'] = np.nan
    df.loc[~df.precipitacao.between(0, 2000), 'precipitacao'] = np.nan
    g = df.groupby('semana_inicio')
    out = g.agg(temperatura=('temperatura', 'mean'), umidade=('umidade', 'mean'),
                precipitacao=('precipitacao', lambda s: s.sum(min_count=7)))
    for c in CLIMA:
        out[c + '_dias'] = g[c].count()
        # Não extrapola chuva parcial para uma semana inteira.
        minimo = 7 if c == 'precipitacao' else min_dias
        out.loc[out[c + '_dias'].lt(minimo), c] = np.nan
    return out.reset_index()


def clima_power(cfg, dim):
    cal = calendario(cfg['ano_inicio'], cfg['ano_fim'])
    start, end = cal.semana_inicio.min(), cal.semana_fim.max()
    lat_step, lon_step = cfg['clima']['lat_grade'], cfg['clima']['lon_grade']
    if lat_step < 0.5 or lon_step < 0.625:
        raise ValueError('Não solicitar grade mais fina que os dados meteorológicos POWER.')
    pontos = dim[['codigo_ibge', 'latitude', 'longitude']].copy()
    pontos['lat_ponto'] = (pontos.latitude / lat_step).round() * lat_step
    pontos['lon_ponto'] = (pontos.longitude / lon_step).round() * lon_step
    pontos['ponto'] = pontos.apply(lambda r: f'{r.lat_ponto:.4f}_{r.lon_ponto:.4f}', axis=1)
    unicos = pontos.drop_duplicates('ponto')
    salvar_parquet(pontos, arquivo(cfg, 'prata', 'municipio_ponto_clima.parquet'))
    LOG.info('Clima POWER: %d municípios compartilham %d pontos; %d workers.',
             len(dim), len(unicos), min(4, cfg['clima']['workers']))

    def obter(r):
        params = {'parameters': 'T2M,RH2M,PRECTOTCORR', 'community': 'AG',
                  'latitude': r.lat_ponto, 'longitude': r.lon_ponto,
                  'start': start.strftime('%Y%m%d'), 'end': end.strftime('%Y%m%d'),
                  'format': 'JSON', 'time-standard': 'UTC'}
        raw = json_baixado(cfg, 'https://power.larc.nasa.gov/api/temporal/daily/point?' +
                          urlencode(params), f'power/{r.ponto}_{cfg["ano_inicio"]}_{cfg["ano_fim"]}.json')
        valores = raw['properties']['parameter']
        diarios = pd.DataFrame({c: valores[k] for c, k in zip(CLIMA, ['T2M', 'RH2M', 'PRECTOTCORR'])})
        diarios = diarios.replace(raw.get('header', {}).get('fill_value', -999), np.nan)
        diarios['data'] = pd.to_datetime(diarios.index, format='%Y%m%d')
        semanal = agregar_clima_diario(diarios, cfg['clima']['min_dias'])
        semanal['ponto'] = r.ponto
        return semanal

    resultados = []
    with ThreadPoolExecutor(max_workers=max(1, min(4, cfg['clima']['workers']))) as pool:
        futuros = {pool.submit(obter, r): r.ponto for r in unicos.itertuples()}
        for i, futuro in enumerate(as_completed(futuros), 1):
            resultados.append(futuro.result())  # Erro externo aborta; não vira clima zero.
            if i % 10 == 0 or i == len(futuros):
                LOG.info('Clima: %d/%d pontos completos.', i, len(futuros))
    clima = pd.concat(resultados, ignore_index=True)
    clima = pontos[['codigo_ibge', 'ponto']].merge(clima, on='ponto', validate='many_to_many')
    clima['fonte_clima'] = 'NASA_POWER_UTC'
    _, _, dist = Geod(ellps='GRS80').inv(pontos.longitude.tolist(), pontos.latitude.tolist(),
                                        pontos.lon_ponto.tolist(), pontos.lat_ponto.tolist())
    pontos['distancia_clima_km'] = np.asarray(dist) / 1000
    clima = clima.merge(pontos[['codigo_ibge', 'distancia_clima_km']], on='codigo_ibge', validate='many_to_one')
    return clima


def normalizar(s):
    return unicodedata.normalize('NFKD', str(s)).encode('ascii', 'ignore').decode().upper()


def ler_estacao_inmet(z, nome, cfg):
    with z.open(nome) as f:
        text = io.TextIOWrapper(f, encoding='latin-1')
        meta = {}
        for _ in range(30):
            linha = text.readline()
            if not linha:
                return None
            campos = normalizar(linha).split(';')
            if campos[0].strip().startswith('DATA') and len(campos) > 1 and 'HORA' in campos[1]:
                header = linha
                break
            k, _, v = linha.partition(';')
            meta[normalizar(k).strip(': \r\n')] = v.strip(' ;\r\n')
        else:
            raise ValueError(f'Cabeçalho INMET não reconhecido em {nome}')
        if meta.get('UF') not in UFS.values():
            return None
        lat = float(meta['LATITUDE'].replace(',', '.'))
        lon = float(meta['LONGITUDE'].replace(',', '.'))
        station = meta.get('CODIGO (WMO)', nome)
        dados = pd.read_csv(io.StringIO(header + text.read()), sep=';', decimal=',',
                            na_values=[-9999, '-9999', '', 'NULL'], low_memory=False)
    cols = {normalizar(c): c for c in dados.columns}
    def procurar(prefixo):
        achados = [v for k, v in cols.items() if k.startswith(prefixo)]
        if len(achados) != 1:
            raise ValueError(f'Coluna INMET {prefixo}: {achados} em {nome}')
        return achados[0]
    data_col = procurar('DATA')
    datas = pd.to_datetime(dados[data_col], format='%Y-%m-%d', errors='coerce')
    datas = datas.fillna(pd.to_datetime(dados[data_col], format='%Y/%m/%d', errors='coerce'))
    df = pd.DataFrame({'data': datas,
                       'temperatura': numero(dados[procurar('TEMPERATURA DO AR - BULBO SECO')]),
                       'umidade': numero(dados[procurar('UMIDADE RELATIVA DO AR, HORARIA')]),
                       'precipitacao': numero(dados[procurar('PRECIPITACAO TOTAL, HORARIO')])})
    if df.data.isna().any():
        raise ValueError(f'Data INMET inválida em {nome}')
    # Validação por hora antes das médias: sentinela não contamina o agregado.
    for c, a, b in [('temperatura', -20, 55), ('umidade', 0, 100), ('precipitacao', 0, 500)]:
        df.loc[~df[c].between(a, b), c] = np.nan
    df['semana_inicio'] = inicio_semana(df.data)
    g = df.groupby('semana_inicio')
    out = g[CLIMA].mean()
    out['precipitacao'] = g.precipitacao.sum(min_count=1)
    for c in CLIMA:
        out[c + '_dias'] = g[c].count() / 24
    out['latitude'], out['longitude'], out['estacao'] = lat, lon, station
    return out.reset_index()


def clima_inmet(cfg, dim):
    zips = cfg['clima']['inmet_zips']
    if not zips:
        portal = baixar(cfg, 'https://portal.inmet.gov.br/dadoshistoricos', 'inmet_portal.html')
        links = re.findall(r'''href=["']([^"']+\.zip[^"']*)["']''', portal.read_text(encoding='utf-8'), re.I)
        zips = []
        # Anos de borda permitem completar semanas que atravessam dezembro/janeiro.
        cal = calendario(cfg['ano_inicio'], cfg['ano_fim'])
        for ano in range(cal.semana_inicio.min().year, cal.semana_fim.max().year + 1):
            candidatos = [urljoin('https://portal.inmet.gov.br/', x) for x in links
                          if re.search(rf'(?<!\d){ano}(?!\d)', x)]
            if not candidatos:
                raise ValueError(f'ZIP INMET {ano} não encontrado. Configure inmet_zips explicitamente.')
            zips.append(candidatos[0])

    def processar(i, origem):
        path = baixar(cfg, origem, f'inmet/{i}.zip') if origem.startswith('https://') else resolver(origem)
        partes = []
        with zipfile.ZipFile(path) as z:
            for nome in z.namelist():
                if nome.lower().endswith('.csv') and not nome.startswith('__MACOSX'):
                    df = ler_estacao_inmet(z, nome, cfg)
                    if df is not None:
                        partes.append(df)
        if not partes:
            raise ValueError(f'Sem estações nordestinas em {path}')
        return pd.concat(partes, ignore_index=True)

    with ThreadPoolExecutor(max_workers=max(1, min(2, cfg['clima']['inmet_workers']))) as pool:
        est = pd.concat(list(pool.map(lambda x: processar(*x), enumerate(zips))), ignore_index=True)
    # Semanas de virada de ano têm contribuições de dois ZIPs: ponderar cobertura.
    combinadas = []
    for c in CLIMA:
        est[c + '_peso'] = est[c] * est[c + '_dias']
    for (sid, semana), grupo in est.groupby(['estacao', 'semana_inicio'], sort=False):
        r = {'estacao': sid, 'semana_inicio': semana, 'latitude': grupo.latitude.iloc[0],
             'longitude': grupo.longitude.iloc[0]}
        for c in CLIMA:
            dias = grupo[c + '_dias'].sum()
            r[c + '_dias'] = min(7., dias)
            r[c] = (grupo[c].sum(min_count=1) if c == 'precipitacao' else
                    grupo[c + '_peso'].sum(min_count=1) / dias if dias > 0 else np.nan)
            if dias < 7 * cfg['clima']['inmet_min_cobertura']:
                r[c] = np.nan
        combinadas.append(r)
    est = pd.DataFrame(combinadas)
    salvar_parquet(est, arquivo(cfg, 'prata', 'estacoes_inmet.parquet'))
    stations = est.drop_duplicates('estacao')[['estacao', 'latitude', 'longitude']]
    geod = Geod(ellps='GRS80')
    out = []
    for r in dim.itertuples():
        _, _, distances = geod.inv([r.longitude]*len(stations), [r.latitude]*len(stations),
                                   stations.longitude.tolist(), stations.latitude.tolist())
        order = np.argsort(distances)[:cfg['clima']['inmet_estacoes']]
        order = [i for i in order if distances[i] / 1000 <= cfg['clima']['inmet_raio_km']]
        if not order:
            continue
        candidates = stations.iloc[order].copy()
        candidates['peso'] = 1 / np.maximum(np.asarray(distances)[order] / 1000, 1.) ** 2
        selected = est.merge(candidates[['estacao', 'peso']], on='estacao', validate='many_to_one')
        selected['distancia_clima_km'] = min(np.asarray(distances)[order]) / 1000
        for c in CLIMA:
            selected[c + '_numerador'] = selected[c] * selected.peso
            selected[c + '_denominador'] = selected.peso.where(selected[c].notna())
        g = selected.groupby('semana_inicio')
        agg = pd.DataFrame(index=g.size().index)
        for c in CLIMA:
            agg[c] = g[c + '_numerador'].sum(min_count=1) / g[c + '_denominador'].sum(min_count=1)
            agg[c + '_dias'] = g[c + '_dias'].max()
        agg['codigo_ibge'], agg['ponto'], agg['fonte_clima'] = r.codigo_ibge, 'IDW_INMET', 'INMET_UTC'
        agg['distancia_clima_km'] = selected.distancia_clima_km.iloc[0]
        out.append(agg.reset_index())
    if not out:
        raise ValueError('Nenhum município com estação INMET no raio configurado.')
    return pd.concat(out, ignore_index=True)


def clima(cfg, dim):
    provedor = cfg['clima']['provedor']
    if provedor == 'nenhum':
        LOG.warning('Ablação explícita: clima desativado.')
        return
    df = clima_power(cfg, dim) if provedor == 'nasa_power' else clima_inmet(cfg, dim)
    if df.duplicated(['codigo_ibge', 'semana_inicio']).any():
        raise ValueError('Clima duplicado após agregação.')
    salvar_parquet(df, arquivo(cfg, 'prata', 'clima.parquet'))
    salvar_json(arquivo(cfg, 'relatorios', 'clima.json'), {
        'provedor': provedor, 'linhas': len(df), 'municipios': df.codigo_ibge.nunique(),
        'ausencias_por_variavel': {c: float(df[c].isna().mean()) for c in CLIMA},
        'timezone': 'UTC', 'precipitacao': 'soma; sem extrapolar períodos incompletos',
    })


def preparar_fontes(cfg):
    dim = geografia(cfg)
    populacao(cfg, dim)
    clima(cfg, dim)
    return dim
