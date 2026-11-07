#!/usr/bin/env python3
"""Gera o notebook completo: download explícito e análise exata em Parquet."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PIPELINE = ROOT / 'scripts/baixar-sinan-dengue-arquivos.py'
ANALISE = ROOT / 'scripts/sinan_analise_completa.py'
NOTEBOOK = ROOT / 'notebooks/sinan_dengue_colab.ipynb'


def cell(kind, identifier, source, **metadata):
    result = {'cell_type': kind, 'id': identifier, 'metadata': metadata, 'source': source.splitlines(keepends=True)}
    if kind == 'code':
        result.update(execution_count=None, outputs=[])
    return result


def main():
    cells = [
        cell('markdown', 'inicio', '''# SINAN Dengue — download e análise da base inteira

**Se o CSV já está no Colab, mantenha `EXECUTAR_DOWNLOAD = False`.** A execução começa diretamente da preparação analítica. Nenhuma célula apaga DataFrames existentes ou os arquivos de origem.

O download, quando habilitado, continua baixando tudo do zero. A análise é independente: o CSV é convertido uma vez para Parquet e todas as consultas usam uma conexão comum. Não se carrega a base inteira em pandas. As tabelas exibidas são resultados agregados da base completa, sem percentual de amostragem.

A primeira conversão ainda precisa ler os 10+ GiB do CSV. Depois, as consultas leem apenas colunas necessárias; município e região usam um resumo exato já calculado. Não há promessa de tempo fixo. CPU é suficiente; GPU não acelera estas consultas.
'''),
        cell('code', 'configuracao', '''from pathlib import Path
import os
import shutil

# FLUXO: False para analisar o CSV que já está no ambiente.
EXECUTAR_DOWNLOAD = False
PREPARAR_ANALISE = True  # False abre explicitamente PARQUET_EXISTENTE.
THREADS_DOWNLOAD = 20
THREADS_ANALISE = min(8, os.cpu_count() or 2)
MEMORIA_ANALISE = "3GB"
SALVAR_NO_DRIVE = False
PASTA_NO_DRIVE = "Denguinhos/datasets"

TRABALHO = Path("/content/sinan-dengue")
TRABALHO.mkdir(parents=True, exist_ok=True)
SCRIPT = TRABALHO / "baixar-sinan-dengue-arquivos.py"
DADOS = TRABALHO / "dados"
# Preserva o caminho da sessão existente. Edite se o arquivo estiver em outra pasta.
CSV_FINAL = Path(globals().get("CSV_FINAL", DADOS / "dengue-completo.csv"))
PASTA_ANALISE = TRABALHO / "analise"
PARQUET_EXISTENTE = PASTA_ANALISE / "dengue-analitico.parquet"

CODIGO_MUNICIPIO = "2611606"  # Recife; aceita 6 ou 7 dígitos.
DATA_SERIE = "DT_NOTIFIC"  # ou DT_SIN_PRI
PERIODO_SERIE = "month"  # day, week, month ou year
CALCULAR_CORRELACOES = True
CAMPOS_CORRELACAO = ["FEBRE", "MIALGIA", "CEFALEIA", "DIABETES", "HIPERTENSA"]
CALCULAR_DUPLICATAS_EXATAS = False  # operação pesada e optativa

print("CSV:", CSV_FINAL)
print(f"Disco livre: {shutil.disk_usage(TRABALHO).free / 1024**3:.2f} GiB")
print("Download:", EXECUTAR_DOWNLOAD, "| preparação analítica:", PREPARAR_ANALISE)
'''),
        cell('code', 'pipeline-incorporado', 'PIPELINE_SOURCE = ' + repr(PIPELINE.read_text()) + '\nSCRIPT.write_text(PIPELINE_SOURCE, encoding="utf-8")\n', cellView='form'),
        cell('code', 'modulo-analise', '''import importlib.util
import subprocess
import sys

for pacote in ("duckdb", "pandas"):
    if importlib.util.find_spec(pacote) is None:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", pacote])

''' + 'ANALISE_SOURCE = ' + repr(ANALISE.read_text()) + '''
namespace_analise = {"__name__": "sinan_analise_completa"}
exec(compile(ANALISE_SOURCE, "sinan_analise_completa.py", "exec"), namespace_analise)
AnaliseSinan = namespace_analise["AnaliseSinan"]
''', cellView='form'),
        cell('markdown', 'drive-descricao', '''## Drive opcional

Ative a opção na configuração para montar o Drive e salvar a saída ao final. Para um CSV já salvo no Drive, você também pode montá-lo manualmente e ajustar `CSV_FINAL`. Prefira o Parquet local para as consultas: ler pelo Drive pode acrescentar latência.

Os arquivos de `/content` são temporários. A cópia para o Drive requer quota disponível. [Documentação oficial do Colab](https://colab.research.google.com/notebooks/io.ipynb).
'''),
        cell('code', 'montar-drive', '''if SALVAR_NO_DRIVE:
    from google.colab import drive
    drive.mount("/content/drive")
    relativo = Path(PASTA_NO_DRIVE)
    if relativo.is_absolute() or ".." in relativo.parts:
        raise ValueError("PASTA_NO_DRIVE deve ser relativa a Meu Drive")
    DESTINO_DRIVE = Path("/content/drive/MyDrive") / relativo
    DESTINO_DRIVE.mkdir(parents=True, exist_ok=True)
'''),
        cell('markdown', 'executar-descricao', '''## 1. Download e CSV único — somente quando solicitado

Com `EXECUTAR_DOWNLOAD = True`, baixa todos os ZIPs novamente e gera o CSV por ano de origem crescente. Não consulta cache nem retoma downloads. Com a opção desativada, esta etapa não abre nem regrava os dados existentes.
'''),
        cell('code', 'executar-pipeline', '''import subprocess
import sys
import time

PIPELINE_OK = False
if EXECUTAR_DOWNLOAD:
    inicio = time.monotonic()
    comando = [sys.executable, "-u", str(SCRIPT), "--output-dir", str(DADOS),
               "--output", str(CSV_FINAL), "--threads", str(THREADS_DOWNLOAD)]
    with subprocess.Popen(comando, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                          text=True, encoding="utf-8", errors="replace", bufsize=1) as processo:
        try:
            for linha in processo.stdout:
                print(linha, end="", flush=True)
            codigo = processo.wait()
        except BaseException:
            processo.terminate()
            processo.wait()
            raise
    if codigo:
        raise RuntimeError(f"Download/consolidação falhou: código {codigo}")
    PIPELINE_OK = True
    print(f"Tempo de download e consolidação: {(time.monotonic()-inicio)/60:.1f} min")
else:
    print("Download desativado. Será usado o arquivo indicado em CSV_FINAL.")
'''),
        cell('code', 'resultado', '''import json

MANIFESTO = CSV_FINAL.with_suffix(".manifest.json")
if EXECUTAR_DOWNLOAD:
    if not PIPELINE_OK:
        raise RuntimeError("O download não terminou com sucesso")
    resumo = json.loads(MANIFESTO.read_text())
    print(f"CSV: {CSV_FINAL} | registros: {resumo['registros']:,}")
else:
    print("Fonte selecionada para análise:", CSV_FINAL)
'''),
        cell('markdown', 'preparar-descricao', '''## 2. Preparação única da base completa

Converte o CSV para Parquet comprimido, com memória limitada e processamento nativo. Preserva todas as linhas e as colunas originais. Cinco colunas internas são expressões virtuais, calculadas somente quando uma consulta precisa delas. O resumo geográfico agrupa antes de normalizar os códigos, evitando transformar milhões de valores repetidos. Strings técnicas de ausência (`nan`, vazios etc.) tornam-se nulos na cópia analítica; o CSV original não é alterado.

Erros de parsing interrompem a preparação: nenhuma linha é ignorada silenciosamente. Um resumo por ano, município e região é calculado uma vez sobre **todos os registros**. Depois disso, reexecute as células de consulta sem rodar novamente esta preparação.

Para abrir um Parquet preparado em outra sessão, selecione `PREPARAR_ANALISE = False` e configure `PARQUET_EXISTENTE`. A primeira conversão requer espaço adicional para o Parquet e temporários. A ordem das linhas do Parquet é livre; o CSV continua em ordem anual e as séries são ordenadas pela data escolhida.
'''),
        cell('code', 'preparar-analise', '''if "analise" in globals():
    analise.fechar()
analise = AnaliseSinan(PASTA_ANALISE, memoria=MEMORIA_ANALISE, threads=THREADS_ANALISE)
if PREPARAR_ANALISE:
    analise.preparar_csv(CSV_FINAL)
else:
    analise.abrir_parquet(PARQUET_EXISTENTE)
print(f"BASE COMPLETA: {analise.total:,} registros | {len(analise.colunas)} colunas de origem")
print(f"Parquet: {analise.parquet} | {analise.parquet.stat().st_size / 1024**3:.2f} GiB")
print("Não foi criado um DataFrame com a base inteira.")
'''),
        cell('markdown', 'perfil-descricao', '''## 3. Totais e ausências exatas

Os totais por ano usam o resumo calculado na preparação. As ausências são obtidas das estatísticas do Parquet, evitando ler bilhões de valores novamente. Cardinalidade e contagem de valores distintos de todas as colunas não são calculadas automaticamente.
'''),
        cell('code', 'perfil-global', '''from IPython.display import display
import matplotlib.pyplot as plt

por_ano = analise.por_ano()
perfil_completo = analise.ausencias()
display(por_ano)
display(perfil_completo.head(30).round(2))
perfil_completo.head(20).sort_values("percentual_ausente").plot.barh(
    x="coluna", y="percentual_ausente", figsize=(10,6), legend=False,
    title="Ausências — base completa")
plt.xlabel("% dos registros")
plt.tight_layout(); plt.show()
'''),
        cell('markdown', 'geografia-descricao', '''## 4. Município e regiões — base inteira

Usa município de residência (`ID_MN_RESI`), normalizado para seis dígitos. A região vem de `SG_UF` de residência; se inválida, tenta a UF do município. Localização não identificada permanece no denominador. São **notificações**, sem filtro de confirmação e sem remover duplicatas: os percentuais não são incidência populacional.
'''),
        cell('code', 'municipio-completo', '''por_municipio = analise.municipio(CODIGO_MUNICIPIO)
print(f"Município {CODIGO_MUNICIPIO}: {int(por_municipio['notificacoes'].sum()):,} notificações")
display(por_municipio)
'''),
        cell('code', 'regioes-completo', '''resultado_regioes = analise.regioes()
display(resultado_regioes.round(2))
resultado_regioes.plot.bar(x="regiao", y="percentual_do_total", legend=False,
    figsize=(10,5), title="Participação nas notificações — base completa")
plt.ylabel("% do total, incluindo localização não identificada")
plt.xticks(rotation=25)
plt.tight_layout(); plt.show()
'''),
        cell('markdown', 'temporal-descricao', '''## 5. Série temporal e qualidade das datas

Agrega por data de notificação ou sintomas, não pelo ano do ZIP. Cada consulta lê somente as colunas necessárias do Parquet. Para série de um município, passe seu código; para o Brasil, use `None`. Datas inválidas são contabilizadas na tabela de qualidade e não entram na série. Períodos ausentes não são preenchidos automaticamente com zero.
'''),
        cell('code', 'serie-completa', '''serie = analise.serie_temporal(municipio=CODIGO_MUNICIPIO,
    data=DATA_SERIE, periodo=PERIODO_SERIE)
display(serie.head(12))
if not serie.empty:
    serie.plot(x="periodo", y="notificacoes", figsize=(14,4), legend=False,
        title=f"Notificações por {DATA_SERIE} — município {CODIGO_MUNICIPIO}")
    plt.tight_layout(); plt.show()
display(analise.qualidade_datas())
'''),
        cell('markdown', 'correlacao-descricao', '''## 6. Correlações exatas — campos selecionados

Usa todos os registros com dados válidos para cada par. Apenas nos indicadores cujo dicionário confirma `1=sim` e `2=não`, calcula coeficiente phi e número de observações por par. Outros códigos ficam nulos para esse cálculo. A consulta lê somente os indicadores escolhidos; cinco campos têm 10 pares distintos, enquanto 17 têm 136. Ampliar a lista aumenta o trabalho. Correlação não demonstra causalidade e mudanças no formulário entre anos afetam a interpretação.
'''),
        cell('code', 'correlacoes-completas', '''if CALCULAR_CORRELACOES:
    campos = [c for c in CAMPOS_CORRELACAO if c in analise.colunas]
    if campos:
        correlacoes, observacoes_validas = analise.correlacoes(campos)
        display(correlacoes.round(3))
        display(observacoes_validas)
    else:
        print("Nenhum dos indicadores escolhidos está disponível.")
else:
    print("Correlações desativadas na configuração.")
'''),
        cell('markdown', 'associacao-descricao', """## Associação categórica — base completa

A tabela de contingência é agregada no DuckDB lendo apenas duas colunas; somente a tabela pequena chega ao SciPy. O teste inclui as categorias não nulas publicadas, inclusive códigos de ignorado; revise-os conforme o dicionário. Observe o V de Cramér e frequências esperadas, não apenas o p-valor. A análise agregada mistura anos e não ajusta fatores de confusão.
"""),
        cell('code', 'associacao-completa', """if {"CS_SEXO", "CLASSI_FIN"}.issubset(analise.colunas):
    from scipy.stats import chi2_contingency
    tabela = analise.tabela_associacao("CS_SEXO", "CLASSI_FIN")
    display(tabela)
    if min(tabela.shape) >= 2:
        chi2, p, _, esperadas = chi2_contingency(tabela, correction=False)
        n = tabela.to_numpy().sum()
        v = (chi2 / (n * (min(tabela.shape)-1))) ** 0.5
        print(f"p={p:.3g}; V de Cramér={v:.3f}; esperadas <5: {(esperadas<5).mean():.1%}")
"""),
        cell('markdown', 'duplicatas-descricao', '''## 7. Duplicatas exatas — operação pesada, optativa

Compara todos os campos originais, ignorando `ANO_ARQUIVO` e colunas internas. Não usa aproximações por hash. Em 32,5 milhões de registros e 197 colunas, pode exigir bastante tempo e espaço temporário. Fica desativada por padrão. Registros idênticos nas colunas publicadas podem representar notificações diferentes; nenhum registro é removido automaticamente.
'''),
        cell('code', 'duplicatas-completas', '''if CALCULAR_DUPLICATAS_EXATAS:
    display(analise.duplicatas_exatas())
else:
    print("Duplicatas exatas desativadas. Ative conscientemente na configuração.")
'''),
        cell('code', 'salvar-drive', '''if not globals().get("PIPELINE_OK", False) and globals().get("EXECUTAR_DOWNLOAD", True):
    raise RuntimeError("Pipeline não concluído; o resultado não será copiado.")

if SALVAR_NO_DRIVE:
    for origem in (CSV_FINAL, MANIFESTO):
        destino = DESTINO_DRIVE / origem.name
        temporario = destino.with_suffix(destino.suffix + ".part")
        print(f"Copiando {origem.name} para o Drive...", flush=True)
        with origem.open("rb") as entrada, temporario.open("wb") as saida:
            shutil.copyfileobj(entrada, saida, 8 * 1024 * 1024)
        temporario.replace(destino)
else:
    print("Cópia de CSV para o Drive desativada.")
'''),
        cell('code', 'salvar-parquet-drive', '''if SALVAR_NO_DRIVE:
    origem = analise.parquet
    destino = DESTINO_DRIVE / origem.name
    temporario = destino.with_suffix(destino.suffix + ".part")
    print("Copiando Parquet para o Drive...", flush=True)
    with origem.open("rb") as entrada, temporario.open("wb") as saida:
        shutil.copyfileobj(entrada, saida, 8 * 1024 * 1024)
    temporario.replace(destino)
    print("Base analítica persistida:", destino)
'''),
        cell('markdown', 'treinar', '''## Treinamento e consultas adicionais

A base completa é a view SQL `base` da conexão `analise.con`; ela não é a variável `dados` das células antigas. Somente resultados pequenos são convertidos para pandas. Para frequências de uma coluna, use `analise.frequencias("CLASSI_FIN")`. Para a série nacional, use `analise.serie_temporal(municipio=None, data=DATA_SERIE, periodo=PERIODO_SERIE)`.

O DataFrame `serie` pode ser usado para preparar o treinamento temporal, depois de definir o alvo (notificações, casos prováveis ou confirmados), cobertura e critérios de preenchimento de períodos. Divida treino e teste cronologicamente. Evite `SELECT * FROM base` seguido de `.df()`: isso volta a carregar dezenas de milhões de linhas na RAM.

Os arquivos e DataFrames antigos não são apagados. As antigas células de prévia foram retiradas deste notebook para não confundir resultados de amostra com a base inteira. O notebook original está preservado em `notebooks/referencia/sinan_dengue_colab_antes_refatoracao.ipynb` no projeto.
'''),
    ]
    notebook = {'nbformat': 4, 'nbformat_minor': 5, 'metadata': {
        'colab': {'name': NOTEBOOK.name, 'provenance': []},
        'kernelspec': {'display_name': 'Python 3', 'language': 'python', 'name': 'python3'},
        'language_info': {'name': 'python', 'version': '3.11.0'},
    }, 'cells': cells}
    NOTEBOOK.parent.mkdir(parents=True, exist_ok=True)
    NOTEBOOK.write_text(json.dumps(notebook, ensure_ascii=False, indent=2) + '\n')
    print(NOTEBOOK)


if __name__ == '__main__':
    main()
