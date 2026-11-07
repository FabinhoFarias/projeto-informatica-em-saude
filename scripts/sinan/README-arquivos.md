Pipeline de arquivos oficiais de dengue, sempre do zero

Abra `scripts/baixar-sinan-dengue-arquivos.py` e clique no ▶ do VS Code, ou use F5 e selecione **SINAN: baixar do zero e gerar CSV completo**. Requer Python 3.9+, sem bibliotecas adicionais.

```sh
python3 scripts/baixar-sinan-dengue-arquivos.py
```

Em toda execução, o script consulta o catálogo e baixa integralmente todos os arquivos CSV publicados, com quatro downloads simultâneos por padrão. Não consulta arquivos locais, metadados antigos, ETag anterior ou checkpoints para decidir se deve baixar. Não faz pedidos HEAD, Range ou requisições condicionais. Mesmo se houver ZIPs, CSVs ou arquivos `.part` na pasta, eles são sobrescritos pelos resultados desta execução. Cada tentativa após erro de rede também recomeça o download daquele arquivo do zero.

O resultado é **`data/sinan-arquivos/dengue-completo.csv`**, UTF-8, delimitado por vírgula, com um cabeçalho único. A consolidação sempre é refeita integralmente. Ela descompacta os ZIPs em fluxo, sem gravar cópias anuais intermediárias e sem manter todo o dataset na memória. Usa a união das colunas de todos os anos, normalizadas para maiúsculas. Campos que não existem em um ano ficam vazios. Preserva valores, zeros à esquerda, strings `nan`, aspas e quebras de linha dentro dos campos.

A coluna **`ANO_ARQUIVO`** identifica o ano do recurso no catálogo. Os arquivos são consolidados em ordem crescente desse ano, mantendo a ordem original dos registros dentro de cada arquivo. Isso não ordena as linhas por `DT_NOTIFIC` ou `DT_SIN_PRI`: os arquivos anuais podem incluir notificações de outro ano. Para uma série diária, escolha a data de referência e agregue/ordene por ela na preparação do modelo. Nenhuma linha é removida por deduplicação.

As únicas verificações de dados são de integridade: tamanho da resposta recebida, CRC do ZIP, cabeçalhos e quantidade de campos por registro. O script também verifica espaço em disco. Falha em algum download impede publicar um consolidado incompleto. A saída é escrita em `.csv.part` e renomeada somente ao concluir; esse temporário não serve como checkpoint e será sobrescrito na próxima execução.

Os ZIPs originais ficam em `data/sinan-arquivos/zips/`. O catálogo, manifesto de downloads e `dengue-completo.manifest.json` são relatórios da execução, não são lidos como cache. O manifesto final registra fontes, número de linhas por ano, colunas e ordenação. Arquivos que saíram do catálogo não entram na saída, mesmo que ainda estejam na pasta: somente os recursos baixados na execução atual são consolidados.

```sh
# Escolher quantidade de downloads simultâneos
python3 scripts/baixar-sinan-dengue-arquivos.py --threads 8
# Selecionar pasta de trabalho e CSV final
python3 scripts/baixar-sinan-dengue-arquivos.py --output-dir /pasta/dados --output /pasta/dengue-completo.csv
# Apenas listar os recursos publicados
python3 scripts/baixar-sinan-dengue-arquivos.py --list-only
# Opcional: também gravar cópias anuais descompactadas
python3 scripts/baixar-sinan-dengue-arquivos.py --extract-files
```

O pipeline não apaga pastas automaticamente. Você pode excluir os dados antigos antes de rodar, conforme seu fluxo. Não execute dois processos sobre o mesmo destino. A consolidação exige espaço para todo o CSV final; o volume descompactado é uma estimativa mínima, pois a união de colunas pode aumentar o tamanho. Se uma saída anterior ainda estiver presente, ela permanece ocupando espaço até a substituição ao final.

Em caso de interrupção ou falha, a próxima execução recomeça tudo do zero. Erros temporários de rede têm até seis tentativas por arquivo. A rapidez depende do volume baixado, da rede e do disco; não há estimativa fixa de duração.

```sh
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s scripts/sinan -p 'test_*.py'
```

Fonte: https://dadosabertos.saude.gov.br/dataset/arboviroses-dengue

Para executar no Google Colab, use [sinan_dengue_colab.ipynb](../../notebooks/sinan_dengue_colab.ipynb). Abra https://colab.research.google.com/ e use **Arquivo → Fazer upload de notebook**, selecione o arquivo e escolha **Ambiente de execução → Executar tudo**. O notebook inclui o pipeline completo; não é necessário clonar o repositório nem transferir os ZIPs do Mac.

O notebook usa 20 downloads simultâneos quando `EXECUTAR_DOWNLOAD = True`. Essa opção fica desativada por padrão para analisar um CSV já presente, sem baixar novamente. A análise da base inteira usa Parquet e consultas agregadas em DuckDB, conforme [README-analise.md](README-analise.md). `SALVAR_NO_DRIVE` ativa opcionalmente a montagem e a cópia de CSV, manifesto e Parquet para **Meu Drive/Denguinhos/datasets/**; `PASTA_NO_DRIVE` altera o destino.

O erro `No space left on device` se refere ao disco, não à memória RAM. O Colab também precisa de espaço para o dataset e a conta Drive precisa de quota para a cópia. Os arquivos temporários do Colab podem ser perdidos ao encerrar o ambiente. Não é necessária GPU para este pipeline. A integração segue o [guia oficial de dados do Colab](https://colab.research.google.com/notebooks/io.ipynb) e a [FAQ oficial](https://research.google.com/colaboratory/faq.html).

Para manter a versão incorporada no notebook sincronizada após editar o script, execute:

```sh
python3 scripts/gerar-notebook-sinan-colab.py
```
