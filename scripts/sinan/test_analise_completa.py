"""Testes executáveis com: python -m unittest discover -s scripts/sinan."""
import contextlib
import csv
import importlib.util
import io
from pathlib import Path
import tempfile
import unittest

AVAILABLE = importlib.util.find_spec('duckdb') and importlib.util.find_spec('pandas')
ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('analise_completa', ROOT/'scripts/sinan_analise_completa.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)


@unittest.skipUnless(AVAILABLE, 'Requer duckdb e pandas')
class FullAnalysisTests(unittest.TestCase):
    def setUp(self):
        import pandas as pd
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        self.csv = self.root/'base.csv'
        self.columns = ['ANO_ARQUIVO','SG_UF','ID_MN_RESI','DT_NOTIFIC','DT_SIN_PRI','FEBRE','MIALGIA','VAZIA']
        first = ['2000','PE','2611606','2000-01-03','2000-01-02','1','2','']
        self.rows = [first,
            ['2000','26.0','261160.0','2000-01-04','2000-01-02','2','1','nan'],
            ['2026','','3550308','2026-03-01','bad','nan','1','NULL'],
            ['2026','XX','12','bad','','9','2','None'],
            ['2026','53','5300108','2026-02-01','2026-02-02','1','1','<NA>'],
            ['2026']+first[1:], first.copy(),
            ['2026','AC','1200401','2026-01-01','2026-01-01','2','2','NaT']]
        with self.csv.open('w', newline='') as stream:
            writer = csv.writer(stream); writer.writerow(self.columns); writer.writerows(self.rows)
        self.reference = pd.read_csv(self.csv, dtype=str, keep_default_na=False, na_values=m.AUSENCIAS)
        self.analysis = m.AnaliseSinan(self.root/'analise', memoria='256MB', threads=2)
        with contextlib.redirect_stdout(io.StringIO()):
            self.analysis.preparar_csv(self.csv)

    def tearDown(self):
        self.analysis.fechar()
        self.temporary.cleanup()

    def test_full_counts_region_fallback_and_unknown_denominator(self):
        self.assertEqual(self.analysis.total, 8)
        regions = self.analysis.regioes().set_index('regiao')
        self.assertEqual(regions['notificacoes'].to_dict(), {
            'Nordeste':4,'Sudeste':1,'Centro-Oeste':1,'Norte':1,'Não identificada':1})
        self.assertAlmostEqual(regions['percentual_do_total'].sum(), 100)
        six = self.analysis.municipio('261160')
        seven = self.analysis.municipio('2611606')
        self.assertTrue(six.equals(seven))
        self.assertEqual(six['notificacoes'].tolist(), [3,1])
        self.assertEqual(self.analysis.por_ano()['notificacoes'].sum(), 8)
        self.assertEqual(self.analysis.municipio('999999')['notificacoes'].sum(), 0)

    def test_missing_metadata_matches_every_column_of_reference(self):
        actual = self.analysis.ausencias().set_index('coluna')['ausentes'].to_dict()
        self.assertEqual(actual, self.reference.isna().sum().to_dict())
        self.assertEqual(actual['VAZIA'], 8)

    def test_categorical_table_matches_reference(self):
        import pandas as pd
        actual = self.analysis.tabela_associacao('FEBRE','MIALGIA')
        expected = pd.crosstab(self.reference['FEBRE'], self.reference['MIALGIA'])
        expected.index.name = 'categoria_a'
        expected.columns.name = 'categoria_b'
        pd.testing.assert_frame_equal(actual, expected)

    def test_queries_use_parquet_after_csv_is_removed(self):
        self.csv.unlink()
        self.assertEqual(self.analysis.regioes()['notificacoes'].sum(), 8)
        self.assertEqual(self.analysis.municipio('2611606')['notificacoes'].sum(), 4)
        self.assertEqual(len(self.analysis.ausencias()), len(self.columns))
        self.assertEqual(self.analysis.frequencias('FEBRE')['notificacoes'].sum(), 8)

    def test_exact_duplicates_compare_all_original_values(self):
        expected = self.reference.duplicated(subset=[c for c in self.columns if c!='ANO_ARQUIVO']).sum()
        result = self.analysis.duplicatas_exatas().iloc[0]
        self.assertEqual(result['copias_excedentes'], expected)
        self.assertEqual(result['linhas_envolvidas'], 3)
        self.assertEqual(result['grupos_duplicados'], 1)

    def test_correlations_and_pair_counts_match_reference(self):
        import pandas as pd
        frame = self.reference[['FEBRE','MIALGIA']].apply(pd.to_numeric, errors='coerce')
        frame = frame.apply(lambda column: column.map({1:1.,2:0.}))
        expected = frame.corr(min_periods=2)
        actual, counts = self.analysis.correlacoes(['FEBRE','MIALGIA'], minimo_validos=2)
        pd.testing.assert_frame_equal(actual, expected, atol=1e-10, rtol=1e-10)
        present = frame.notna().astype('int64')
        pd.testing.assert_frame_equal(counts, present.T@present)

    def test_temporal_uses_dates_instead_of_archive_year_and_reports_invalids(self):
        temporal = self.analysis.serie_temporal('2611606', periodo='year')
        self.assertEqual(temporal['notificacoes'].tolist(), [4])
        self.assertEqual(temporal['periodo'].iloc[0].year, 2000)
        quality = self.analysis.qualidade_datas().iloc[0]
        self.assertEqual(quality['notificacao_antes_dos_sintomas'], 1)
        self.assertEqual(quality['DT_NOTIFIC_INVALIDA'], 1)
        self.assertEqual(quality['DT_SIN_PRI_INVALIDA'], 1)

    def test_can_open_prepared_artifact_without_csv_or_dataframe(self):
        parquet = self.analysis.parquet
        self.csv.unlink()
        other = m.AnaliseSinan(self.root/'outra', memoria='256MB', threads=2)
        try:
            with contextlib.redirect_stdout(io.StringIO()):
                other.abrir_parquet(parquet)
            self.assertEqual(other.total, 8)
            self.assertTrue(other.regioes().equals(self.analysis.regioes()))
        finally:
            other.fechar()

    def test_bad_csv_is_not_silently_skipped(self):
        with self.csv.open('a') as stream:
            stream.write('valor,extra,invalido,com,muitas,colunas,a,mais,que,antes\n')
        with contextlib.redirect_stdout(io.StringIO()):
            with self.assertRaises(Exception):
                self.analysis.preparar_csv(self.csv)
        self.assertFalse(self.analysis.pronta)

    def test_invalid_inputs_fail_before_query(self):
        with self.assertRaises(ValueError): self.analysis.municipio('26116')
        with self.assertRaises(ValueError): self.analysis.serie_temporal(data='ANO_ARQUIVO')
        with self.assertRaises(ValueError): self.analysis.correlacoes(['INEXISTENTE'])
