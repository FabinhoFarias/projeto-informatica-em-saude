Análise exata da base inteira do SINAN

O notebook principal é [sinan_dengue_colab.ipynb](../../notebooks/sinan_dengue_colab.ipynb). Ele foi reorganizado a partir da versão usada no Colab, incluindo as células adicionais de município e regiões. A versão anterior foi preservada em [referencia/sinan_dengue_colab_antes_refatoracao.ipynb](../../notebooks/referencia/sinan_dengue_colab_antes_refatoracao.ipynb).

Se o CSV já está no ambiente, mantenha **`EXECUTAR_DOWNLOAD = False`**. Ajuste `CSV_FINAL` e execute as células. A configuração do Drive permanece desativada por padrão, como no notebook recebido. Para uma nova coleta, ative `EXECUTAR_DOWNLOAD`: o download continua sempre do zero, sem cache, checagens de existência de dados ou retomada. A preparação analítica é uma etapa separada.

Com **`PREPARAR_ANALISE = True`**, o CSV completo é lido uma vez e convertido para `analise/dengue-analitico.parquet`. Essa primeira leitura é necessária e pode demorar; não exige carregar todos os registros em pandas. Os códigos permanecem como texto. Somente os marcadores técnicos configurados (`nan`, vazios etc.) tornam-se nulos na cópia analítica. O CSV original não é alterado. Erros estruturais não são ignorados e a saída Parquet só é publicada quando a conversão termina.

O Parquet mantém as colunas originais; as cinco colunas internas de localização e datas são expressões virtuais da view SQL `base`, calculadas só quando solicitadas. A preparação geográfica primeiro agrega ano/UF/município, depois normaliza os códigos distintos. Assim evita aplicar expressões de texto em todos os 32,5 milhões de registros. O resultado é uma tabela pequena `resumo_geo` em memória, contendo contagens exatas de todos os registros.

Após preparar, reexecute somente as células de consulta. Todas compartilham o objeto `analise` e sua conexão. Nenhum DataFrame com a base completa é criado e os DataFrames anteriores da sessão não são apagados. Na reabertura do notebook, as variáveis só estarão disponíveis se a sessão de execução ainda for a mesma.

Otimizações aplicadas:

- Ano, município e região usam o resumo geográfico, sem reler o CSV nem os dados completos do Parquet a cada consulta.
- Ausências globais usam as estatísticas de nulos do Parquet. Se alguma estatística faltar, somente a coluna correspondente é contada por leitura de dados.
- Séries temporais leem somente a data e, se solicitado, o município. Usam a data real, não o ano do ZIP. Datas inválidas são apresentadas separadamente. Períodos ausentes não são preenchidos automaticamente com zero.
- Correlações são exatas sobre todos os pares válidos dos indicadores selecionados. São calculadas em uma consulta nativa, sem converter milhões de linhas para pandas. Cinco campos geram dez pares distintos; 17 geram 136. Mais campos exigem mais trabalho.
- Qui-quadrado recebe apenas a pequena tabela de contingência, já agregada sobre todos os registros.
- Duplicatas exatas ficam desativadas por padrão. A comparação de todos os atributos é pesada e pode precisar de bastante disco temporário. Quando habilitada, não usa aproximação por hash e não remove registros.

As [leituras seletivas por coluna do Parquet](https://duckdb.org/docs/data/parquet) e as [estatísticas de nulos](https://duckdb.org/docs/stable/data/parquet/metadata) são recursos documentados pelo DuckDB. Um CSV não permite evitar sua primeira leitura completa. Não há garantia de duração fixa, principalmente pelo Drive. Use CPU e memória limitada na configuração; não há benefício de GPU para estas consultas.

Os resultados contam **notificações**, sem filtro de confirmação ou deduplicação. Regiões usam UF de residência; quando inválida, usam a UF do município de residência. Códigos municipais históricos de seis e sete dígitos são normalizados para seis. Localização desconhecida permanece no denominador dos percentuais regionais. Esses percentuais não são incidência populacional. Correlações e qui-quadrado não demonstram causalidade; códigos de ignorado e mudanças de formulário entre anos exigem interpretação conforme o dicionário.

Para preservar a análise em outra sessão, copie o Parquet para o Drive. Ao reabrir, monte o Drive, ajuste `PARQUET_EXISTENTE` e use **`PREPARAR_ANALISE = False`**. A abertura explícita não relê o CSV, mas recria o pequeno resumo geográfico lendo apenas as colunas correspondentes. Mantenha espaço para CSV, Parquet e temporários. A ordem do Parquet não é garantida; o CSV original continua em ordem de ano do arquivo e a série agregada é ordenada pela data.

O núcleo é [sinan_analise_completa.py](../sinan_analise_completa.py). O mesmo código é incorporado no notebook principal, na [célula única](../../notebooks/celula_analise_dengue.py) e no [notebook de análise separado](../../notebooks/analise_dengue_colab.ipynb). O [script de terminal](../analisar-sinan-dengue.py) usa esse módulo:

```sh
python3 -m pip install duckdb pandas
python3 scripts/analisar-sinan-dengue.py /caminho/dengue-completo.csv --municipio 2611606
# Abrir o Parquet preparado, explicitamente, sem reconverter
python3 scripts/analisar-sinan-dengue.py /caminho/dengue-analitico.parquet --abrir-parquet --municipio 2611606
# Operações opcionais
python3 scripts/analisar-sinan-dengue.py /caminho/dengue-analitico.parquet --abrir-parquet --correlacoes FEBRE,MIALGIA,DIABETES
python3 scripts/analisar-sinan-dengue.py /caminho/dengue-analitico.parquet --abrir-parquet --duplicatas-exatas
```

As versões de prévia por percentual continuam em `analise_dengue_percentual.ipynb` e `celula_analise_dengue_percentual.py`, para inspeções limitadas. Elas não são usadas pelo notebook principal nem fornecem resultados da base inteira quando selecionam menos de 100%.

Após alterar o módulo, regenere os notebooks e execute os testes com as dependências instaladas:

```sh
python3 scripts/gerar-notebook-sinan-colab.py
python3 scripts/gerar-notebook-eda-colab.py
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s scripts/sinan -p 'test_*.py'
```

A validação local usa dados sintéticos e compara resultados com uma referência pandas: totais, ausências por coluna, municípios, regiões, datas, associações, correlações e duplicatas. Ela não substitui uma medição no ambiente Colab com os 32,5 milhões de registros.
