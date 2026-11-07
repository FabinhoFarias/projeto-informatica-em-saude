#!/usr/bin/env python3
"""Gera a célula única de análise exata usando o mesmo módulo do notebook principal."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main():
    source = '''# CÉLULA ÚNICA — ANÁLISE EXATA DA BASE INTEIRA
from pathlib import Path
import os

CSV = Path(globals().get("CSV_FINAL", "/content/sinan-dengue/dados/dengue-completo.csv"))
PASTA_ANALISE = Path("/content/sinan-dengue/analise")
PREPARAR_ANALISE = True  # False: abre explicitamente o Parquet já preparado
PARQUET_EXISTENTE = PASTA_ANALISE / "dengue-analitico.parquet"
MEMORIA_ANALISE = "3GB"
THREADS_ANALISE = min(8, os.cpu_count() or 2)
CODIGO_MUNICIPIO = "2611606"
CAMPOS_CORRELACAO = ["FEBRE", "MIALGIA", "CEFALEIA", "DIABETES", "HIPERTENSA"]
CALCULAR_CORRELACOES = True
CALCULAR_DUPLICATAS_EXATAS = False

import importlib.util
import subprocess
import sys
for pacote in ("duckdb", "pandas"):
    if importlib.util.find_spec(pacote) is None:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", pacote])

'''
    # Definições incorporadas legíveis, sem depender de arquivos do repositório.
    source += (ROOT/'scripts/sinan_analise_completa.py').read_text()
    source += '''
from IPython.display import display
import matplotlib.pyplot as plt

if PREPARAR_ANALISE and not CSV.is_file():
    from google.colab import drive
    drive.mount("/content/drive")
    CSV = Path("/content/drive/MyDrive/Denguinhos/datasets/dengue-completo.csv")
if "analise" in globals():
    analise.fechar()
analise = AnaliseSinan(PASTA_ANALISE, memoria=MEMORIA_ANALISE, threads=THREADS_ANALISE)
if PREPARAR_ANALISE:
    analise.preparar_csv(CSV)
else:
    analise.abrir_parquet(PARQUET_EXISTENTE)
print(f"BASE COMPLETA: {analise.total:,} registros")
por_ano = analise.por_ano()
perfil_completo = analise.ausencias()
resultado_regioes = analise.regioes()
por_municipio = analise.municipio(CODIGO_MUNICIPIO)
serie = analise.serie_temporal(municipio=CODIGO_MUNICIPIO)
for titulo, resultado in [("Por ano", por_ano), ("Ausências", perfil_completo),
                          ("Regiões", resultado_regioes), ("Município", por_municipio),
                          ("Datas", analise.qualidade_datas())]:
    print(titulo); display(resultado)
resultado_regioes.plot.bar(x="regiao", y="percentual_do_total", legend=False, figsize=(10,5))
plt.tight_layout(); plt.show()
if not serie.empty:
    serie.plot(x="periodo", y="notificacoes", legend=False, figsize=(14,4))
    plt.tight_layout(); plt.show()
if CALCULAR_CORRELACOES:
    campos = [c for c in CAMPOS_CORRELACAO if c in analise.colunas]
    if campos:
        correlacoes, observacoes_validas = analise.correlacoes(campos)
        display(correlacoes); display(observacoes_validas)
if CALCULAR_DUPLICATAS_EXATAS:
    display(analise.duplicatas_exatas())
print("As consultas futuras podem usar 'analise', sem reconverter o CSV.")
'''
    cell_path = ROOT/'notebooks/celula_analise_dengue.py'
    notebook_path = ROOT/'notebooks/analise_dengue_colab.ipynb'
    cell_path.write_text(source)
    notebook = {'nbformat':4,'nbformat_minor':5,'metadata':{
        'colab':{'name':notebook_path.name,'provenance':[]},
        'kernelspec':{'display_name':'Python 3','language':'python','name':'python3'},
        'language_info':{'name':'python'}},'cells':[{
            'cell_type':'code','id':'analise-completa','metadata':{},
            'source':source.splitlines(keepends=True),'execution_count':None,'outputs':[]}]}
    notebook_path.write_text(json.dumps(notebook, ensure_ascii=False, indent=2)+'\n')
    print(cell_path)
    print(notebook_path)


if __name__ == '__main__':
    main()
