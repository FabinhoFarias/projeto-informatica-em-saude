"""Testes: python3 -m unittest discover -s scripts/sinan -p 'test_*.py'."""
import contextlib
import csv
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import threading
import unittest
from unittest.mock import patch, MagicMock
from urllib.error import HTTPError
from urllib.parse import parse_qs, urlparse

spec = importlib.util.spec_from_file_location('extrator', Path(__file__).parents[1] / 'extrair-sinan-dengue.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

class DownloadTests(unittest.TestCase):
    def run_main(self, arguments, fetch):
        with patch('sys.argv', ['extrator'] + arguments), patch.object(m, 'fetch', side_effect=fetch), contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
            m.main()

    def test_twenty_threads_and_preservation(self):
        barrier = threading.Barrier(20)
        names = set()
        lock = threading.Lock()
        def fetch(url):
            q = parse_qs(urlparse(url).query)
            year, page = q['nu_ano'][0], int(q['offset'][0])
            self.assertEqual(q['limit'], ['1000'])
            if page == 0 and int(year) < 2020:
                with lock:
                    names.add(threading.current_thread().name)
                barrier.wait(timeout=5)
            return [{'nu_ano': year, 'codigo': '001', 'extra': str(page) + ',"texto\n'}] if page < 2 else []
        with tempfile.TemporaryDirectory() as directory:
            args = ['--ano-inicial', '2000', '--ano-final', '2021', '--output-dir', directory]
            self.run_main(args, fetch)
            self.assertEqual(len(names), 20)
            for year in range(2000, 2022):
                p = Path(directory) / f'dengue-{year}.csv'
                with p.open() as stream:
                    rows = list(csv.DictReader(stream))
                self.assertEqual(len(rows), 2)
                self.assertEqual([r['extra'] for r in rows], ['0,"texto\n', '1,"texto\n'])
                self.assertTrue(all(r['codigo'] == '001' for r in rows))
                self.assertTrue(json.loads(p.with_suffix('.manifest.json').read_text())['concluido'])
            self.run_main(args, lambda url: self.fail('Ano completo foi solicitado novamente'))

    def test_failure_resume_and_other_year_completes(self):
        def fetch(url):
            q = parse_qs(urlparse(url).query)
            year, page = q['nu_ano'][0], int(q['offset'][0])
            if year == '2010' and page == 1:
                raise TimeoutError('simulado')
            return [{'nu_ano': year}] if page == 0 else []
        with tempfile.TemporaryDirectory() as directory:
            args = ['--ano-inicial', '2010', '--ano-final', '2011', '--output-dir', directory]
            with self.assertRaises(ValueError):
                self.run_main(args, fetch)
            p = Path(directory)
            failed = json.loads((p / 'dengue-2010.manifest.json').read_text())
            self.assertFalse(failed['concluido'])
            self.assertEqual(failed['proxima_pagina'], 1)
            self.assertTrue(json.loads((p / 'dengue-2011.manifest.json').read_text())['concluido'])
            calls = []
            self.run_main(args, lambda url: calls.append(url) or [])
            self.assertEqual(len(calls), 1)
            self.assertIn('offset=1', calls[0])

    def test_repeated_page_not_saved_twice(self):
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaises(ValueError):
                self.run_main(['--ano', '2010', '--output-dir', directory], lambda url: [{'nu_ano': '2010'}])
            state = json.loads((Path(directory) / 'dengue-2010.manifest.json').read_text())
            self.assertEqual(state['registros'], 1)
            self.assertEqual(state['proxima_pagina'], 1)
            self.assertFalse(state['concluido'])

    def test_limit_and_new_columns_on_resume(self):
        with tempfile.TemporaryDirectory() as directory:
            p = Path(directory) / 'antigo.csv'
            args = ['--ano', '2010', '--output', str(p)]
            self.run_main(args + ['--max-pages', '1'], lambda url: [{'nu_ano': '2010', 'codigo': '001'}])
            def fetch(url):
                page = int(parse_qs(urlparse(url).query)['offset'][0])
                return [{'nu_ano': '2010', 'novo': 'valor'}] if page == 1 else []
            self.run_main(args, fetch)
            with p.open() as stream:
                rows = list(csv.DictReader(stream))
            self.assertEqual(len(rows), 2)
            self.assertEqual(rows[0]['codigo'], '001')
            self.assertEqual(rows[1]['novo'], 'valor')

    def test_export_only_no_network(self):
        with tempfile.TemporaryDirectory() as directory:
            self.run_main(['--ano', '2010', '--output-dir', directory, '--export-only'], lambda url: self.fail('Requisição inesperada'))

    def test_retry_502(self):
        response = MagicMock()
        response.__enter__.return_value = io.StringIO('{"dengue": []}')
        error = HTTPError('https://example.test', 502, 'Proxy Error', {}, None)
        with patch.object(m, 'urlopen', side_effect=[error, response]) as request, patch.object(m.time, 'sleep') as sleep, contextlib.redirect_stderr(io.StringIO()):
            self.assertEqual(m.fetch('https://example.test'), [])
        self.assertEqual(request.call_count, 2)
        sleep.assert_called_once_with(1)

    def test_persistent_502_not_empty(self):
        error = HTTPError('https://example.test', 502, 'Proxy Error', {}, None)
        with patch.object(m, 'urlopen', side_effect=error) as request, patch.object(m.time, 'sleep'), contextlib.redirect_stderr(io.StringIO()):
            with self.assertRaises(HTTPError):
                m.fetch('https://example.test')
        self.assertEqual(request.call_count, 6)
