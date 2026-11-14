from __future__ import annotations

import json
import shutil
import copy
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from catboost import CatBoostClassifier, CatBoostRegressor
from sklearn.metrics import (average_precision_score, brier_score_loss,
                             mean_absolute_error, mean_squared_error,
                             precision_recall_curve, precision_recall_fscore_support)

from .atributos import ImputadorTreino
from .modelos_adicionais import ModeloAdicional, TIPOS as TIPOS_ADICIONAIS
from .base import (LOG, ambiente, arquivo, config_preparo, inicio_ano_epi, salvar_json,
                   salvar_parquet, sha256)


def smote_baixo(cfg, x, y, categoricas):
    """SMOTENC pequeno, por UF e somente no treino do classificador Hurdle."""
    # `y` é posicional. Os folds preservam o índice do painel original, então
    # normalizamos antes de separar as UFs para não desalinhá-los.
    x = x.reset_index(drop=True)
    conf = cfg['treino'].get('smote', {})
    y = np.asarray(y, dtype=int)
    antes = {'linhas': int(len(y)), 'positivos': int(y.sum()), 'negativos': int((y == 0).sum())}
    if not conf.get('habilitado', False):
        return x, y, {**antes, 'habilitado': False, 'sinteticos': 0}
    try:
        from imblearn.over_sampling import SMOTENC
    except ImportError as erro:
        raise ImportError('Instale imbalanced-learn: python -m pip install -r treinamentoDoModelo/requirements.txt') from erro
    alvo = float(conf['razao_pos_neg_max'])
    if not 0 < alvo <= 1:
        raise ValueError('smote.razao_pos_neg_max deve estar entre 0 e 1.')
    k = int(conf['k_vizinhos'])
    if k < 1:
        raise ValueError('smote.k_vizinhos deve ser >= 1.')
    cat_idx = [x.columns.get_loc(c) for c in categoricas]
    partes_x, partes_y, grupos = [], [], {}
    # Uma UF não mistura padrões climáticos/territoriais diretamente com outra.
    for i, (uf, grupo) in enumerate(x.groupby('uf', sort=True, observed=True)):
        labels = y[grupo.index.to_numpy()]
        positivos, negativos = int(labels.sum()), int((labels == 0).sum())
        desejado = int(np.ceil(alvo * negativos))
        adicionar = min(max(0, desejado - positivos), int(conf['max_sinteticos_por_uf']))
        if adicionar == 0 or positivos < k + 1 or negativos == 0:
            partes_x.append(grupo)
            partes_y.append(labels)
            grupos[str(uf)] = {'originais': len(grupo), 'positivos': positivos, 'sinteticos': 0}
            continue
        estrategia = {1: positivos + adicionar}
        sampler = SMOTENC(categorical_features=cat_idx, sampling_strategy=estrategia,
                           k_neighbors=k, random_state=cfg['semente'] + i)
        # DataFrame preserva os nomes; categorias nunca são interpoladas como números.
        gx, gy = sampler.fit_resample(grupo, labels)
        gx = pd.DataFrame(gx, columns=x.columns)
        for c in categoricas:
            gx[c] = gx[c].astype(str)
        for c in x.columns:
            if c not in categoricas:
                gx[c] = pd.to_numeric(gx[c], errors='raise')
        partes_x.append(gx)
        partes_y.append(np.asarray(gy, dtype=int))
        grupos[str(uf)] = {'originais': len(grupo), 'positivos': positivos,
                            'sinteticos': int(len(gy)-len(labels))}
    out_x = pd.concat(partes_x, ignore_index=True)
    out_y = np.concatenate(partes_y)
    return out_x, out_y, {**antes, 'habilitado': True, 'sinteticos': int(len(out_y)-len(y)),
                           'depois_linhas': int(len(out_y)), 'depois_positivos': int(out_y.sum()),
                           'por_uf': grupos, 'razao_maxima': alvo, 'k_vizinhos': k,
                           'observacao': 'SMOTENC só no classificador; regressão usa positivos reais.'}


def metricas(y, pred, pop=None):
    y, pred = np.asarray(y, dtype=float), np.maximum(np.asarray(pred, dtype=float), 0)
    if not len(y):
        return {'n': 0}
    result = {'n': len(y), 'mae': float(mean_absolute_error(y, pred)),
              'rmse': float(np.sqrt(mean_squared_error(y, pred))),
              'wape': float(np.abs(y-pred).sum()/y.sum()) if y.sum() > 0 else None,
              'rmsle': float(np.sqrt(np.mean((np.log1p(y)-np.log1p(pred))**2)))}
    if pop is not None:
        pop = np.asarray(pop, dtype=float)
        ok = np.isfinite(pop) & (pop > 0)
        result['mae_incidencia_100k'] = float(np.mean(np.abs(y[ok]-pred[ok])/pop[ok]*100000)) if ok.any() else None
    return result


def avaliar(df, y, pred, lower=None, upper=None, threshold=None, prob=None):
    y, pred = np.asarray(y, float), np.maximum(np.asarray(pred, float), 0)
    out = {'global': metricas(y, pred, df.populacao)}
    tmp = df[['codigo_ibge', 'uf', 'porte', 'populacao']].copy()
    tmp['y'], tmp['pred'] = y, pred
    out['macro_mae'] = float(pd.Series(np.abs(y-pred), index=tmp.index).groupby(tmp.codigo_ibge, observed=True).mean().mean())
    out['por_uf'], out['por_porte'] = {}, {}
    for coluna, destino in [('uf', 'por_uf'), ('porte', 'por_porte')]:
        for key, g in tmp.groupby(coluna, observed=True):
            out[destino][str(key)] = metricas(g.y, g.pred, g.populacao)
    out['semanas_zero'] = metricas(y[y == 0], pred[y == 0])
    out['semanas_positivas'] = metricas(y[y > 0], pred[y > 0])
    if lower is not None:
        out['intervalo'] = {'cobertura': float(np.mean((y >= lower) & (y <= upper))),
                           'largura_media': float(np.mean(upper-lower))}
    if threshold is not None:
        actual = y > threshold
        forecast = prob >= 0.5 if prob is not None else pred > threshold
        precision, recall, f1, _ = precision_recall_fscore_support(actual, forecast, average='binary', zero_division=0)
        out['alerta_experimental'] = {'precision': float(precision), 'recall': float(recall), 'f1': float(f1),
                                     'falsos_positivos': int(np.sum(forecast & ~actual)),
                                     'positivos': int(actual.sum())}
        if prob is not None:
            out['alerta_experimental']['brier'] = float(brier_score_loss(actual, prob))
            out['alerta_experimental']['pr_auc'] = float(average_precision_score(actual, prob)) if actual.any() else None
    return out


def metricas_ocorrencia(y, prob, limiar=0.5):
    """Métricas da classe rara y>0, sem escolher limiar no conjunto de teste."""
    y = (np.asarray(y, dtype=float) > 0).astype(int)
    prob = np.clip(np.asarray(prob, dtype=float), 0, 1)
    previsto = prob >= limiar
    precision, recall, f1, _ = precision_recall_fscore_support(
        y, previsto, average='binary', zero_division=0)
    return {
        'positivos': int(y.sum()),
        'prevalencia': float(y.mean()) if len(y) else None,
        'precision': float(precision), 'recall': float(recall), 'f1': float(f1),
        'pr_auc': float(average_precision_score(y, prob)) if y.any() else None,
        'brier': float(brier_score_loss(y, prob)) if len(y) else None,
    }


def calibrar_limiar_ocorrencia(cfg, modelo, dados, y):
    """Escolhe o menor corte que mantém a precisão mínima no bloco de calibração."""
    conf = cfg['treino'].get('ocorrencia', {})
    piso = float(conf.get('precisao_minima', 0.35))
    padrao = float(conf.get('limiar_padrao', 0.5))
    atual = (np.asarray(y, dtype=float) > 0).astype(int)
    prob = modelo.predict_ocorrencia(dados)
    if not atual.any():
        modelo.limiar_ocorrencia = padrao
        modelo.calibracao_ocorrencia = {'motivo': 'calibracao_sem_positivos', 'limiar': padrao}
        return
    precision, recall, limiares = precision_recall_curve(atual, prob)
    # limiares[i] corresponde a precision/recall[i]; o último ponto não tem corte.
    # maximiza recall sem escolher o limiar nos dados de validação/teste.
    elegiveis = np.flatnonzero(precision[:-1] >= piso)
    if len(elegiveis):
        i = elegiveis[np.argmax(recall[:-1][elegiveis])]
        corte = float(limiares[i])
    else:
        corte = padrao
    modelo.limiar_ocorrencia = corte
    modelo.calibracao_ocorrencia = {
        'limiar': corte, 'precisao_minima': piso,
        'precision_calibracao': float(precision[i]) if len(elegiveis) else None,
        'recall_calibracao': float(recall[i]) if len(elegiveis) else None,
    }


class Candidato:
    def __init__(self, cfg, tipo):
        self.cfg, self.tipo = cfg, tipo

    def _parametros(self, iterations):
        t = self.cfg['treino']
        progresso = t.get('progresso', {})
        return dict(iterations=iterations, depth=t['depth'], learning_rate=t['learning_rate'],
                    l2_leaf_reg=t['l2_leaf_reg'], thread_count=self.cfg['threads'],
                    random_seed=self.cfg['semente'], allow_writing_files=False,
                    verbose=int(progresso.get('intervalo_arvores', 50)) if progresso.get('mostrar') else False)

    def fit(self, df, y, numericas, categoricas, data_alvo=None):
        if self.tipo == 'arima':
            if data_alvo is None:
                raise ValueError('ARIMA precisa da coluna com as datas dos alvos.')
            self.data_alvo = data_alvo
            self.adicional = ModeloAdicional(self.tipo, self.cfg).fit(
                df[['uf', 'populacao']], np.asarray(y, float), [], [],
                datas=df[data_alvo])
            self.smote = self.adicional.smote
            self.iterations = None
            return self
        if self.tipo in TIPOS_ADICIONAIS:
            self.imputador = ImputadorTreino().fit(df, numericas, categoricas)
            x_adicional = self.imputador.transform(df)
            self.adicional = ModeloAdicional(self.tipo, self.cfg).fit(
                x_adicional, np.asarray(y, float),
                [c for c in x_adicional if c not in categoricas], categoricas)
            self.smote = self.adicional.smote
            self.iterations = None
            return self
        # Cauda interna para early stopping. A calibração externa fica intocada.
        datas = np.sort(df.semana_inicio.unique())
        if len(datas) < 30:
            raise ValueError('Treino insuficiente: precisa de >=30 semanas distintas.')
        boundary = datas[-min(13, len(datas)//4)]
        prefixo = df.semana_inicio < boundary
        self.imputador = ImputadorTreino().fit(df[prefixo], numericas, categoricas)
        x = self.imputador.transform(df)
        y = np.asarray(y, dtype=float)
        params = self._parametros(self.cfg['treino']['iterations'])
        if self.cfg['treino'].get('treinamento_rapido', False):
            # Um ajuste completo por candidato/fold. Evita o piloto + ajuste final,
            # que dobrava o trabalho para escolher o número de árvores.
            iterations = int(self.cfg['treino']['iterations'])
        else:
            piloto = CatBoostRegressor(loss_function='Poisson', **params)
            piloto.fit(x[prefixo], y[prefixo], cat_features=categoricas,
                       eval_set=(x[~prefixo], y[~prefixo]),
                       early_stopping_rounds=self.cfg['treino']['early_stopping_rounds'])
            iterations = max(1, piloto.tree_count_)
        self.imputador = ImputadorTreino().fit(df, numericas, categoricas)
        x = self.imputador.transform(df)
        params = self._parametros(iterations)
        if self.tipo == 'poisson':
            if self.cfg['treino'].get('progresso', {}).get('mostrar'):
                LOG.info('CatBoost Poisson: ajustando regressor de contagem (%d linhas).', len(x))
            self.regressor = CatBoostRegressor(loss_function='Poisson', **params)
            self.regressor.fit(x, y, cat_features=categoricas)
        elif self.tipo == 'hurdle':
            positivos = y > 0
            if positivos.sum() < 20 or (~positivos).sum() < 20:
                raise ValueError('Hurdle precisa de pelo menos 20 positivos e 20 zeros no treino.')
            x_smote, y_smote, self.smote = smote_baixo(self.cfg, x, positivos.astype(int), categoricas)
            peso = float(self.cfg['treino'].get('peso_classe_positiva', 1.0))
            if peso < 1:
                raise ValueError('peso_classe_positiva deve ser >= 1.')
            params_classificador = dict(params)
            if peso != 1:
                params_classificador['class_weights'] = [1.0, peso]
            self.classificador = CatBoostClassifier(loss_function='Logloss', **params_classificador)
            if self.cfg['treino'].get('progresso', {}).get('mostrar'):
                LOG.info('CatBoost Hurdle: ajustando classificador (%d linhas).', len(x_smote))
            self.classificador.fit(x_smote, y_smote, cat_features=categoricas)
            self.smote['peso_classe_positiva'] = peso
            if self.cfg['treino'].get('progresso', {}).get('mostrar'):
                LOG.info('CatBoost Hurdle: ajustando regressor (%d semanas positivas).', int(positivos.sum()))
            self.regressor = CatBoostRegressor(loss_function='Poisson', **params)
            self.regressor.fit(x[positivos], y[positivos], cat_features=categoricas)
        else:
            raise ValueError(f'Candidato desconhecido {self.tipo}')
        self.iterations = iterations
        if self.tipo == 'poisson':
            self.smote = {'habilitado': False, 'motivo': 'modelo_de_contagem_sem_classificador'}
        return self

    def predict(self, df):
        if self.tipo == 'arima':
            pred = self.adicional.predict(df[['uf', 'populacao']], df[self.data_alvo])
            if not np.isfinite(pred).all():
                raise ValueError('Previsão ARIMA não finita.')
            return np.maximum(pred, 0.)
        x = self.imputador.transform(df)
        if self.tipo in TIPOS_ADICIONAIS:
            pred = self.adicional.predict(x)
            if not np.isfinite(pred).all():
                raise ValueError('Previsão não finita. Modelo não pode ser publicado.')
            return pred
        # CatBoost Poisson predict padrão é log(mu); Exponent fornece mu.
        pred = self.regressor.predict(x, prediction_type='Exponent')
        if self.tipo == 'hurdle':
            pred *= self.classificador.predict_proba(x)[:, 1]
        if not np.isfinite(pred).all():
            raise ValueError('Previsão não finita. Modelo não pode ser publicado.')
        return np.maximum(pred, 0.)

    def predict_ocorrencia(self, df):
        if self.tipo == 'arima':
            return self.adicional.predict_ocorrencia(
                df[['uf', 'populacao']], df[self.data_alvo])
        if self.tipo in TIPOS_ADICIONAIS:
            return self.adicional.predict_ocorrencia(self.imputador.transform(df))
        if self.tipo != 'hurdle':
            raise ValueError('Probabilidade de ocorrência só existe no modelo Hurdle.')
        return self.classificador.predict_proba(self.imputador.transform(df))[:, 1]

    def explicacao(self):
        if self.tipo in TIPOS_ADICIONAIS:
            return self.adicional.explicacao()
        if self.tipo == 'hurdle':
            valores = self.classificador.get_feature_importance()
            nomes = self.classificador.feature_names_
        else:
            valores = self.regressor.get_feature_importance()
            nomes = self.regressor.feature_names_
        ordem = np.argsort(-np.abs(valores))[:30]
        return {'metodo': 'importancia_CatBoost', 'top_atributos': [
            {'atributo': str(nomes[i]), 'valor': float(valores[i])} for i in ordem]}


def ajustar_calibracao(cfg, modelo, dados, y):
    pred = modelo.predict(dados)
    residuo = np.asarray(y) - pred
    alpha = cfg['treino']['cobertura_intervalo']
    def quantil(r):
        nivel = min(1., np.ceil((len(r)+1)*alpha)/len(r))
        return float(np.quantile(np.abs(r), nivel, method='higher'))
    if len(residuo) < 30:
        raise ValueError('Calibração insuficiente: menos de 30 linhas.')
    modelo.calibracao = {'global': quantil(residuo), 'por_uf': {}, 'residuos': {}}
    modelo.calibracao['residuos']['global'] = np.sort(residuo)
    for uf in dados.uf.unique():
        r = residuo[dados.uf.to_numpy() == uf]
        if len(r) >= 100:
            modelo.calibracao['por_uf'][str(uf)] = quantil(r)
            modelo.calibracao['residuos'][str(uf)] = np.sort(r)


def prever_com_intervalos(modelo, dados, threshold):
    pred = modelo.predict(dados)
    q = dados.uf.astype(str).map(modelo.calibracao['por_uf']).fillna(modelo.calibracao['global']).to_numpy()
    prob = np.zeros(len(dados))
    for uf in dados.uf.astype(str).unique():
        mask = dados.uf.astype(str).to_numpy() == uf
        resid = modelo.calibracao['residuos'].get(uf, modelo.calibracao['residuos']['global'])
        # Distribuição residual empírica; checar calibração prospectiva depois.
        prob[mask] = 1 - np.searchsorted(resid, threshold[mask] - pred[mask], side='right') / len(resid)
    return pred, np.maximum(0., pred-q), pred+q, prob


def limiares(cfg, treino, y):
    d = treino[['codigo_ibge', 'uf']].copy()
    d['y'] = np.asarray(y)
    q = cfg['treino']['alerta_quantil']
    minimo = cfg['treino']['alerta_min_casos']
    return {'municipio': d.groupby('codigo_ibge', observed=True).y.quantile(q).clip(lower=minimo).to_dict(),
            'uf': d.groupby('uf', observed=True).y.quantile(q).clip(lower=minimo).to_dict(),
            'global': float(max(minimo, d.y.quantile(q)))}


def aplicar_limiar(dados, limites):
    return dados.codigo_ibge.map(limites['municipio']).fillna(dados.uf.map(limites['uf'])).fillna(limites['global']).to_numpy(float)


def carregar_dados(cfg):
    p = pd.read_parquet(arquivo(cfg, 'ouro', 'atributos.parquet'))
    for c in ['codigo_ibge', 'uf', 'porte']:
        p[c] = p[c].astype(str)
    schema = json.loads(arquivo(cfg, 'ouro', 'schema_atributos.json').read_text())
    preparo_salvo = dict(schema.get('config_preparo', {}))
    preparo_esperado = config_preparo(cfg)
    # Um painel preparado com h1..h4 também contém tudo de que h1/h2 precisa.
    # Permitir apenas esse subconjunto evita reconstruir atributos para o treino rápido.
    horizontes_salvos = set(preparo_salvo.pop('horizontes', []))
    horizontes_esperados = set(preparo_esperado.pop('horizontes', []))
    reserva_salva = preparo_salvo.get('reserva_espacial', {})
    reserva_esperada = preparo_esperado.get('reserva_espacial', {})
    # Uma reserva calculada antes da primeira validação atual é causalmente segura.
    # Reutilizá-la evita refazer o painel só porque se removeu um fold antigo.
    if (reserva_salva.get('fracao') == reserva_esperada.get('fracao') and
            reserva_salva.get('ano_estratificacao', float('inf')) <= reserva_esperada.get('ano_estratificacao', -float('inf'))):
        preparo_esperado['reserva_espacial'] = reserva_salva
    if not horizontes_esperados.issubset(horizontes_salvos) or preparo_salvo != preparo_esperado:
        raise ValueError('Configuração de dados mudou. Execute preparar/atributos com esta configuração antes de treinar.')
    reservados = set(json.loads(arquivo(cfg, 'ouro', 'municipios_reservados.json').read_text()))
    return p, schema, reservados


def elegiveis(cfg, dados, h):
    mais_antigo = cfg['atributos']['atraso_casos_semanas'] + max(cfg['atributos']['lags'])
    return (dados[f'alvo_h{h}'].notna() & dados[f'f_casos_lag{mais_antigo}'].notna()
            & dados.populacao.gt(0) & dados.baseline_recente.notna()
            & dados.baseline_media4.notna() & dados[f'baseline_sazonal_h{h}'].notna())


def separar_ajuste_calibracao(cfg, dados, fim, h):
    # Purga por DATA DO ALVO, não só por origem. Nenhum rótulo atravessa corte.
    dados = dados[elegiveis(cfg, dados, h) & (dados[f'data_alvo_h{h}'] < fim)]
    inicio_cal = fim - pd.Timedelta(weeks=cfg['treino']['calibracao_semanas'])
    ajuste = dados[dados[f'data_alvo_h{h}'] < inicio_cal]
    cal = dados[dados[f'data_alvo_h{h}'] >= inicio_cal]
    if ajuste.empty or cal.empty:
        raise ValueError(f'Sem treino/calibração antes de {fim.date()}. Verifique recorte/anos.')
    return ajuste, cal


def _config_tentativa(cfg, tentativa):
    """Cria uma configuração isolada: a busca nunca altera config.yaml."""
    novo = copy.deepcopy(cfg)
    treino = novo['treino']
    for chave in ('iterations', 'depth', 'learning_rate', 'l2_leaf_reg',
                  'peso_classe_positiva'):
        if chave in tentativa:
            treino[chave] = tentativa[chave]
    if 'smote' in tentativa:
        treino['smote'].update(tentativa['smote'])
    treino['candidatos'] = ['hurdle']
    return novo


def _resumo_busca(registros, duracao):
    ocorrencia = [r['ocorrencia'] for r in registros]
    regressao = [r['regressao'] for r in registros]
    def media(chave, itens):
        valores = [x[chave] for x in itens if x.get(chave) is not None]
        return float(np.mean(valores)) if valores else None
    return {
        'avaliacoes': len(registros), 'segundos': round(float(duracao), 2),
        'macro_mae': media('macro_mae', regressao),
        'pr_auc_ocorrencia': media('pr_auc', ocorrencia),
        'recall_ocorrencia': media('recall', ocorrencia),
        'f1_ocorrencia': media('f1', ocorrencia),
        'precision_ocorrencia': media('precision', ocorrencia),
    }


def _ordem_busca(resultado):
    """Alta sensibilidade primeiro; qualidade de ranking e contagem desempata."""
    r = resultado['resumo']
    return (-(r['recall_ocorrencia'] if r['recall_ocorrencia'] is not None else -1),
            -(r['pr_auc_ocorrencia'] if r['pr_auc_ocorrencia'] is not None else -1),
            r['macro_mae'] if r['macro_mae'] is not None else float('inf'),
            r['segundos'])


def _avaliar_tentativa(cfg, dados, schema, reservados, anos, horizontes):
    """Backtest temporal enxuto; não calibra nem abre os anos de teste."""
    inicio = time.perf_counter()
    conhecidos = ~dados.codigo_ibge.isin(reservados)
    registros = []
    for h in horizontes:
        for ano in anos:
            fim, limite = pd.Timestamp(inicio_ano_epi(ano)), pd.Timestamp(inicio_ano_epi(ano + 1))
            fit, cal = separar_ajuste_calibracao(cfg, dados[conhecidos], fim, h)
            val = dados[elegiveis(cfg, dados, h) & dados[f'data_alvo_h{h}'].ge(fim)
                        & dados[f'data_alvo_h{h}'].lt(limite) & conhecidos]
            if val.empty:
                raise ValueError(f'Sem linhas de validação em {ano}/h{h}.')
            modelo = Candidato(cfg, 'hurdle').fit(
                fit, fit[f'alvo_h{h}'], schema['numericas'], schema['categoricas'],
                data_alvo=f'data_alvo_h{h}')
            calibrar_limiar_ocorrencia(cfg, modelo, cal, cal[f'alvo_h{h}'])
            pred = modelo.predict(val)
            registros.append({
                'ano': int(ano), 'horizonte': int(h), 'linhas_treino': int(len(fit)),
                'linhas_validacao': int(len(val)),
                'regressao': avaliar(val, val[f'alvo_h{h}'], pred),
                'ocorrencia': metricas_ocorrencia(val[f'alvo_h{h}'], modelo.predict_ocorrencia(val),
                                                   modelo.limiar_ocorrencia),
                'smote': modelo.smote,
            })
    duracao = time.perf_counter() - inicio
    return registros, _resumo_busca(registros, duracao)


def buscar_hiperparametros(cfg):
    """Grade curta com seleção temporal da classe minoritária e promoção de finalistas."""
    busca = cfg['treino'].get('busca_hiperparametros', {})
    if not busca.get('habilitado', False):
        raise ValueError('Habilite treino.busca_hiperparametros no config.yaml para executar a busca.')
    testes = set(cfg['treino']['testes_anos'])
    triagem_anos = list(busca['anos_triagem'])
    confirmacao_anos = list(busca['anos_confirmacao'])
    if set(triagem_anos + confirmacao_anos) & testes:
        raise ValueError('A busca de hiperparâmetros não pode abrir os anos de teste bloqueados.')
    dados, schema, reservados = carregar_dados(cfg)
    pasta = arquivo(cfg, 'relatorios', 'busca_hiperparametros') / \
        datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
    pasta.mkdir(parents=True)
    triagem = []
    for tentativa in busca['tentativas']:
        nome = tentativa['nome']
        LOG.info('Busca temporal — triagem: %s.', nome)
        cfg_tentativa = _config_tentativa(cfg, tentativa)
        registros, resumo = _avaliar_tentativa(
            cfg_tentativa, dados, schema, reservados, triagem_anos, busca['horizontes_triagem'])
        triagem.append({'nome': nome, 'tentativa': tentativa, 'resumo': resumo, 'registros': registros})
    triagem.sort(key=_ordem_busca)
    salvar_json(pasta / 'triagem.json', triagem)
    finalistas = triagem[:int(busca['finalistas'])]
    confirmacao = []
    for resultado in finalistas:
        LOG.info('Busca temporal — confirmação: %s.', resultado['nome'])
        cfg_tentativa = _config_tentativa(cfg, resultado['tentativa'])
        registros, resumo = _avaliar_tentativa(
            cfg_tentativa, dados, schema, reservados, confirmacao_anos,
            busca['horizontes_confirmacao'])
        confirmacao.append({'nome': resultado['nome'], 'tentativa': resultado['tentativa'],
                            'resumo': resumo, 'registros': registros})
    confirmacao.sort(key=_ordem_busca)
    vencedor = confirmacao[0]
    cfg_final = _config_tentativa(cfg, vencedor['tentativa'])
    # H1/H2 foram os únicos horizontes que superaram baselines no experimento anterior.
    # A configuração exportada evita voltar a gastar tempo com H3/H4 por padrão.
    cfg_final['treino']['horizontes'] = list(busca['horizontes_confirmacao'])
    salvar_json(pasta / 'confirmacao.json', confirmacao)
    salvar_json(pasta / 'melhor_config_busca.json', cfg_final)
    salvar_json(pasta / 'resultado.json', {
        'vencedor': vencedor['nome'], 'criterio': [
            'maior recall de ocorrência (y>0), com precisão mínima calibrada',
            'maior PR-AUC de ocorrência', 'menor MAE macro municipal', 'menor duração'],
        'triagem_anos': triagem_anos, 'confirmacao_anos': confirmacao_anos,
        'horizontes_triagem': busca['horizontes_triagem'],
        'horizontes_confirmacao': busca['horizontes_confirmacao'],
        'config_para_treino': str(pasta / 'melhor_config_busca.json'),
    })
    LOG.info('Busca concluída. Vencedor: %s. Configuração: %s', vencedor['nome'], pasta / 'melhor_config_busca.json')
    return pasta


def treinar(cfg):
    dados, schema, reservados = carregar_dados(cfg)
    conhecidos = ~dados.codigo_ibge.isin(reservados)
    pasta = arquivo(cfg, 'modelos', datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ'))
    pasta.mkdir(parents=True)
    salvar_json(pasta / 'config.json', cfg)
    salvar_json(pasta / 'ambiente.json', ambiente())
    salvar_json(pasta / 'municipios_reservados.json', sorted(reservados))
    salvar_json(pasta / 'proveniencia.json', {
        'entrada_sha256': sha256(cfg['entrada']),
        'atributos_sha256': sha256(arquivo(cfg, 'ouro', 'atributos.parquet')),
        'schema': schema, 'cenario': 'retrospectivo; nao simula revisoes historicas',
    })
    resumo = {}
    total_ajustes = (len(cfg['treino']['horizontes']) * len(cfg['treino']['validacao_anos']) *
                     len(cfg['treino']['candidatos']))
    ajustes_concluidos = 0
    inicio_comparacao = time.perf_counter()
    LOG.info('Plano de treino: %d candidatos × %d horizontes × %d ano(s) = %d ajustes. Validação: %s.',
             len(cfg['treino']['candidatos']), len(cfg['treino']['horizontes']),
             len(cfg['treino']['validacao_anos']), total_ajustes, cfg['treino']['validacao_anos'])
    for h in cfg['treino']['horizontes']:
        LOG.info('Treinamento horizonte %d...', h)
        avaliacoes = []
        explicacoes = {}
        melhor_modelo, melhor_chave = None, None
        fold_unico = len(cfg['treino']['validacao_anos']) == 1
        for ano in cfg['treino']['validacao_anos']:
            fim, limite = pd.Timestamp(inicio_ano_epi(ano)), pd.Timestamp(inicio_ano_epi(ano+1))
            fit, cal = separar_ajuste_calibracao(cfg, dados[conhecidos], fim, h)
            avaliacao = dados[elegiveis(cfg, dados, h) & dados[f'data_alvo_h{h}'].ge(fim)
                             & dados[f'data_alvo_h{h}'].lt(limite)]
            if avaliacao.empty:
                raise ValueError(f'Sem linhas de validação em {ano}/h{h}')
            for tipo in cfg['treino']['candidatos']:
                LOG.info('[%d/%d | %.0f%%] INÍCIO h%d, validação %d, %s: %d treino + %d calibração + %d validação.',
                         ajustes_concluidos + 1, total_ajustes, 100 * ajustes_concluidos / total_ajustes,
                         h, ano, tipo, len(fit), len(cal), len(avaliacao))
                iniciado = time.perf_counter()
                try:
                    modelo = Candidato(cfg, tipo).fit(
                        fit, fit[f'alvo_h{h}'], schema['numericas'], schema['categoricas'],
                        data_alvo=f'data_alvo_h{h}')
                except (ValueError, FloatingPointError) as erro:
                    if tipo != 'nb_misto':
                        raise
                    LOG.warning('h%d, %d, nb_misto não convergiu: %s. Seguindo os demais modelos.', h, ano, erro)
                    avaliacoes.append({'ano': ano, 'grupo': 'conhecidos', 'modelo': tipo,
                                       'erro': str(erro), 'segundos_treino': round(time.perf_counter() - iniciado, 2)})
                    ajustes_concluidos += 1
                    LOG.info('[%d/%d | %.0f%%] FALHA %s/h%d após %s; comparação continua.',
                             ajustes_concluidos, total_ajustes, 100 * ajustes_concluidos / total_ajustes,
                             tipo, h, timedelta(seconds=int(time.perf_counter() - iniciado)))
                    continue
                explicacoes[tipo] = modelo.explicacao()
                limites = limiares(cfg, fit, fit[f'alvo_h{h}'])
                if cfg['treino'].get('progresso', {}).get('mostrar'):
                    LOG.info('%s/h%d: calibrando probabilidades e intervalos.', tipo, h)
                ajustar_calibracao(cfg, modelo, cal, cal[f'alvo_h{h}'])
                if tipo != 'poisson':
                    calibrar_limiar_ocorrencia(cfg, modelo, cal, cal[f'alvo_h{h}'])
                metricas_conhecidos = None
                for grupo, mascara in [('conhecidos', ~avaliacao.codigo_ibge.isin(reservados)),
                                        ('nao_vistos', avaliacao.codigo_ibge.isin(reservados))]:
                    val = avaliacao[mascara]
                    if val.empty:
                        continue
                    threshold = aplicar_limiar(val, limites)
                    pred, low, high, prob = prever_com_intervalos(modelo, val, threshold)
                    m = avaliar(val, val[f'alvo_h{h}'], pred, low, high, threshold, prob)
                    if grupo == 'conhecidos':
                        metricas_conhecidos = m
                    if tipo != 'poisson':
                        m['ocorrencia'] = metricas_ocorrencia(
                            val[f'alvo_h{h}'], modelo.predict_ocorrencia(val), modelo.limiar_ocorrencia)
                        if grupo == 'conhecidos' and fold_unico:
                            o = m['ocorrencia']
                            piso = cfg['treino']['ocorrencia']['precisao_minima']
                            chave = (o['precision'] >= piso, o['recall'], o['pr_auc'], -m['macro_mae'])
                            if melhor_chave is None or chave > melhor_chave:
                                melhor_modelo, melhor_chave = modelo, chave
                    avaliacoes.append({'ano': ano, 'grupo': grupo, 'modelo': tipo,
                                       'segundos_treino': round(time.perf_counter() - iniciado, 2), 'metricas': m})
                ajustes_concluidos += 1
                decorrido = time.perf_counter() - inicio_comparacao
                eta = timedelta(seconds=int(decorrido / ajustes_concluidos *
                                            (total_ajustes - ajustes_concluidos)))
                ocorrencia = metricas_conhecidos.get('ocorrencia', {}) if metricas_conhecidos else {}
                LOG.info('[%d/%d | %.0f%%] FIM %s/h%d em %s | recall=%s precisão=%s PR-AUC=%s MAE macro=%s | ETA ~%s.',
                         ajustes_concluidos, total_ajustes, 100 * ajustes_concluidos / total_ajustes,
                         tipo, h, timedelta(seconds=int(time.perf_counter() - iniciado)),
                         f"{ocorrencia['recall']:.3f}" if 'recall' in ocorrencia else 'n/a',
                         f"{ocorrencia['precision']:.3f}" if 'precision' in ocorrencia else 'n/a',
                         f"{ocorrencia['pr_auc']:.3f}" if ocorrencia.get('pr_auc') is not None else 'n/a',
                         f"{metricas_conhecidos['macro_mae']:.3f}" if metricas_conhecidos else 'n/a', eta)
            for grupo, mascara in [('conhecidos', ~avaliacao.codigo_ibge.isin(reservados)),
                                    ('nao_vistos', avaliacao.codigo_ibge.isin(reservados))]:
                val = avaliacao[mascara]
                if val.empty:
                    continue
                for nome, serie in [('zero', pd.Series(0., index=val.index)),
                                    ('recente', val.baseline_recente), ('media4', val.baseline_media4),
                                    ('sazonal', val[f'baseline_sazonal_h{h}'])]:
                    ok = serie.notna()
                    if ok.any():
                        avaliacoes.append({'ano': ano, 'grupo': grupo, 'modelo': nome,
                                           'metricas': avaliar(val[ok], val.loc[ok, f'alvo_h{h}'], serie[ok])})
        salvar_json(pasta / f'validacao_h{h}.json', avaliacoes)
        salvar_json(pasta / f'explicacoes_h{h}.json', explicacoes)
        candidatos = cfg['treino']['candidatos']
        scores = {nome: float(np.mean([a['metricas']['macro_mae'] for a in avaliacoes
                                       if a['modelo'] == nome and a['grupo'] == 'conhecidos'
                                       and 'metricas' in a])) if any(a['modelo'] == nome and a['grupo'] == 'conhecidos'
                                                                    and 'metricas' in a for a in avaliacoes) else None
                  for nome in candidatos + ['zero', 'recente', 'media4', 'sazonal']}
        ocorrencia_scores = {nome: {
            chave: float(np.mean([a['metricas']['ocorrencia'][chave] for a in avaliacoes
                                   if a['modelo'] == nome and a['grupo'] == 'conhecidos'
                                   and 'ocorrencia' in a['metricas']]))
            for chave in ('recall', 'precision', 'f1', 'pr_auc')}
            for nome in candidatos if nome != 'poisson' and any(a['modelo'] == nome and
                a['grupo'] == 'conhecidos' and 'ocorrencia' in a.get('metricas', {}) for a in avaliacoes)}
        if fold_unico and melhor_modelo is not None:
            vencedor = melhor_modelo.tipo
        else:
            vencedor = min((n for n in candidatos if scores[n] is not None), key=scores.get)
        fim_final = pd.Timestamp(inicio_ano_epi(cfg['treino']['treino_final_ate'] + 1))
        if fold_unico and pd.Timestamp(inicio_ano_epi(cfg['treino']['validacao_anos'][0])) == fim_final and melhor_modelo is not None:
            modelo = melhor_modelo
            fit, cal = separar_ajuste_calibracao(cfg, dados[conhecidos], fim_final, h)
            modelo.limiares = limiares(cfg, fit, fit[f'alvo_h{h}'])
        else:
            fit, cal = separar_ajuste_calibracao(cfg, dados[conhecidos], fim_final, h)
            modelo = Candidato(cfg, vencedor).fit(
                fit, fit[f'alvo_h{h}'], schema['numericas'], schema['categoricas'],
                data_alvo=f'data_alvo_h{h}')
            modelo.limiares = limiares(cfg, fit, fit[f'alvo_h{h}'])
            ajustar_calibracao(cfg, modelo, cal, cal[f'alvo_h{h}'])
            if vencedor != 'poisson':
                calibrar_limiar_ocorrencia(cfg, modelo, cal, cal[f'alvo_h{h}'])
        modelo.horizonte = h
        modelo.schema = schema
        modelo.data_fim_treino = str(fit[f'data_alvo_h{h}'].max().date())
        modelo.data_fim_calibracao = str(cal[f'data_alvo_h{h}'].max().date())
        joblib.dump(modelo, pasta / f'modelo_h{h}.joblib', compress=3)
        salvar_json(pasta / f'imputacao_h{h}.json', modelo.imputador.relatorio)
        salvar_json(pasta / f'smote_h{h}.json', modelo.smote)
        resumo[str(h)] = {'candidato': vencedor, 'scores_macro_mae': scores,
                          'scores_ocorrencia': ocorrencia_scores,
                          'criterio_vencedor': 'recall_ocorrencia_com_piso_precisao' if melhor_modelo is not None else 'mae_macro',
                          'melhor_baseline': min(['zero', 'recente', 'media4', 'sazonal'], key=scores.get),
                          'supera_baselines': scores[vencedor] < min(scores[n] for n in ['zero', 'recente', 'media4', 'sazonal']),
                          'aprovado_ocorrencia': (vencedor in ocorrencia_scores and
                                                  ocorrencia_scores[vencedor]['precision'] >= cfg['treino']['ocorrencia']['precisao_minima']),
                          'treino_ate': modelo.data_fim_treino, 'calibracao_ate': modelo.data_fim_calibracao,
                          'features': len(modelo.imputador.ativas), 'smote_sinteticos_final': modelo.smote.get('sinteticos', 0),
                          'limiar_ocorrencia': getattr(modelo, 'limiar_ocorrencia', None),
                          'calibracao_ocorrencia': getattr(modelo, 'calibracao_ocorrencia', None)}
        LOG.info('Horizonte h%d concluído: vencedor %s; modelo e relatórios em %s.', h, vencedor, pasta)
    salvar_json(pasta / 'resumo.json', resumo)
    salvar_json(pasta / 'model_card.json', {
        'status': 'candidato_de_pesquisa; aprovacao epidemiologica pendente',
        'testes_bloqueados_abertos': False,
        'teste_independente_disponivel': bool(cfg['treino']['testes_anos']),
        'anos_validacao': cfg['treino']['validacao_anos'],
        'limitacoes': ['snapshot revisado sem vintages historicos', 'zeros inferidos do recurso anual',
                      'malha fixa de referencia', 'clima de reanalise nao previsao meteorologica',
                      'intervalos residuais sem garantia sob dependencia temporal',
                      'limiar de alerta experimental, nao norma sanitaria'],
        'resumo': resumo,
    })
    salvar_json(arquivo(cfg, 'modelos', 'ultimo_treino.json'), {'pasta': str(pasta)})
    LOG.info('Treino concluído: %s', pasta)
    return pasta


def arquivar_candidatos(cfg, pasta=None):
    """Preserva horizontes promissores em contagem ou ocorrência de casos."""
    # Arquivar é leitura de um experimento já concluído: não imponha a
    # configuração corrente, pois ela pode ter sido ajustada para o próximo treino.
    if pasta is None:
        pasta = json.loads(arquivo(cfg, 'modelos', 'ultimo_treino.json').read_text())['pasta']
    pasta = Path(pasta)
    if not (pasta / 'resumo.json').is_file():
        raise FileNotFoundError(f'Não encontrei resumo.json em {pasta}')
    resumo = json.loads((pasta / 'resumo.json').read_text())
    horizontes = [int(h) for h, meta in resumo.items()
                  if meta.get('supera_baselines') or meta.get('aprovado_ocorrencia')]
    if not horizontes:
        raise ValueError('Nenhum candidato atingiu os critérios de contagem ou ocorrência na validação.')
    destino_base = Path(cfg['treino']['arquivo_candidatos'])
    if not destino_base.is_absolute():
        destino_base = Path.cwd() / destino_base
    destino = destino_base / pasta.name
    destino.mkdir(parents=True, exist_ok=True)
    comuns = ['config.json', 'ambiente.json', 'proveniencia.json', 'model_card.json',
              'municipios_reservados.json', 'resumo.json', 'testes_bloqueados.json']
    selecionados = comuns + sum(([f'modelo_h{h}.joblib', f'imputacao_h{h}.json', f'smote_h{h}.json',
                                   f'validacao_h{h}.json', f'explicacoes_h{h}.json'] for h in horizontes), [])
    for nome in selecionados:
        origem = pasta / nome
        if origem.is_file():
            shutil.copy2(origem, destino / nome)
    salvar_json(destino / 'selecao.json', {
        'origem': str(pasta), 'horizontes_preservados': horizontes,
        'regra': 'venceu baselines de contagem ou atingiu piso de precisao para ocorrencia na validacao',
        'data_arquivo': datetime.now(timezone.utc).isoformat(),
        'nao_e_aprovacao_producao': True,
    })
    LOG.info('Candidatos arquivados: %s', destino)
    return destino


def localizar_modelos(cfg, pasta=None):
    if pasta is None:
        pasta = json.loads(arquivo(cfg, 'modelos', 'ultimo_treino.json').read_text())['pasta']
    from pathlib import Path
    pasta = Path(pasta)
    origem = json.loads((pasta / 'config.json').read_text())
    if origem != cfg:
        raise ValueError('Configuração mudou desde o treino. Use o config.yaml original ou treine novamente.')
    return pasta


def avaliar_testes(cfg, pasta=None):
    """Comando explícito abre 2024/2025; jamais usado para selecionar o vencedor."""
    if not cfg['treino']['testes_anos']:
        raise ValueError('Não há ano de teste independente: 2025 foi usado para escolher o modelo. Consulte validacao_h*.json.')
    dados, _, reservados = carregar_dados(cfg)
    pasta = localizar_modelos(cfg, pasta)
    report = []
    for h in cfg['treino']['horizontes']:
        modelo = joblib.load(pasta / f'modelo_h{h}.joblib')
        for ano in cfg['treino']['testes_anos']:
            first, last = pd.Timestamp(inicio_ano_epi(ano)), pd.Timestamp(inicio_ano_epi(ano+1))
            base = dados[elegiveis(cfg, dados, h) & dados[f'data_alvo_h{h}'].ge(first) & dados[f'data_alvo_h{h}'].lt(last)]
            for grupo, mask in [('conhecidos', ~base.codigo_ibge.isin(reservados)),
                                 ('nao_vistos', base.codigo_ibge.isin(reservados))]:
                df = base[mask]
                if df.empty:
                    continue
                threshold = aplicar_limiar(df, modelo.limiares)
                pred, lo, hi, prob = prever_com_intervalos(modelo, df, threshold)
                metricas_teste = avaliar(df, df[f'alvo_h{h}'], pred, lo, hi, threshold, prob)
                if modelo.tipo in ('hurdle', 'arima'):
                    metricas_teste['ocorrencia'] = metricas_ocorrencia(
                        df[f'alvo_h{h}'], modelo.predict_ocorrencia(df),
                        getattr(modelo, 'limiar_ocorrencia', 0.5))
                report.append({'ano': ano, 'h': h, 'grupo': grupo, 'modelo': modelo.tipo,
                               'metricas': metricas_teste})
                output = df[['codigo_ibge', 'uf', 'porte', 'semana_inicio', f'data_alvo_h{h}', f'alvo_h{h}']].copy()
                output['previsao'], output['inferior'], output['superior'], output['prob_alerta'] = pred, lo, hi, prob
                salvar_parquet(output, pasta / f'previsoes_teste_{ano}_{grupo}_h{h}.parquet')
                for nome in ['recente', 'media4', f'sazonal_h{h}']:
                    serie = df['baseline_' + nome]
                    ok = serie.notna()
                    if ok.any():
                        report.append({'ano': ano, 'h': h, 'grupo': grupo, 'modelo': 'baseline_' + nome,
                                       'metricas': avaliar(df[ok], df.loc[ok, f'alvo_h{h}'], serie[ok])})
    salvar_json(pasta / 'testes_bloqueados.json', report)
    card = json.loads((pasta / 'model_card.json').read_text())
    card['testes_bloqueados_abertos'] = True
    card['testes_abertos_em'] = datetime.now(timezone.utc).isoformat()
    salvar_json(pasta / 'model_card.json', card)
    LOG.info('Testes avaliados e registrados: %s', pasta / 'testes_bloqueados.json')


def inferir(cfg, pasta=None):
    dados, _, _ = carregar_dados(cfg)
    pasta = localizar_modelos(cfg, pasta)
    ultima = dados.semana_inicio.max()
    base = dados[dados.semana_inicio.eq(ultima) & dados.populacao.gt(0)].copy()
    delay = cfg['atributos']['atraso_casos_semanas']
    antigo = delay + max(cfg['atributos']['lags'])
    base = base[base[f'f_casos_lag{delay}'].notna() & base[f'f_casos_lag{antigo}'].notna()]
    if base.empty:
        raise ValueError('Sem histórico/população para inferência na última origem.')
    rows = []
    for h in cfg['treino']['horizontes']:
        modelo = joblib.load(pasta / f'modelo_h{h}.joblib')
        threshold = aplicar_limiar(base, modelo.limiares)
        pred, low, high, prob = prever_com_intervalos(modelo, base, threshold)
        out = base[['codigo_ibge', 'uf', 'semana_inicio', 'populacao']].copy()
        out['semana_alvo'] = out.semana_inicio + pd.Timedelta(weeks=h)
        out['horizonte'], out['casos_previstos'], out['incidencia_100k'] = h, pred, pred/out.populacao*100000
        out['limite_inferior'], out['limite_superior'], out['prob_alerta_experimental'] = low, high, prob
        if modelo.tipo in ('hurdle', 'arima'):
            out['prob_ocorrencia'] = modelo.predict_ocorrencia(base)
            out['limiar_ocorrencia'] = getattr(modelo, 'limiar_ocorrencia', 0.5)
            out['ocorrencia_prevista'] = out['prob_ocorrencia'] >= out['limiar_ocorrencia']
        out['limiar_experimental'], out['model_version'] = threshold, pasta.name
        out['status'] = 'pesquisa_retrospectiva_snapshot_revisado'
        rows.append(out)
    output = pd.concat(rows, ignore_index=True)
    salvar_parquet(output, pasta / 'previsoes_ultima_origem.parquet')
    LOG.info('Previsões da origem %s: %s', ultima.date(), pasta / 'previsoes_ultima_origem.parquet')
    return output
