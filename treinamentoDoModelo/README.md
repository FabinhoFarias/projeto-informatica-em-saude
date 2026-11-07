# Treinamento do modelo de dengue do Nordeste

Pipeline independente da aplicação web, implementado a partir do [plano do modelo regional](../docs/modelagem/modeloPreditivoDengueNordeste.md). Parte de `data/sinan/dengue-analitico.parquet`, cria o painel completo município × semana, enriquece com fontes públicas, constrói atributos e inicia o treinamento de H1/H2.

## Rodar no computador

O ambiente local deste projeto foi preparado em `treinamentoDoModelo/.venv`, com o Python 3.9.6 disponível no Mac e usado na validação. Você já pode executar:

```sh
treinamentoDoModelo/.venv/bin/python treinamentoDoModelo/executar.py
```

No VS Code, selecione esse interpretador e use Play em `executar.py`. Se o Python selecionado for incompatível ou faltar uma dependência, o script tenta iniciar automaticamente o ambiente local da pasta. Ele não instala pacotes automaticamente ao abrir.

### Nova instalação em outro ambiente

Use Python 3.10, 3.11 ou 3.12. O Python 3.15 instalado como `python3` neste computador não é adequado para todas as dependências de aprendizado de máquina. Se você já tem Python 3.11 instalado:

```sh
python3.11 -m venv treinamentoDoModelo/.venv
source treinamentoDoModelo/.venv/bin/activate
python -m pip install -r treinamentoDoModelo/requirements.txt
python treinamentoDoModelo/executar.py
```

No VS Code, selecione o interpretador `treinamentoDoModelo/.venv/bin/python`, abra `executar.py` e use **Run Python File/Play**. Sem argumentos, ele executa fontes → painel → atributos → treino. Os caminhos são resolvidos pela raiz do repositório, independentemente da pasta atual do terminal.

Ajuste primeiro [config.yaml](config.yaml). Os parâmetros principais estão no começo: entrada, saída, período, data de corte, UFs, municípios e recursos computacionais. `municipios: []` processa todos. Para um ensaio pequeno, use os códigos IBGE de Recife, Fortaleza e Salvador presentes no comentário dessa configuração.

O primeiro preparo precisa consultar as fontes externas e pode levar minutos ou mais, conforme a rede e o provedor de clima. O programa informa quantos pontos meteorológicos serão consultados e o avanço. As execuções on-line baixam as fontes novamente; não usam arquivos antigos automaticamente. Treinar depois do preparo usa os Parquets locais, sem repetir os downloads.

## Comandos por etapa

```sh
# Baixa e processa códigos, malhas, população, área e clima
python treinamentoDoModelo/executar.py fontes

# Lê poucas colunas do SINAN e agrega o painel completo
python treinamentoDoModelo/executar.py painel

# Enriquece painel, cria lags/janelas/alvos e congela municípios reservados
python treinamentoDoModelo/executar.py atributos

# As três etapas anteriores em sequência
python treinamentoDoModelo/executar.py preparar

# Compara todos os candidatos; valida exclusivamente em 2025, treinando até 2024
python treinamentoDoModelo/executar.py treinar

# Avaliar requer um ano de teste independente posterior a 2025; indisponível
# neste recorte. Consulte validacao_h1.json, validacao_h2.json e resumo.json.

# Gera previsões na última origem do painel; usa o último treino da mesma configuração
python treinamentoDoModelo/executar.py inferir
```

Para outra configuração, passe `--config caminho/config.yaml` a todos os comandos. `--modelos caminho/do/treino` permite avaliar ou inferir com um treino específico.

### Comparação de modelos em 2025

O corte do experimento atual treina e calibra até 2024, e compara em 2025, separadamente para H1 e H2. A configuração inclui CatBoost Poisson/Hurdle, logística com Poisson, EBM, XGBoost, LightGBM, Random Forest, Extra Trees, um baseline Gamma-Poisson hierárquico empírico por UF/município e um GLM binomial negativo com UF e correção municipal regularizada. Os dois últimos são aproximações interpretáveis, não modelos espaciais Bayesianos completos nem modelos mistos com likelihood integrada.

Para conter o custo no Mac, os candidatos adicionais usam até 120 mil linhas de treino por fold, amostradas por classe com pesos inversos; o CatBoost continua usando todas as linhas. A seleção favorece recall de semanas com pelo menos um caso quando a precisão na validação atinge 35%, e registra PR-AUC, F1, MAE, tempos e resultados por município/UF. `casos > 0` mede ocorrência; não é uma definição oficial de surto.

Como 2025 foi usado na seleção, ele não pode servir como teste independente do vencedor. O comando `avaliar` informa essa limitação até existir um recorte temporal posterior. Resultados antigos de 2024/2025 não devem ser tratados como novos testes cegos.

`tudo` não abre os testes finais nem publica previsões no produto. Ele cria um candidato de pesquisa com métricas e limitações. Avaliação epidemiológica e integração operacional continuam necessárias.

## Google Colab

Use o [pipeline de empacotamento e upload direto](colab/README.md) e o [notebook de treinamento](../notebooks/treinamento_dengue_colab.ipynb). Envie os arquivos pela aba Arquivos do Colab: o Parquet completo pode ser enviado inteiro ou em partes; o código e os atributos preparados vão em um ZIP separado. O notebook mostra o avanço e as métricas de cada candidato. Ao fim, baixe o ZIP dos modelos e relatórios antes que o runtime expire.

## O que é produzido

Tudo fica em `treinamentoDoModelo/artefatos`, ignorado pelo Git:

```text
bronze/       downloads e metadados com URL, data, tamanho e SHA-256
prata/        municípios, vizinhos, população, clima, calendário e quarentena
ouro/         painel.parquet, atributos.parquet, schema e municípios reservados
relatorios/   qualidade SINAN, cobertura, imputação prévia, execução e logs
modelos/      um diretório por treino, sem sobrescrever modelos anteriores
```

Cada treino gera `modelo_h1.joblib` e `modelo_h2.joblib`, configuração, ambiente, hashes, scores, relatórios de imputação e `model_card.json`. Os resultados de validação incluem UF, porte, municípios conhecidos e não vistos, contagem, incidência, intervalos e alerta experimental.

Para consultar rapidamente o resultado:

```python
import json
from pathlib import Path

base = Path('treinamentoDoModelo/artefatos/modelos')
pasta = Path(json.loads((base / 'ultimo_treino.json').read_text())['pasta'])
resumo = json.loads((pasta / 'resumo.json').read_text())
resumo
```

## Decisões implementadas

- Casos confirmados `CLASSI_FIN ∈ {10,11,12}`, residência e início dos sintomas.
- Calendário epidemiológico de domingo a sábado; primeira semana com pelo menos quatro dias do ano.
- Correspondência com códigos IBGE de seis/sete posições; código de sete dígitos precisa bater integralmente.
- Quarentena para código inválido, conflito data/semana, evento futuro ou fora da vigência.
- Sem remoção de supostos duplicados apenas por município/data/sexo. Só exclui `NDUPLIC_N=2`, com contagem auditada, quando habilitado.
- Painel de todos os municípios selecionados, inclusive cidades sem casos confirmados.
- Zeros inferidos do snapshot anual marcados; cobertura desconhecida pode permanecer nula.
- População por junção temporal para trás, com limite de idade; sem interpolação que veja censos futuros.
- Área oficial do Censo 2022; fallback geométrico explicitamente marcado.
- Clima NASA POWER ou INMET, com cobertura, proveniência, defasagem e preenchimento limitado.
- Lags, janelas, incidência, calendário, anomalias climáticas e vizinhos defasados.
- Imputação ajustada só no treino de cada fold, com flags e descarte de colunas totalmente vazias.
- Baselines zero/recente/média móvel/sazonal, CatBoost Poisson e arquitetura em duas etapas.
- SMOTENC de baixa intensidade somente no classificador Hurdle e dentro do treino de cada fold; a regressão de casos usa apenas positivos observados.
- Dois modelos diretos, um por horizonte; sem recursão de previsões.
- Calibração residual em bloco temporal separado, intervalos e probabilidade experimental de alerta.
- Municípios reservados por UF/porte antes da primeira validação; séries desses municípios também são retiradas da soma de vizinhos usada no treino.
- Validação única em 2025, após treino até 2024; teste independente ainda indisponível.

## Disponibilidade e limites do experimento

O arquivo atual contém dados consolidados, sem os snapshots de cada semana passada. Por isso o resultado é um benchmark retrospectivo com base revisada. O atraso conservador padrão de oito semanas para casos reduz a diferença de disponibilidade, mas não reconstrói as versões antigas nem implementa nowcasting. As populações e reanálises também são as versões atualmente publicadas.

A malha fixa de 2022 define o território de referência; não se afirma que todas as fronteiras de 2015 eram idênticas. Vínculos históricos aprovados podem ser fornecidos em `mapa_municipios_csv`. Os arquivos de cobertura municipal podem substituir a suposição de snapshot anual completo.

CNES, LIRAa, zika, chikungunya, ACE e APS têm um conector temporal comum para tabelas agregadas. Eles não são fabricados quando ausentes. O enriquecimento padrão necessário para iniciar o treino — população, área, localização, vizinhança e clima — é obtido automaticamente. Os contratos e as regras de imputação estão em [ENRIQUECIMENTO.md](ENRIQUECIMENTO.md).

`inferir` prevê a partir da última semana que existe no painel, não da semana atual do computador. Com o recorte até 2025, a saída continua sendo retrospectiva. Para operação corrente será preciso atualizar a entrada, ampliar o período e validar o atraso real.

## Testes

```sh
python -m unittest discover -s treinamentoDoModelo/tests -v
```

A suíte cobre calendário, reconciliação, códigos inválidos, zeros, cobertura, chuva incompleta, junção temporal, imputação sem aprender com teste, mudança do futuro sem alterar atributos passados e fluxo completo de preparo/treino/teste/inferência com dados sintéticos. A validação em dados reais e as limitações medidas são registradas em `VALIDACAO.md`.

## Treino rápido, balanceamento e candidatos

`treinamento_rapido: true` diminui árvores, profundidade e ajustes auxiliares. O bloco `treino.smote` limita a classe positiva a 20 para cada 100 semanas sem surto, usa dois vizinhos e separa as UFs; ele nunca acessa calibração, validação, teste ou municípios reservados. Para reequilibrar mais ou menos, altere somente `razao_pos_neg_max` — não use SMOTE para a regressão de contagem.

Após uma avaliação temporal, preserve os modelos que venceram todos os baselines de desenvolvimento:

```sh
python treinamentoDoModelo/executar.py arquivar
```

Eles ficam em `treinamentoDoModelo/modelosCandidatos/`, separados dos artefatos operacionais. A aprovação final exige novos dados posteriores a 2025.

### Busca temporal de hiperparâmetros

No Mac, execute uma grade curta que privilegia a classe rara (`casos > 0`) sem embaralhar semanas:

```sh
python treinamentoDoModelo/executar.py buscar
```

A busca opcional está desativada na configuração atual. Se habilitada, a triagem e a confirmação usam 2025/h1–h2 e o ranking prioriza recall de ocorrência; PR-AUC, MAE macro municipal e duração servem como desempate. Ela reutiliza 2025 para ajuste de hiperparâmetros, portanto os resultados de 2025 ficam ainda mais sujeitos a otimismo.

Para operação de alta sensibilidade, `treino.ocorrencia.precisao_minima` calibra, exclusivamente no bloco de calibração, o menor corte de probabilidade que mantém essa precisão. A busca então prioriza recall de `casos > 0`; precisão, PR-AUC e MAE permanecem registrados para tornar o custo de falsos alertas explícito.

O resultado gera `artefatos/relatorios/busca_hiperparametros/.../melhor_config_busca.json`. Treine o vencedor sem refazer fontes ou atributos:

```sh
python treinamentoDoModelo/executar.py treinar --config CAMINHO/para/melhor_config_busca.json
```
