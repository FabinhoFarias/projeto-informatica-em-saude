from __future__ import annotations

import copy
import json
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path
from unittest.mock import patch

import numpy as np
import pandas as pd
import yaml

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from dengue.atributos import (ImputadorTreino, construir_atributos,
                             enriquecer_opcionais, juntar_asof)
from dengue.base import carregar_config, calendario, arquivo, salvar_parquet
from dengue.fontes import agregar_clima_diario, clima_inmet, ler_estacao_inmet, populacao, series_ibge
from dengue.painel import construir_painel
from dengue.treino import (Candidato, avaliar_testes, elegiveis, inferir,
                          calibrar_limiar_ocorrencia, metricas_ocorrencia,
                          separar_ajuste_calibracao, smote_baixo, treinar)


class PipelineTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix='dengue-teste-')
        self.addCleanup(self.tmp.cleanup)
        root = Path(self.tmp.name)
        self.cfg = carregar_config(Path(__file__).resolve().parents[1] / 'config.yaml')
        self.cfg['saida'] = str(root)
        self.cfg['entrada'] = str(root / 'sinan.parquet')
        self.cfg['ufs'] = ['26']
        self.cfg['clima']['provedor'] = 'nenhum'
        self.cfg['threads'] = 2
        self.cfg['atributos']['atraso_casos_semanas'] = 2
        self.cfg['treino'].update(iterations=12, depth=3, validacao_anos=[2020], horizontes=[1, 2],
                                 fracao_municipios_reservados=0, early_stopping_rounds=4,
                                 candidatos=['poisson', 'hurdle'], testes_anos=[2024, 2025],
                                 treino_final_ate=2023)
        for c in ['prata', 'ouro', 'relatorios', 'modelos', 'temporarios', 'bronze']:
            (root/c).mkdir()
        self.dim = pd.DataFrame({'codigo_ibge': ['2611606', '2609600'], 'codigo_sinan': ['261160', '260960'],
                                 'uf': ['26', '26'], 'nome': ['Recife', 'Olinda'], 'uf_sigla': ['PE', 'PE'],
                                 'latitude': [-8.05, -8.01], 'longitude': [-34.9, -34.85],
                                 'area_km2': [218., 42.], 'malha_ano': [2022, 2022]})
        salvar_parquet(self.dim, arquivo(self.cfg, 'prata', 'municipios.parquet'))
        salvar_parquet(pd.DataFrame({'codigo_ibge': ['2611606', '2609600'], 'vizinho': ['2609600', '2611606']}),
                       arquivo(self.cfg, 'prata', 'vizinhos.parquet'))
        pop = pd.DataFrame([(cod, y, 1e5 if cod == '2611606' else 30000, pd.Timestamp(y+1, 1, 1))
                            for cod in self.dim.codigo_ibge for y in range(2013, 2026)],
                           columns=['codigo_ibge', 'ano_populacao', 'populacao', 'disponivel_em'])
        salvar_parquet(pop, arquivo(self.cfg, 'prata', 'populacao.parquet'))

    def fixture_sinan(self):
        cal = calendario(2015, 2025)
        rng = np.random.default_rng(42)
        rows = []
        for codigo in self.dim.codigo_ibge:
            for r in cal.itertuples():
                n = int(rng.poisson(0.9 + max(0, np.sin(r.numero_semana*2*np.pi/52))))
                # Um descartado garante que a fonte anual existe mesmo com zero confirmado.
                for i in range(n+1):
                    rows.append({'ID_MN_RESI': codigo if i % 2 else codigo[:6],
                                 'SEM_PRI': r.semana_epi, 'DT_SIN_PRI': str(r.semana_inicio.date()),
                                 'DT_NOTIFIC': str((r.semana_inicio+pd.Timedelta(days=3)).date()),
                                 'CLASSI_FIN': '10' if i < n else '5',
                                 'ANO_ARQUIVO': str(r.ano_epi), 'NDUPLIC_N': None})
        raw = pd.DataFrame(rows)
        salvar_parquet(raw, self.cfg['entrada'])
        return raw

    def test_calendario_brasileiro_nao_iso(self):
        cal = calendario(2020, 2021).set_index('semana_epi')
        self.assertEqual(cal.loc['202001', 'semana_inicio'], pd.Timestamp('2019-12-29'))
        self.assertEqual(cal.loc['202053', 'semana_inicio'], pd.Timestamp('2020-12-27'))
        self.assertEqual(cal.loc['202101', 'semana_inicio'], pd.Timestamp('2021-01-03'))
        self.assertNotIn('202153', cal.index)

    def test_painel_reconciliacao_quarentena_zeros(self):
        raw = self.fixture_sinan()
        extra = raw.iloc[:3].copy()
        extra.iloc[0, extra.columns.get_loc('ID_MN_RESI')] = '2611609'  # dígito inválido
        extra.iloc[1, extra.columns.get_loc('DT_SIN_PRI')] = '2043-03-01'
        extra.iloc[2, extra.columns.get_loc('NDUPLIC_N')] = '2'
        extra['CLASSI_FIN'] = '10'
        salvar_parquet(pd.concat([raw, extra], ignore_index=True), self.cfg['entrada'])
        p = construir_painel(self.cfg)
        self.assertEqual(p.casos.sum(), (raw.CLASSI_FIN == '10').sum())
        self.assertTrue((p.casos == 0).any())
        self.assertEqual(len(p), 2*len(calendario(2015, 2025)))
        q = pd.read_parquet(arquivo(self.cfg, 'prata', 'quarentena.parquet'))
        self.assertEqual(len(q), 2)
        self.assertEqual(set(q.motivo), {'municipio_invalido', 'data_semana_divergente'})

    def test_cobertura_desconhecida_fica_nula(self):
        self.fixture_sinan()
        path = Path(self.tmp.name) / 'cobertura.csv'
        path.write_text('codigo_ibge,semana_inicio,fonte_recebida\n2611606,2015-01-04,1\n', encoding='utf-8')
        self.cfg['painel']['cobertura_csv'] = str(path)
        p = construir_painel(self.cfg)
        self.assertEqual(p.casos.notna().sum(), 1)
        self.assertEqual(p.zero_inferido.sum(), 0)

    def test_ano_antigo_invalido_chega_na_quarentena(self):
        raw = self.fixture_sinan()
        bad = raw.iloc[:1].copy()
        bad['DT_SIN_PRI'], bad['SEM_PRI'] = '0620-04-22', '062001'
        salvar_parquet(pd.concat([raw, bad], ignore_index=True), self.cfg['entrada'])
        construir_painel(self.cfg)
        q = pd.read_parquet(arquivo(self.cfg, 'prata', 'quarentena.parquet'))
        self.assertEqual(len(q), 1)
        self.assertEqual(q.motivo.iloc[0], 'semana_data_invalida')

    def test_imputador_so_aprende_no_treino(self):
        train = pd.DataFrame({'f_temperatura_lag1': [20., np.nan, 30.], 'f_vazia': [np.nan]*3,
                              'f_casos_lag2': [0., 1., 2.], 'uf': ['26']*3, 'numero_semana': [1]*3,
                              'codigo_ibge': ['2611606']*3, 'porte': ['pequeno']*3})
        imp = ImputadorTreino().fit(train, ['f_temperatura_lag1', 'f_casos_lag2', 'f_vazia'],
                                   ['uf', 'codigo_ibge', 'porte'])
        test = train.iloc[:1].copy()
        test['f_temperatura_lag1'] = np.nan
        self.assertEqual(imp.transform(test).f_temperatura_lag1.iloc[0], 25.)
        self.assertIn('f_vazia', imp.excluidas)
        test['f_temperatura_lag1'] = 1000.
        imp.transform(test)
        self.assertEqual(imp.medianas['f_temperatura_lag1'], 25.)

    def test_smote_baixo_respeita_teto_por_uf(self):
        linhas = []
        for uf in ('25', '26'):
            for i in range(12):
                linhas.append({'f_casos_lag2': float(i), 'uf': uf,
                               'codigo_ibge': f'{uf}0000{i % 2}',
                               'porte': 'medio'})
        x = pd.DataFrame(linhas)
        y = np.array([0] * 10 + [1] * 2 + [0] * 10 + [1] * 2)
        cfg = copy.deepcopy(self.cfg)
        cfg['treino']['smote'].update(razao_pos_neg_max=0.3, k_vizinhos=1,
                                      max_sinteticos_por_uf=3)
        sx, sy, meta = smote_baixo(cfg, x, y, ['uf', 'codigo_ibge', 'porte'])
        self.assertEqual(len(x), 24)  # o conjunto original não é modificado
        self.assertEqual(meta['sinteticos'], 2)
        for uf in ('25', '26'):
            labels = sy[sx.uf.eq(uf).to_numpy()]
            self.assertLessEqual(labels.sum(), 3)

    def test_metricas_ocorrencia_avalia_classe_rara(self):
        resultado = metricas_ocorrencia([0, 0, 1, 1], [0.1, 0.2, 0.8, 0.9])
        self.assertEqual(resultado['positivos'], 2)
        self.assertEqual(resultado['recall'], 1.0)
        self.assertEqual(resultado['pr_auc'], 1.0)

    def test_limiar_ocorrencia_respeita_precisao_na_calibracao(self):
        class ModeloFalso:
            def predict_ocorrencia(self, dados):
                return np.array([0.1, 0.3, 0.2, 0.8, 0.9])
        modelo = ModeloFalso()
        cfg = copy.deepcopy(self.cfg)
        cfg['treino']['ocorrencia']['precisao_minima'] = 0.75
        calibrar_limiar_ocorrencia(cfg, modelo, None, [0, 0, 1, 1, 1])
        self.assertAlmostEqual(modelo.limiar_ocorrencia, 0.2)
        self.assertGreaterEqual(modelo.calibracao_ocorrencia['precision_calibracao'], 0.75)
        self.assertEqual(modelo.calibracao_ocorrencia['recall_calibracao'], 1.0)

    def test_asof_nunca_usa_futuro(self):
        p = pd.DataFrame({'codigo_ibge': ['2611606']*2,
                           'semana_inicio': pd.to_datetime(['2020-01-05', '2020-02-02'])})
        pop = pd.DataFrame({'codigo_ibge': ['2611606']*2,
                             'disponivel_em': pd.to_datetime(['2019-01-01', '2020-02-01']),
                             'populacao': [100., 900.]})
        out = juntar_asof(p, pop, 'disponivel_em', ['populacao'])
        self.assertEqual(out.populacao.tolist(), [100., 900.])

    def test_censo2022_so_disponivel_apos_divulgacao(self):
        def resposta(cfg, url, nome):
            if nome.startswith('periodos'):
                return [{'id': '2022'}] if '4714' in nome else [{'id': '2021'}]
            var, ano = ('93', '2022') if '4714' in nome else ('9324', '2021')
            return [{'id': var, 'resultados': [{'series': [
                {'localidade': {'id': '2611606'}, 'serie': {ano: '100000'}}]}]}]
        with patch('dengue.fontes.json_baixado', side_effect=resposta):
            pop = populacao(self.cfg, self.dim)
        self.assertEqual(pop.loc[pop.ano_populacao.eq(2022), 'disponivel_em'].iloc[0], pd.Timestamp('2023-06-28'))

    def test_fonte_opcional_disponibilidade_expiracao(self):
        path = Path(self.tmp.name) / 'cnes.csv'
        path.write_text('codigo_ibge,competencia,disponivel_em,qtd_cnes\n'
                        '2611606,2020-01-01,2020-02-01,100\n', encoding='utf-8')
        self.cfg['fontes_opcionais'] = [{'nome': 'cnes', 'caminho': str(path),
                                         'colunas': ['qtd_cnes'], 'max_idade_dias': 60}]
        p = pd.DataFrame({'codigo_ibge': ['2611606']*3,
                           'semana_inicio': pd.to_datetime(['2020-01-05', '2020-02-02', '2020-04-05'])})
        out = enriquecer_opcionais(self.cfg, p)
        self.assertTrue(np.isnan(out.f_cnes_qtd_cnes.iloc[0]))
        self.assertEqual(out.f_cnes_qtd_cnes.iloc[1], 100)
        self.assertTrue(np.isnan(out.f_cnes_qtd_cnes.iloc[2]))

    def test_inmet_virada_do_ano_cobertura_e_chuva(self):
        # Uma única semana dividida em dois ZIPs anuais precisa ser recombinada.
        paths = []
        for ano, start, end in [(2019, '2019-12-29', '2019-12-31'), (2020, '2020-01-01', '2020-01-04')]:
            header = ('REGIAO:;NE\nUF:;PE\nESTACAO:;RECIFE\nCODIGO (WMO):;A301\n'
                      'LATITUDE:;-8,05\nLONGITUDE:;-34,9\nALTITUDE:;10\nDATA DE FUNDACAO:;2000-01-01\n'
                      'Data;Hora UTC;TEMPERATURA DO AR - BULBO SECO (C);'
                      'UMIDADE RELATIVA DO AR, HORARIA (%);PRECIPITACAO TOTAL, HORARIO (mm);\n')
            records = ''.join(f'{d:%Y-%m-%d};{hora:02}00 UTC;25,0;80,0;1,0;\n'
                              for d in pd.date_range(start, end) for hora in range(24))
            path = Path(self.tmp.name) / f'{ano}.zip'
            with zipfile.ZipFile(path, 'w') as z:
                z.writestr(f'estacao_{ano}.csv', (header+records).encode('latin-1'))
            paths.append(str(path))
        self.cfg['clima']['inmet_zips'] = paths
        out = clima_inmet(self.cfg, self.dim)
        self.assertEqual(set(out.codigo_ibge), set(self.dim.codigo_ibge))
        self.assertTrue(np.allclose(out.precipitacao, 168.))
        self.assertTrue(np.allclose(out.temperatura, 25.))
        self.assertTrue(np.allclose(out.temperatura_dias, 7.))

    def test_chuva_incompleta_nao_vira_zero(self):
        daily = pd.DataFrame({'data': pd.date_range('2020-01-05', periods=7),
                              'temperatura': [25.]*7, 'umidade': [80.]*7,
                              'precipitacao': [0., 0., 0., 0., 0., 0., np.nan]})
        out = agregar_clima_diario(daily)
        self.assertTrue(np.isnan(out.precipitacao.iloc[0]))
        self.assertEqual(out.temperatura.iloc[0], 25.)

    def test_mutar_futuro_nao_altera_atributos_passados(self):
        self.fixture_sinan()
        p = construir_painel(self.cfg)
        attrs1 = construir_atributos(self.cfg)
        p.loc[p.semana_inicio >= '2024-01-01', 'casos'] = 999999
        salvar_parquet(p, arquivo(self.cfg, 'ouro', 'painel.parquet'))
        attrs2 = construir_atributos(self.cfg)
        columns = [c for c in attrs1 if c.startswith('f_')]
        old = attrs1.semana_inicio < '2024-01-01'
        pd.testing.assert_frame_equal(attrs1.loc[old, columns], attrs2.loc[old, columns])

    def test_clima_futuro_nao_altera_atributos_passados(self):
        self.fixture_sinan()
        p = construir_painel(self.cfg)
        self.cfg['clima']['provedor'] = 'nasa_power'
        climate = p[['codigo_ibge', 'semana_inicio']].copy()
        climate['temperatura'], climate['umidade'], climate['precipitacao'] = 25., 80., 10.
        climate['distancia_clima_km'] = 10.
        salvar_parquet(climate, arquivo(self.cfg, 'prata', 'clima.parquet'))
        a = construir_atributos(self.cfg)
        climate.loc[climate.semana_inicio >= '2024-01-01', 'temperatura'] = 50.
        salvar_parquet(climate, arquivo(self.cfg, 'prata', 'clima.parquet'))
        b = construir_atributos(self.cfg)
        before = a.semana_inicio < '2024-01-01'
        columns = [c for c in a if c.startswith('f_')]
        pd.testing.assert_frame_equal(a.loc[before, columns], b.loc[before, columns])

    def test_vizinho_reservado_nao_fornece_dados_para_treino(self):
        self.fixture_sinan()
        construir_painel(self.cfg)
        arquivo(self.cfg, 'ouro', 'municipios_reservados.json').write_text('["2611606"]')
        with patch('dengue.atributos.reservar_municipios', return_value={'2611606'}):
            out = construir_atributos(self.cfg)
        olinda = out[out.codigo_ibge == '2609600']
        self.assertTrue(olinda.f_vizinhos_soma.isna().all())
        self.assertTrue((olinda.f_vizinhos_quantidade == 0).all())

    def test_pipeline_treino_avaliacao_inferencia(self):
        self.fixture_sinan()
        construir_painel(self.cfg)
        attrs = construir_atributos(self.cfg)
        path = treinar(self.cfg)
        self.assertTrue((path / 'modelo_h1.joblib').exists())
        self.assertFalse((path / 'testes_bloqueados.json').exists())
        card = json.loads((path / 'model_card.json').read_text())
        self.assertFalse(card['testes_bloqueados_abertos'])
        avaliar_testes(self.cfg, path)
        self.assertTrue((path / 'testes_bloqueados.json').exists())
        previsoes = inferir(self.cfg, path)
        self.assertEqual(len(previsoes), 4)
        self.assertTrue((previsoes.casos_previstos >= 0).all())
        self.assertTrue((previsoes.limite_superior >= previsoes.casos_previstos).all())
        self.assertTrue(previsoes.prob_alerta_experimental.between(0, 1).all())
        fit, cal = separar_ajuste_calibracao(self.cfg, attrs, pd.Timestamp('2020-01-01'), 2)
        self.assertLess(fit.data_alvo_h2.max(), cal.data_alvo_h2.min())
        self.assertLess(cal.data_alvo_h2.max(), pd.Timestamp('2020-01-01'))

    def test_candidato_arima_preve_municipio_sem_historico_local(self):
        semanas = pd.date_range('2020-01-05', periods=104, freq='7D')
        treino = pd.DataFrame([
            {'codigo_ibge': codigo, 'uf': '26', 'populacao': populacao,
             'data_alvo_h1': semana}
            for codigo, populacao in [('2611606', 100000), ('2609600', 50000)]
            for semana in semanas
        ])
        y = np.array([
            1 + (semana.isocalendar().week % 7)
            for _codigo in ('2611606', '2609600')
            for semana in semanas
        ], dtype=float)
        modelo = Candidato(self.cfg, 'arima').fit(
            treino, y, [], [], data_alvo='data_alvo_h1')
        futuro = pd.DataFrame({
            'codigo_ibge': ['2611606', '2609600', '2610000'],
            'uf': ['26', '26', '26'],
            'populacao': [100000, 50000, 25000],
            'data_alvo_h1': pd.date_range(semanas[-1] + pd.Timedelta(weeks=1), periods=3, freq='7D'),
        })

        previsoes = modelo.predict(futuro)
        probabilidade = modelo.predict_ocorrencia(futuro)

        self.assertEqual(len(previsoes), 3)
        self.assertTrue(np.isfinite(previsoes).all())
        self.assertTrue((previsoes >= 0).all())
        self.assertTrue(np.isfinite(probabilidade).all())
        self.assertTrue(((0 <= probabilidade) & (probabilidade <= 1)).all())
        self.assertEqual(modelo.explicacao()['metodo'],
                         'ARIMA_por_UF_em_incidencia_semanal; escala_por_populacao_municipal')

    def test_comparacao_2025_sem_teste_independente(self):
        self.cfg['treino'].update(validacao_anos=[2025], treino_final_ate=2024,
                                 testes_anos=[], horizontes=[1],
                                 candidatos=['poisson', 'hurdle', 'logistica_poisson',
                                             'bayes_hierarquico', 'nb_misto', 'arima'],
                                 max_linhas_modelos_adicionais=400)
        self.fixture_sinan()
        construir_painel(self.cfg)
        construir_atributos(self.cfg)
        with patch('dengue.modelos_adicionais.ModeloAdicional._fit_nb',
                   side_effect=ValueError('pesos numéricos inválidos')):
            pasta = treinar(self.cfg)
        registros = json.loads((pasta / 'validacao_h1.json').read_text())
        self.assertEqual({r['ano'] for r in registros}, {2025})
        self.assertEqual({r['modelo'] for r in registros if r['modelo'] in self.cfg['treino']['candidatos']},
                         set(self.cfg['treino']['candidatos']))
        self.assertIn('pesos numéricos inválidos', next(r['erro'] for r in registros
                                                     if r['modelo'] == 'nb_misto'))
        self.assertTrue(any(r['modelo'] == 'arima' for r in registros))
        self.assertFalse(json.loads((pasta / 'model_card.json').read_text())['teste_independente_disponivel'])
        with self.assertRaisesRegex(ValueError, 'Não há ano de teste independente'):
            avaliar_testes(self.cfg, pasta)


if __name__ == '__main__':
    unittest.main()
