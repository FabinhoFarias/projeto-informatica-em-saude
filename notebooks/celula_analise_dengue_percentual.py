# ================= CONFIGURAÇÃO DO PERCENTUAL =================
PERCENTUAL_BASE = 0.1  # 0.1 = 0,1%; 1 = 1%; 10 = 10%; 100 = tudo
TOTAL_REGISTROS_REFERENCIA = 32_512_002  # usado se não houver manifesto

# CÉLULA ÚNICA — LEITURA LIMITADA PELO PERCENTUAL ESCOLHIDO
from pathlib import Path
import time
import math
import json
import re
import zipfile

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from scipy.stats import chi2_contingency
from IPython.display import display

# ================= CONFIGURAÇÃO =================
if not math.isfinite(PERCENTUAL_BASE) or not 0 < PERCENTUAL_BASE <= 100:
    raise ValueError("PERCENTUAL_BASE deve ser maior que 0 e até 100.")

CSV = Path(globals().get(
    "CSV_FINAL",
    "/content/sinan-dengue/dados/dengue-completo.csv"
))

PASTA_ZIPS = Path("/content/sinan-dengue/dados/zips")

AUSENCIAS = [
    "", "nan", "NaN", "NAN", "null", "NULL",
    "None", "none", "NaT", "<NA>"
]

inicio = time.perf_counter()

opcoes = dict(
    dtype=str,
    keep_default_na=False,
    na_values=AUSENCIAS,
    encoding="utf-8-sig",
    sep=",",
)

# ============== LEITURA LIMITADA ==============
# Procura ZIPs locais sem ler seu conteúdo completo.
candidatos = list(PASTA_ZIPS.glob("*.zip"))
candidatos += list((CSV.parent / "zips").glob("*.zip"))

def ano_zip(caminho):
    nome = caminho.name
    match = re.search(r"DENGBR(\d{2})", nome, re.I)
    if match:
        return 2000 + int(match.group(1))
    match = re.search(r"\b(20\d{2}|19\d{2})\b", nome)
    return int(match.group(1)) if match else None

# Evita incluir duas cópias do mesmo arquivo anual.
arquivos_anuais = {}
for caminho in candidatos:
    ano = ano_zip(caminho)
    if ano is not None:
        arquivos_anuais.setdefault(ano, caminho)

# Apenas lê o manifesto pequeno, sem contar linhas do CSV gigante.
contagens = {}
manifesto_path = CSV.with_suffix(".manifest.json")
if manifesto_path.is_file():
    manifesto = json.loads(manifesto_path.read_text())
    contagens = {
        int(ano): int(quantidade)
        for ano, quantidade in manifesto.get("por_ano_arquivo", {}).items()
    }

TOTAL_BASE = sum(contagens.values()) if contagens else TOTAL_REGISTROS_REFERENCIA
LIMITE_PREVIA_CSV = math.ceil(TOTAL_BASE * PERCENTUAL_BASE / 100)
print(f"Percentual escolhido: {PERCENTUAL_BASE:g}%")
print(f"Quantidade-alvo da base completa: {LIMITE_PREVIA_CSV:,} registros")

partes = []

if arquivos_anuais:
    anos = sorted(arquivos_anuais)
    if all(ano in contagens for ano in anos):
        # Distribuição proporcional ao tamanho real de cada arquivo anual.
        # Arredondamento pelo maior resto mantém o orçamento total de linhas.
        fracoes = {ano: contagens[ano] * PERCENTUAL_BASE / 100 for ano in anos}
        limites = {ano: math.floor(fracoes[ano]) for ano in anos}
        alvo_disponivel = math.ceil(sum(contagens[ano] for ano in anos) * PERCENTUAL_BASE / 100)
        sobra = alvo_disponivel - sum(limites.values())
        ordem = sorted(anos, key=lambda ano: (-(fracoes[ano] - limites[ano]), ano))
        for ano in ordem[:sobra]:
            limites[ano] += 1
        print("Distribuição proporcional por ano, usando o manifesto.")
        if set(contagens) - set(anos):
            print("ATENÇÃO: faltam ZIPs de alguns anos; a leitura cobre apenas os disponíveis.")
    else:
        # Sem contagens, orçamento total dividido igualmente entre os anos.
        quota, sobra = divmod(LIMITE_PREVIA_CSV, len(anos))
        limites = {ano: quota + int(i < sobra) for i, ano in enumerate(anos)}
        print("Sem contagens por ano: orçamento dividido igualmente entre os ZIPs.")
        print("Arquivos pequenos podem fazer o total lido ficar abaixo da meta.")

    print("Lendo somente o início de cada ZIP anual...", flush=True)

    for ano, caminho in sorted(arquivos_anuais.items()):
        restantes = limites[ano]
        if restantes == 0:
            continue

        with zipfile.ZipFile(caminho) as z:
            membros = sorted(
                nome for nome in z.namelist()
                if nome.lower().endswith(".csv")
                and not nome.endswith("/")
            )

            for membro in membros:
                if restantes <= 0:
                    break

                with z.open(membro) as origem:
                    parte = pd.read_csv(
                        origem, nrows=restantes, **opcoes
                    )

                parte.columns = parte.columns.str.strip().str.upper()
                parte["ANO_ARQUIVO"] = str(ano)
                partes.append(parte)
                restantes -= len(parte)

    if not partes:
        raise ValueError("Os ZIPs encontrados não contêm CSVs utilizáveis.")

    dados = pd.concat(partes, ignore_index=True, sort=False)
    origem_analise = "Prévia do início de cada arquivo anual"

else:
    if not CSV.is_file():
        from google.colab import drive
        drive.mount("/content/drive")
        CSV = Path(
            "/content/drive/MyDrive/Denguinhos/"
            "datasets/dengue-completo.csv"
        )

    print(
        "ZIPs anuais não encontrados. "
        "Lendo somente o início do CSV gigante...",
        flush=True,
    )

    dados = pd.read_csv(
        CSV, nrows=LIMITE_PREVIA_CSV, **opcoes
    )
    dados.columns = dados.columns.str.strip().str.upper()
    origem_analise = "Prévia inicial do CSV — pode conter apenas os primeiros anos"

print(f"\n{origem_analise}")
print(f"Linhas lidas: {len(dados):,}")
print(f"Percentual efetivamente lido sobre a base de referência: {len(dados) / TOTAL_BASE * 100:.4f}%")
print("Leitura do início dos arquivos; não é uma amostra aleatória.")
print(f"Colunas: {len(dados.columns)}")
print(f"Leitura concluída em {time.perf_counter() - inicio:.1f}s")
print("ATENÇÃO: resultados abaixo se referem somente à prévia.\n")

if dados.empty:
    raise ValueError("Nenhum registro disponível para análise.")

# ================= AUSÊNCIAS =================
perfil = pd.DataFrame({
    "ausentes": dados.isna().sum(),
    "percentual_ausente": dados.isna().mean().mul(100),
    "valores_distintos": dados.nunique(dropna=True),
}).sort_values("percentual_ausente", ascending=False)

print("ATRIBUTOS — PRÉVIA")
display(perfil.head(30).round(2))

perfil.head(20)["percentual_ausente"].sort_values().plot.barh(
    figsize=(10, 6),
    color="coral",
    title="Ausências — somente registros lidos",
)
plt.xlabel("% ausente")
plt.tight_layout()
plt.show()

# ================= DUPLICATAS =================
originais = [c for c in dados.columns if c != "ANO_ARQUIVO"]

duplicados = dados.duplicated(
    subset=originais, keep=False
)

print("\nDUPLICATAS — SOMENTE REGISTROS LIDOS")
print("Linhas envolvidas:", int(duplicados.sum()))
print(
    "Cópias excedentes:",
    int(dados.duplicated(subset=originais).sum()),
)

if duplicados.any():
    display(dados.loc[duplicados].head(10))

# ================= ANOS COBERTOS =================
if "ANO_ARQUIVO" in dados.columns:
    print("\nCOBERTURA DA PRÉVIA — NÃO É O VOLUME REAL POR ANO")
    display(
        dados["ANO_ARQUIVO"]
        .value_counts()
        .sort_index()
        .rename("linhas_lidas")
        .to_frame()
    )

# ================= FREQUÊNCIAS =================
for campo in ["CS_SEXO", "CLASSI_FIN", "EVOLUCAO"]:
    if campo in dados.columns:
        print(f"\n{campo} — PRÉVIA")
        display(
            dados[campo]
            .fillna("AUSENTE")
            .value_counts()
            .head(15)
            .to_frame("quantidade")
        )

# ================= CORRELAÇÕES =================
# Aplicável aos campos cujo dicionário confirma:
# 1 = sim, 2 = não. Outros códigos ficam ausentes.
campos = [
    "FEBRE", "MIALGIA", "CEFALEIA", "EXANTEMA",
    "VOMITO", "NAUSEA", "DOR_COSTAS", "ARTRITE",
    "ARTRALGIA", "LEUCOPENIA", "DOR_RETRO",
    "DIABETES", "HEMATOLOG", "HEPATOPAT",
    "RENAL", "HIPERTENSA", "AUTO_IMUNE",
]

binarios = pd.DataFrame({
    campo: pd.to_numeric(dados[campo], errors="coerce")
             .map({1: 1.0, 2: 0.0})
    for campo in campos if campo in dados.columns
})

if len(binarios.columns) >= 2:
    correlacoes = binarios.corr(min_periods=500)
    utilizaveis = correlacoes.notna().any()
    correlacoes = correlacoes.loc[utilizaveis, utilizaveis]

    if not correlacoes.empty:
        plt.figure(figsize=(11, 8))
        sns.heatmap(
            correlacoes,
            cmap="coolwarm",
            center=0,
            vmin=-1,
            vmax=1,
        )
        plt.title("Coeficiente phi — somente a prévia")
        plt.tight_layout()
        plt.show()
    else:
        print("\nDados válidos insuficientes para correlações.")

# ================= DATAS =================
datas = {}

for campo in ["DT_NOTIFIC", "DT_SIN_PRI"]:
    if campo in dados.columns:
        datas[campo] = pd.to_datetime(
            dados[campo],
            format="%Y-%m-%d",
            errors="coerce",
        )

        invalidas = dados[campo].notna() & datas[campo].isna()

        print(
            f"\n{campo}: "
            f"{invalidas.sum():,} valores não interpretados; "
            f"intervalo observado: {datas[campo].min()} "
            f"até {datas[campo].max()}"
        )

if {"DT_NOTIFIC", "DT_SIN_PRI"}.issubset(datas):
    negativas = (
        datas["DT_NOTIFIC"] - datas["DT_SIN_PRI"]
    ).dt.days < 0

    print(
        "Notificações anteriores aos sintomas:",
        int(negativas.sum()),
    )

    if negativas.any():
        display(
            dados.loc[
                negativas, ["DT_SIN_PRI", "DT_NOTIFIC"]
            ].head(10)
        )

# ================= ASSOCIAÇÃO CATEGÓRICA =================
if {"CS_SEXO", "CLASSI_FIN"}.issubset(dados.columns):
    pares = dados[["CS_SEXO", "CLASSI_FIN"]].dropna()
    pares = pares.loc[pares["CS_SEXO"].isin(["M", "F"])]

    tabela = pd.crosstab(
        pares["CS_SEXO"], pares["CLASSI_FIN"]
    )

    if min(tabela.shape) >= 2:
        chi2, p, _, esperadas = chi2_contingency(
            tabela, correction=False
        )

        n = tabela.to_numpy().sum()
        v = np.sqrt(
            chi2 / (n * (min(tabela.shape) - 1))
        )

        print("\nSexo × classificação — PRÉVIA")
        print(f"p-valor: {p:.3g}")
        print(f"V de Cramér: {v:.3f}")
        print(
            "Células com frequência esperada < 5:",
            f"{(esperadas < 5).mean():.1%}",
        )
        display(tabela)

print(f"\nTempo total: {time.perf_counter() - inicio:.1f}s")
print(
    "Os dados analisados permanecem na variável 'dados'. "
    "Nenhuma contagem global foi executada. Percentuais altos aumentam tempo e RAM."
)
