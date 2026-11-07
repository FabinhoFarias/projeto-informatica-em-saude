"""Candidatos interpretáveis para comparação no mesmo corte temporal.

Cada objeto recebe o DataFrame já imputado pelo pipeline. A codificação é
ajustada exclusivamente no treino e persistida junto do estimador.
"""
from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import ExtraTreesClassifier, ExtraTreesRegressor, RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import LogisticRegression, PoissonRegressor
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from .base import LOG


TIPOS = {'logistica_poisson', 'ebm', 'xgboost', 'lightgbm', 'random_forest',
         'extra_trees', 'bayes_hierarquico', 'nb_misto'}


def _amostra(y, limite, semente):
    """Amostragem por classe com pesos inversos para recuperar a prevalência."""
    n = len(y)
    if n <= limite:
        return np.arange(n), np.ones(n)
    rng = np.random.default_rng(semente)
    positivos = np.flatnonzero(y > 0)
    negativos = np.flatnonzero(y == 0)
    n_pos = min(len(positivos), max(1, limite // 2))
    n_neg = min(len(negativos), limite - n_pos)
    if n_neg < 1:
        n_pos, n_neg = limite - 1, 1
    indices = np.sort(np.r_[rng.choice(positivos, n_pos, replace=False),
                            rng.choice(negativos, n_neg, replace=False)])
    pesos = np.where(y[indices] > 0, len(positivos) / n_pos,
                     len(negativos) / n_neg).astype(float)
    pesos /= pesos.mean()
    return indices, pesos


class ModeloAdicional:
    """Hurdle ou modelo de contagem; API homogênea para calibração e inferência."""

    def __init__(self, tipo, cfg):
        if tipo not in TIPOS:
            raise ValueError(f'Modelo desconhecido: {tipo}')
        self.tipo, self.cfg = tipo, cfg

    def _preparar(self, x, numericas, categoricas, y):
        self.numericas = list(numericas)
        self.categoricas = list(categoricas)
        if self.tipo == 'ebm':
            # EBM tem custo próximo de linear no número de atributos. A seleção
            # ocorre só no treino; o código municipal de alta cardinalidade sai.
            ranking = []
            alvo = (y > 0).astype(float)
            for c in self.numericas:
                valores = pd.to_numeric(x[c], errors='coerce').to_numpy(float)
                correlacao = np.corrcoef(valores, alvo)[0, 1] if np.std(valores) else 0
                ranking.append((abs(correlacao) if np.isfinite(correlacao) else 0, c))
            ranking.sort(reverse=True)
            self.colunas_ebm = [c for _, c in ranking[:int(self.cfg['treino'].get('max_atributos_ebm', 30))]]
            self.colunas_ebm += [c for c in self.categoricas if c != 'codigo_ibge']
            return self._transformar(x)
        self.codificador = ColumnTransformer([
            ('num', StandardScaler(with_mean=False), self.numericas),
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=True), self.categoricas),
        ], sparse_threshold=1.0)
        return self.codificador.fit_transform(x)

    def _transformar(self, x):
        if self.tipo == 'ebm':
            return x[self.colunas_ebm].copy()
        return self.codificador.transform(x)

    def fit(self, x, y, numericas, categoricas):
        y = np.asarray(y, float)
        self.numericas, self.categoricas = list(numericas), list(categoricas)
        limite = int(self.cfg['treino'].get('max_linhas_modelos_adicionais', 120000))
        indices, pesos = _amostra(y, limite, self.cfg['semente'])
        x_fit = x.iloc[indices].reset_index(drop=True)
        y_fit = y[indices]
        self.linhas_usadas = len(indices)
        self.smote = {'habilitado': False, 'sinteticos': 0, 'linhas_treino': len(indices),
                      'amostragem_com_pesos_inversos': len(indices) < len(y)}
        mostrar = self.cfg['treino'].get('progresso', {}).get('mostrar', False)
        if mostrar:
            LOG.info('%s: usando %d de %d linhas para ajuste.', self.tipo, len(indices), len(y))
        if self.tipo == 'bayes_hierarquico':
            if mostrar:
                LOG.info('%s: estimando distribuições por UF e município.', self.tipo)
            self._fit_bayes(x_fit, y_fit, pesos)
            return self
        if self.tipo == 'nb_misto':
            if mostrar:
                LOG.info('%s: ajustando GLM binomial negativo.', self.tipo)
            self._fit_nb(x_fit, y_fit, pesos)
            return self
        xx = self._preparar(x_fit, numericas, categoricas, y_fit)
        if self.tipo == 'logistica_poisson':
            self.classificador = LogisticRegression(max_iter=180, class_weight='balanced',
                                                     solver='liblinear', random_state=self.cfg['semente'])
            self.regressor = PoissonRegressor(alpha=1.0, max_iter=180)
        elif self.tipo == 'ebm':
            try:
                from interpret.glassbox import ExplainableBoostingClassifier, ExplainableBoostingRegressor
            except ImportError as e:
                raise ImportError('Instale interpret-core com requirements.txt para usar ebm.') from e
            args = dict(interactions=0, outer_bags=1, max_rounds=250,
                        n_jobs=self.cfg['threads'], random_state=self.cfg['semente'])
            self.classificador = ExplainableBoostingClassifier(**args)
            self.regressor = ExplainableBoostingRegressor(**args)
        elif self.tipo == 'xgboost':
            try:
                from xgboost import XGBClassifier, XGBRegressor
            except ImportError as e:
                raise ImportError('Instale xgboost com requirements.txt.') from e
            args = dict(n_estimators=180, max_depth=4, learning_rate=0.06, tree_method='hist',
                        n_jobs=self.cfg['threads'], random_state=self.cfg['semente'])
            self.classificador = XGBClassifier(objective='binary:logistic', **args)
            self.regressor = XGBRegressor(objective='count:poisson', **args)
        elif self.tipo == 'lightgbm':
            try:
                from lightgbm import LGBMClassifier, LGBMRegressor
            except ImportError as e:
                raise ImportError('Instale lightgbm com requirements.txt.') from e
            args = dict(n_estimators=180, num_leaves=15, learning_rate=0.06,
                        n_jobs=self.cfg['threads'], random_state=self.cfg['semente'], verbosity=-1)
            self.classificador = LGBMClassifier(objective='binary', **args)
            self.regressor = LGBMRegressor(objective='poisson', **args)
        else:
            klass = RandomForestClassifier if self.tipo == 'random_forest' else ExtraTreesClassifier
            reg = RandomForestRegressor if self.tipo == 'random_forest' else ExtraTreesRegressor
            args = dict(n_estimators=80, max_depth=15, min_samples_leaf=8,
                        max_features=0.7, n_jobs=self.cfg['threads'], random_state=self.cfg['semente'])
            self.classificador, self.regressor = klass(**args), reg(**args)
        peso_pos = float(self.cfg['treino'].get('peso_classe_positiva', 4.0))
        peso_classe = pesos * np.where(y_fit > 0, peso_pos, 1.0)
        if mostrar:
            LOG.info('%s: ajustando classificador de ocorrência.', self.tipo)
        self.classificador.fit(xx, (y_fit > 0).astype(int), sample_weight=peso_classe)
        positivos = y_fit > 0
        if mostrar:
            LOG.info('%s: ajustando regressor de contagem (%d positivos).', self.tipo, int(positivos.sum()))
        self.regressor.fit(xx[positivos], y_fit[positivos], sample_weight=pesos[positivos])
        return self

    def _fit_bayes(self, x, y, pesos):
        # Gamma-Poisson hierárquico empírico: média estadual informa o prior
        # da taxa municipal. É um baseline de contagem, sem efeitos climáticos.
        uf = x['uf'].astype(str).to_numpy()
        municipio = x['codigo_ibge'].astype(str).to_numpy()
        self.media_global = float(np.average(y, weights=pesos))
        self.medias_uf = {}
        self.medias_municipio = {}
        for estado in np.unique(uf):
            mask = uf == estado
            media_uf = float(np.average(y[mask], weights=pesos[mask]))
            self.medias_uf[estado] = media_uf
            for cod in np.unique(municipio[mask]):
                m = mask & (municipio == cod)
                # força anterior de 52 semanas; contribuição municipal posterior.
                self.medias_municipio[cod] = float((np.sum(pesos[m] * y[m]) + 52 * media_uf) /
                                                   (np.sum(pesos[m]) + 52))

    def _fit_nb(self, x, y, pesos):
        # NB GLM com efeito fixo de UF e correção municipal regularizada.
        # Em dados massivos, evita matriz densa com um parâmetro por município.
        try:
            import statsmodels.api as sm
        except ImportError as e:
            raise ImportError('Instale statsmodels com requirements.txt.') from e
        self.colunas_nb = [c for c in self.numericas if c.startswith('f_casos_')][:12]
        self.colunas_nb += [c for c in ('f_log_populacao', 'f_densidade') if c in self.numericas]
        self.uf_nb = sorted(x.uf.astype(str).unique())
        matriz = self._matriz_nb(x)
        media, variancia = float(np.average(y, weights=pesos)), float(np.average((y - np.average(y, weights=pesos)) ** 2, weights=pesos))
        self.alpha_nb = max(0.01, (variancia - media) / max(media * media, 0.01))
        self.regressor = sm.GLM(y, matriz, family=sm.families.NegativeBinomial(alpha=self.alpha_nb),
                                freq_weights=pesos).fit(maxiter=60, disp=0)
        mu = np.maximum(self.regressor.predict(matriz), 1e-4)
        self.efeito_municipio = {}
        codigos = x.codigo_ibge.astype(str).to_numpy()
        for cod in np.unique(codigos):
            m = codigos == cod
            self.efeito_municipio[cod] = float((np.sum(pesos[m] * y[m]) + 52 * np.mean(mu[m])) /
                                                (np.sum(pesos[m] * mu[m]) + 52 * np.mean(mu[m])))

    def _matriz_nb(self, x):
        numerico = x[self.colunas_nb].to_numpy(float)
        escala = getattr(self, 'escala_nb', None)
        if escala is None:
            self.escala_nb = np.maximum(np.std(numerico, axis=0), 1e-6)
        numerico = np.clip(numerico / self.escala_nb, -20, 20)
        uf = x.uf.astype(str).to_numpy()
        dummies = np.column_stack([uf == c for c in self.uf_nb[1:]]).astype(float) if len(self.uf_nb) > 1 else np.empty((len(x), 0))
        return np.column_stack([np.ones(len(x)), numerico, dummies])

    def predict(self, x):
        if self.tipo == 'bayes_hierarquico':
            uf, cod = x.uf.astype(str).to_numpy(), x.codigo_ibge.astype(str).to_numpy()
            mu = np.array([self.medias_municipio.get(c, self.medias_uf.get(u, self.media_global))
                           for c, u in zip(cod, uf)])
        elif self.tipo == 'nb_misto':
            mu = self.regressor.predict(self._matriz_nb(x))
            mu *= np.array([self.efeito_municipio.get(c, 1.) for c in x.codigo_ibge.astype(str)])
        else:
            xx = self._transformar(x)
            mu = self.regressor.predict(xx) * self.classificador.predict_proba(xx)[:, 1]
        return np.maximum(np.asarray(mu, float), 0.)

    def predict_ocorrencia(self, x):
        if self.tipo == 'bayes_hierarquico':
            return 1 - np.exp(-self.predict(x))
        if self.tipo == 'nb_misto':
            mu = self.predict(x)
            return 1 - np.power(1 + self.alpha_nb * mu, -1 / self.alpha_nb)
        return self.classificador.predict_proba(self._transformar(x))[:, 1]

    def explicacao(self):
        """Resumo global auditável da parte de ocorrência ou da taxa prevista."""
        if self.tipo == 'bayes_hierarquico':
            return {'metodo': 'posterior_Gamma_Poisson_por_UF_e_municipio',
                    'media_global': self.media_global, 'medias_uf': self.medias_uf,
                    'forca_prior_semanas': 52}
        if self.tipo == 'nb_misto':
            nomes = ['intercepto'] + self.colunas_nb + [f'uf_{u}' for u in self.uf_nb[1:]]
            valores = np.asarray(self.regressor.params, float)
            metodo = 'coeficientes_log_taxa_NB_e_correcao_municipal'
        elif self.tipo == 'ebm':
            nomes = list(self.classificador.term_names_)
            valores = np.asarray(self.classificador.term_importances(), float)
            metodo = 'importancia_termos_EBM_ocorrencia'
        elif self.tipo == 'logistica_poisson':
            nomes = list(self.codificador.get_feature_names_out())
            valores = np.asarray(self.classificador.coef_[0], float)
            metodo = 'coeficientes_log_odds_ocorrencia'
        else:
            nomes = list(self.codificador.get_feature_names_out())
            valores = np.asarray(self.classificador.feature_importances_, float)
            metodo = 'importancia_estrutura_arvores_ocorrencia'
        ordem = np.argsort(-np.abs(valores))[:30]
        return {'metodo': metodo, 'top_atributos': [
            {'atributo': str(nomes[i]), 'valor': float(valores[i])}
            for i in ordem if np.isfinite(valores[i])]}
