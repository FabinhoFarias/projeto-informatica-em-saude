"""Valida o notebook autossuficiente e a publicação do resultado no Drive."""
import contextlib
import io
import json
from pathlib import Path
import shutil
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
NOTEBOOK = ROOT / 'notebooks/sinan_dengue_colab.ipynb'


class ColabTests(unittest.TestCase):
    def test_eda_is_one_cell_and_matches_copy_paste_file(self):
        notebook = json.loads((ROOT / 'notebooks/analise_dengue_colab.ipynb').read_text())
        self.assertEqual(len(notebook['cells']), 1)
        cell = notebook['cells'][0]
        self.assertEqual(cell['cell_type'], 'code')
        source = ''.join(cell['source'])
        self.assertEqual(source, (ROOT / 'notebooks/celula_analise_dengue.py').read_text())
        compile(source, 'celula_eda', 'exec')
        core = (ROOT / 'scripts/sinan_analise_completa.py').read_text()
        self.assertIn(core, source)
        self.assertIn('CALCULAR_DUPLICATAS_EXATAS = False', source)
        self.assertEqual(cell['outputs'], [])

    def setUp(self):
        self.notebook = json.loads(NOTEBOOK.read_text())
        self.cells = {cell['id']: ''.join(cell['source']) for cell in self.notebook['cells']}

    def test_code_cells_compile_and_have_no_saved_outputs(self):
        self.assertEqual(self.notebook['nbformat'], 4)
        ids = [cell['id'] for cell in self.notebook['cells']]
        self.assertEqual(len(ids), len(set(ids)))
        for cell in self.notebook['cells']:
            if cell['cell_type'] == 'code':
                compile(''.join(cell['source']), cell['id'], 'exec')
                self.assertEqual(cell['outputs'], [])
                self.assertIsNone(cell['execution_count'])

    def test_embedded_script_matches_pipeline_and_runs_without_repo(self):
        with tempfile.TemporaryDirectory() as directory:
            script = Path(directory) / 'pipeline.py'
            namespace = {'SCRIPT': script}
            with contextlib.redirect_stdout(io.StringIO()):
                exec(self.cells['pipeline-incorporado'], namespace)
            source = (ROOT / 'scripts/baixar-sinan-dengue-arquivos.py').read_text()
            self.assertEqual(script.read_text(), source)
            compile(script.read_text(), str(script), 'exec')

    def test_main_notebook_embeds_current_analytical_module_and_is_full_base(self):
        namespace = {}
        with patch('importlib.util.find_spec', return_value=True), contextlib.redirect_stdout(io.StringIO()):
            exec(self.cells['modulo-analise'], namespace)
        self.assertEqual(namespace['ANALISE_SOURCE'], (ROOT/'scripts/sinan_analise_completa.py').read_text())
        self.assertIn('EXECUTAR_DOWNLOAD = False', self.cells['configuracao'])
        self.assertIn('SALVAR_NO_DRIVE = False', self.cells['configuracao'])
        self.assertIn('CALCULAR_DUPLICATAS_EXATAS = False', self.cells['configuracao'])
        self.assertIn('analise.municipio(', self.cells['municipio-completo'])
        self.assertIn('analise.regioes()', self.cells['regioes-completo'])
        self.assertNotIn('PERCENTUAL_BASE', ''.join(self.cells.values()))

    def test_drive_copy_preserves_complete_csv_and_manifest(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / 'dengue-completo.csv'
            source.write_bytes(b'ANO_ARQUIVO,CODIGO\n2000,001\n2026,002\n')
            manifest = root / 'dengue-completo.manifest.json'
            manifest.write_text('{"registros": 2}')
            drive = root / 'drive'
            drive.mkdir()
            (drive / source.name).write_bytes(b'old')
            namespace = {'PIPELINE_OK': True, 'SALVAR_NO_DRIVE': True, 'DESTINO_DRIVE': drive,
                         'CSV_FINAL': source, 'MANIFESTO': manifest,
                         'PASTA_NO_DRIVE': 'Denguinhos/datasets', 'shutil': shutil}
            with contextlib.redirect_stdout(io.StringIO()):
                exec(self.cells['salvar-drive'], namespace)
            self.assertEqual((drive / source.name).read_bytes(), source.read_bytes())
            self.assertEqual((drive / manifest.name).read_bytes(), manifest.read_bytes())
            self.assertEqual(list(drive.glob('*.part')), [])
            self.assertTrue(source.is_file())

    def test_local_only_does_not_need_google_drive(self):
        namespace = {'PIPELINE_OK': True, 'SALVAR_NO_DRIVE': False, 'CSV_FINAL': Path('/local/dengue.csv')}
        with contextlib.redirect_stdout(io.StringIO()):
            exec(self.cells['salvar-drive'], namespace)

    def test_failed_pipeline_cannot_publish_an_old_result(self):
        with self.assertRaisesRegex(RuntimeError, 'não concluído'):
            exec(self.cells['salvar-drive'], {'PIPELINE_OK': False})
