Extração paralela de dengue do SINAN

Abra `scripts/extrair-sinan-dengue.py` no VS Code e clique em **Run Python File** (extensão Python instalada). Sem argumentos, baixa **2000 a 2026, inclusive, com 20 threads**, sem contar páginas antes. Também pode usar F5 e selecionar **SINAN: baixar 2000–2026 (20 threads)**, configurado em `.vscode/launch.json` (extensão Python Debugger).

No terminal, com Python 3.9+ e sem instalar bibliotecas:

```sh
python3 scripts/extrair-sinan-dengue.py
```

São até vinte requisições simultâneas, distribuídas entre os anos. Cada ano avança em sequência: páginas 0, 1, 2… com `limit=1000`, máximo documentado, até uma página vazia. Quando restam menos de vinte anos pendentes, a concorrência diminui. Um único ano usa uma requisição por vez. As respostas podem chegar fora de ordem entre anos.

Somente a thread principal grava no SQLite, usando uma transação por página para salvar registros e avançar o checkpoint juntos. No máximo vinte respostas ficam em trânsito, sem carregar o dataset inteiro na memória. Não há deduplicação por conteúdo de registro: notificações iguais podem ser legítimas. Páginas integralmente repetidas interrompem o ano para evitar repetição silenciosa.

Os resultados ficam em `data/sinan/`, independentemente da pasta de onde o script for iniciado:

- `dengue-2010.sqlite3`: registros e checkpoint persistidos a cada página.
- `dengue-2010.csv`: exportado quando o ano termina e ao encerrar normalmente, com erro ou Ctrl+C.
- `dengue-2010.manifest.json`: número de registros, próxima página e indicador `concluido`.

Cada ano tem seus próprios arquivos. Anos já concluídos são ignorados na retomada. O progresso mostra ano, página, total de registros salvos, anos concluídos e velocidade; não informa percentual sem conhecer o total.

Há até seis tentativas com espera crescente para 502 e outros erros temporários. Uma falha persistente pausa aquele ano e permite que os outros continuem. Execute o mesmo comando para retomar. Ctrl+C aguarda as requisições em andamento terminarem (timeout de 120 segundos por tentativa) antes de exportar; respostas não confirmadas serão consultadas novamente. Encerrar à força pode impedir a exportação do CSV, mas as transações confirmadas permanecem no checkpoint. Não execute dois processos sobre o mesmo destino.

O ano de **2010 está incluído na coleta padrão**, assim como todos os anos de 2000 a 2026. O teste de dimensionamento feito fora desta pasta não é considerado baixado. O script mostra os anos na fila ao iniciar. Para baixar somente 2010:

```sh
python3 scripts/extrair-sinan-dengue.py --ano 2010
```

Uma execução só considera um ano concluído se o checkpoint local correspondente estiver marcado como concluído. Um CSV isolado não contém o progresso necessário para retomar.

Outras opções:

```sh
python3 scripts/extrair-sinan-dengue.py --ano-inicial 2020 --ano-final 2026 --threads 20
python3 scripts/extrair-sinan-dengue.py --output-dir data/sinan-teste --max-pages 10
python3 scripts/extrair-sinan-dengue.py --export-only
python3 -m unittest discover -s scripts/sinan -p 'test_*.py'
```

`--max-pages` limita o total de requisições de páginas da execução, somadas entre os anos (tentativas de rede não contam). `--municipio` filtra o município notificador: use destino diferente para filtros diferentes. A antiga contagem de páginas foi removida.

O CSV inclui os 120 campos de `campos-dicionario.json`, mais todos os atributos extras retornados pela API. O PDF escreve `clinic_chik`, mas a API publica `clinc_chik`: ambos são preservados e a equivalência fica no manifesto. Campos ausentes ficam vazios; a string `nan` é preservada. Em pandas, use `dtype=str, keep_default_na=False` para preservar códigos e zeros à esquerda.

A API não documenta snapshot ou ordenação estável: mudanças na origem podem deslocar registros durante a coleta. A execução concorrente preserva as respostas recebidas, mas não garante completude histórica nem ausência de duplicatas da fonte. Anos sem registros publicados geram CSV vazio com cabeçalho. `concluido` significa que o endpoint retornou uma página vazia para aquele ano naquele momento. Para previsões no momento da notificação, campos posteriores como evolução e encerramento exigem cuidado com vazamento do alvo.

Fontes:

- [Dicionário oficial](https://s3.sa-east-1.amazonaws.com/ckan.saude.gov.br/SINAN/Dengue/dic_dados_dengue.pdf)
- [Documentação da API](https://apidadosabertos.saude.gov.br/v1/#/Agravo%20Arboviroses/get_arboviroses_dengue)
