# Treinamento no Google Colab

Abra [treinamento_dengue_colab.ipynb](../../notebooks/treinamento_dengue_colab.ipynb).
O código do pipeline e a configuração estão diretamente nas células do
notebook. Ele não importa módulos do projeto, não lê `config.yaml` e não precisa
do repositório, de `manifesto.json`, de `codigo_e_atributos.zip` ou de artefatos
previamente preparados.

## Entrada

No Colab, abra o notebook e envie para `/content` somente:

- o Parquet completo `dengue-analitico.parquet`; ou
- todas as partes sequenciais `dengue-analitico.parquet.part001`,
  `.part002`, etc.

O notebook abre a janela de upload se não encontrar os dados. Também aceita
arquivos dentro de `/content/pacoteColab/`. Não envie simultaneamente mais de
um Parquet completo. O notebook valida se o dataset contém as colunas SINAN
necessárias antes de começar. A entrada original não é modificada.

## Execução

Execute todas as células em ordem. As células definem o pipeline diretamente
na memória do notebook; não escrevem nem importam arquivos Python. Depois da
instalação das bibliotecas, uma única célula prepara o dataset e treina o
modelo. A última célula mostra as métricas e baixa o ZIP de resultados.

O treinamento compara os candidatos configurados, incluindo ARIMA: uma série
semanal de incidência por UF, convertida para a escala de cada município por
população. Os resultados de ARIMA aparecem junto aos demais em
`validacao_h1.json` e `validacao_h2.json`.

A preparação consulta fontes públicas geográficas, populacionais e climáticas,
portanto requer rede e pode levar minutos ou mais. O notebook refaz painel e
atributos; não reutiliza atributos multirregionais pré-calculados.

O recorte usa `ID_MN_RESI`, município de residência, com prefixo `26`
(Pernambuco), conforme a semântica dos campos do SINAN. `SG_UF_NOT` indica a UF
de notificação e não determina residência: um caso residente em Pernambuco pode
ser notificado em outra UF. A lista de municípios é extraída dos registros do
Parquet, sem consulta às APIs de localidades e malhas municipais do IBGE. Os
códigos de seis dígitos recebem o dígito verificador IBGE; códigos inválidos
geram erro explícito.

O runtime usa Python 3.12 ou 3.13 e `/content` é temporário. A validação
configurada é em 2025, com treino até 2024; 2025 não é um teste independente
posterior. Como não há coordenadas no SINAN, o notebook desativa clima e
vizinhança geográfica. Continua consultando dados oficiais de população/área do
IBGE, necessários para incidência e denominadores. O notebook remove Random
Forest e Extra Trees para reduzir o custo no Colab. Baixe o ZIP antes que o
runtime expire.

O script `montar_pacote.py` ainda existe para gerar pacotes do fluxo antigo,
mas não é necessário para executar este notebook.

### Resultados trazidos do Colab

Guarde cada `resultados_treinamento_pe.zip` em
`treinamentoDoModelo/artefatos/importacoes_colab/<id_do_treino>/`. Essa árvore é
ignorada pelo Git; não coloque modelos, logs ou ZIPs de resultados no commit.
O ZIP contém modelos e relatórios, não o dataset. Para comparar resultados,
consulte `modelos/<id_do_treino>/resumo.json`, `validacao_h1.json`,
`validacao_h2.json` e `model_card.json`.
