# Construção do modelo preditivo de dengue para o Nordeste

**Projeto:** Plataforma Denguinhos<br>
**Fonte epidemiológica inicial:** `data/sinan/dengue-analitico.parquet`<br>
**Unidade analítica:** município de residência × semana epidemiológica<br>
**Horizonte principal:** 1, 2, 3 e 4 semanas à frente<br>
**Abrangência:** Maranhão, Piauí, Ceará, Rio Grande do Norte, Paraíba, Pernambuco, Alagoas, Sergipe e Bahia<br>
**Situação do documento:** especificação técnica para implementação e experimentação<br>
**Data da especificação:** 6 de novembro de 2026

**Implementação:** [treinamentoDoModelo](../../treinamentoDoModelo/README.md). O pipeline implementa preparação, enriquecimento público, atributos, imputação por fold e treinamento dos quatro horizontes. A [estratégia de enriquecimento e imputação](../../treinamentoDoModelo/ENRIQUECIMENTO.md) documenta também as adaptações do benchmark: NASA POWER como clima padrão com alternativa INMET, território fixo de referência, zeros inferidos identificados e ausência de vintages históricos. Os resultados de execução e os limites do teste estão em [VALIDACAO.md](../../treinamentoDoModelo/VALIDACAO.md).

## 1. Resposta direta

O primeiro modelo do Denguinhos para o Nordeste deve ser um **modelo global regional**. Ele será treinado com todos os municípios nordestinos em uma tabela muito menor que a base individual do SINAN: uma linha para cada município e semana epidemiológica.

O modelo não deve receber diretamente os 32,5 milhões de registros individuais. O arquivo completo deve alimentar um pipeline que:

1. seleciona registros de residentes no Nordeste;
2. valida município, data, semana e classificação;
3. agrega os casos por município e semana epidemiológica;
4. inclui explicitamente semanas com zero casos;
5. adiciona população, clima e atributos territoriais;
6. cria somente atributos que estariam disponíveis na data da previsão;
7. treina e avalia modelos por cortes temporais e espaciais;
8. publica previsões de 1 a 4 semanas com incerteza e indicadores de qualidade.

Esse modelo regional será o ponto de partida comercial para uma prefeitura. Quando o município contratar o produto e fornecer dados por bairro, distrito, LIRAa, visitas dos ACE ou APS, o Denguinhos deverá comparar o modelo regional com versões calibrada, híbrida e local. O melhor candidato na validação prospectiva da cidade será publicado.

## 2. Decisões da primeira versão

| Decisão | Escolha inicial | Justificativa |
|---|---|---|
| Abrangência | Nove estados do Nordeste | Compartilha características regionais sem misturar imediatamente todo o Brasil. |
| Granularidade | Município × semana epidemiológica | É compatível com a menor desagregação regular dos dados abertos e com alertas de 1 a 4 semanas. |
| Território do caso | Município de residência | É a referência recomendada pelo Ministério da Saúde para incidência. |
| Data epidemiológica | Início dos sintomas | Representa melhor a ocorrência; notificação/digitação serão preservadas para medir atraso. |
| Alvo do benchmark | Casos confirmados | Regra inicial mais restrita e auditável para comparar modelos. |
| Período inicial | 2015–2025 | Evita misturar imediatamente os esquemas mais antigos; 2026 permanece fora por estar incompleto. |
| Horizonte | 1, 2, 3 e 4 semanas | Alinha o experimento ao RF-005 do produto. |
| Arquitetura | Modelo global regional | Compartilha aprendizado entre municípios e atende locais com séries esparsas. |
| Validação | *Walk-forward* temporal + municípios não vistos | Mede futuro real e capacidade de atender uma nova prefeitura. |
| Primeiro candidato | CatBoost/árvores de contagem e modelo em duas etapas | Aceita relações não lineares, categorias e excesso de zeros. |
| Referências mínimas | Ingênuo recente, média móvel e sazonal anual | Um modelo complexo só é aprovado se superar referências simples. |

Essas decisões são hipóteses versionadas, não verdades permanentes. O relatório de experimentos deverá registrar quando uma regra for alterada e impedir a comparação silenciosa entre alvos diferentes.

## 3. O que existe no Parquet atual

O diagnóstico realizado diretamente em `data/sinan/dengue-analitico.parquet` encontrou:

| Propriedade | Resultado observado |
|---|---:|
| Registros nacionais | 32.512.002 |
| Colunas | 197 |
| Tipos físicos | Todas as colunas estão como texto (`VARCHAR`) |
| Notificações com prefixo de residência do Nordeste | 5.598.577 |
| Datas válidas entre 2000 e 2026 no recorte regional | 5.591.797 |
| Datas nulas ou inválidas | 19 |
| Datas não nulas fora de 2000–2026 | 6.761 |
| Registros com `CLASSI_FIN` preenchido | 4.463.437 |
| Registros com `CLASSI_FIN` ausente | 1.135.140 |

O arquivo reúne vários esquemas históricos. Por isso existem 197 colunas, embora o dicionário atual tenha menos campos, e alguns atributos antigos aparentem ter conteúdo deslocado. Não é seguro juntar automaticamente uma coluna antiga e uma atual apenas porque seus nomes parecem equivalentes.

### 3.1 Volume regional bruto por UF

Os números abaixo representam notificações brutas no recorte por prefixo de município de residência, não casos confirmados:

| Código | UF | Notificações brutas |
|---:|---|---:|
| 21 | Maranhão | 223.896 |
| 22 | Piauí | 263.363 |
| 23 | Ceará | 1.166.406 |
| 24 | Rio Grande do Norte | 567.026 |
| 25 | Paraíba | 356.373 |
| 26 | Pernambuco | 1.022.630 |
| 27 | Alagoas | 377.395 |
| 28 | Sergipe | 148.916 |
| 29 | Bahia | 1.472.572 |
|  | **Total** | **5.598.577** |

Esses totais servem para controle de ingestão. Eles não devem ser apresentados como incidência ou carga confirmada de dengue.

### 3.2 Diagnóstico do primeiro alvo

No recorte preliminar de 2015 a 2025, considerando `CLASSI_FIN` igual a `10`, `11` ou `12`, foram encontrados aproximadamente:

- 1.349.832 casos confirmados;
- 1.793 códigos municipais com pelo menos um caso confirmado;
- 140.980 combinações município-semana com pelo menos um caso;
- 1.030.975 linhas em um painel preliminar completo de municípios × semanas;
- 889.995 linhas zeradas, aproximadamente 86,3% do painel.

Esses números são diagnóstico, não resultado final. A geração oficial do painel precisa primeiro validar os códigos municipais contra uma dimensão territorial histórica e construir o calendário epidemiológico correto. O excesso de zeros é suficiente, porém, para justificar modelos de contagem e a avaliação de uma arquitetura em duas etapas.

## 4. Objetivo preditivo

Para cada município `m`, semana epidemiológica de referência `t` e horizonte `h`, o sistema estimará:

```text
y(m, t + h) = quantidade de casos elegíveis de dengue
```

com `h ∈ {1, 2, 3, 4}`.

O produto deve entregar também:

- incidência prevista por 100 mil habitantes;
- intervalo de previsão ou quantis de incerteza;
- probabilidade de ultrapassar um limiar epidemiológico;
- qualidade e cobertura dos dados usados;
- fatores que mais contribuíram para a estimativa;
- versão do dataset, do modelo e data de corte.

### 4.1 Quatro perguntas diferentes

O projeto não deve misturar as perguntas abaixo em um único número:

| Pergunta | Produto estatístico |
|---|---|
| Quantos casos realmente começaram naquela semana? | *Nowcasting* da semana recente, corrigindo atraso. |
| Quantos casos começarão nas próximas semanas? | *Forecasting* de 1 a 4 semanas. |
| O município entrará em situação de alerta? | Classificação de risco/ultrapassagem de limiar. |
| Onde agir dentro da cidade? | Modelo territorial local, dependente de dados intramunicipais. |

O primeiro experimento deste documento trata principalmente do *forecasting* municipal. O *nowcasting* será um componente separado colocado antes do modelo preditivo em produção.

## 5. Definição e versionamento do alvo

### 5.1 Alvo A — casos confirmados, benchmark inicial

Regra proposta para o primeiro benchmark:

```text
período epidemiológico: 2015–2025
território: município de residência validado no Nordeste
data: semana epidemiológica do início dos sintomas
classificação final: CLASSI_FIN em {10, 11, 12}
```

No dicionário atual, esses códigos correspondem a dengue, dengue com sinais de alarme e dengue grave. A regra precisa ser verificada por período antes de ampliar o histórico, pois os códigos e campos do SINAN mudaram ao longo do tempo.

### 5.2 Alvo B — casos prováveis, experimento operacional

O Portal de Dados Abertos do SUS define casos prováveis como os casos suspeitos notificados, exceto os descartados. Essa série tende a estar disponível antes do encerramento completo da investigação e pode ser mais útil para operação semanal.

Ela deve ser construída como um alvo separado, com:

- mapa de códigos por vigência do esquema;
- regra explícita para branco, ignorado e inconclusivo;
- data de corte do lote;
- indicador de semanas ainda sujeitas a revisão;
- comparação do atraso e estabilidade contra o alvo confirmado.

### 5.3 O que não deve acontecer

- usar todas as notificações e chamá-las de casos confirmados;
- transformar valor ausente em “não” ou “descartado”;
- usar `ANO_ARQUIVO` como ano do evento;
- misturar casos por notificação com casos por início de sintomas;
- modificar retroativamente a regra do alvo sem mudar sua versão;
- usar classificação final ou encerramento como atributo de uma previsão feita antes do encerramento;
- selecionar o alvo que produz a melhor métrica depois de olhar o teste.

### 5.4 Identificador da regra

Cada linha da camada ouro deve carregar algo como:

```text
target_definition_id = confirmados_classi_fin_10_11_12_inicio_sintomas_v1
```

O identificador deve aparecer também nos metadados do modelo e nas previsões publicadas.

## 6. Recorte geográfico e códigos municipais

O filtro inicial do Nordeste usa os prefixos de UF `21` a `29` em `ID_MN_RESI`. Esse filtro não valida o município.

Foram observados códigos com seis e sete caracteres. A camada prata deve possuir uma dimensão territorial com, no mínimo:

| Campo | Finalidade |
|---|---|
| `codigo_sinan_6` | Código usado nos registros históricos do SINAN. |
| `codigo_ibge_7` | Código municipal oficial usado nas integrações atuais. |
| `municipio_nome` | Nome canônico. |
| `uf_codigo` e `uf_sigla` | Estado. |
| `inicio_vigencia` e `fim_vigencia` | Validade histórica do vínculo. |
| `situacao` | Ativo, extinto, desmembrado, agregado ou inválido. |
| `fonte_dimensao` | Origem e versão da tabela. |

Não se deve apenas acrescentar um dígito ao código de seis posições. O vínculo precisa ser feito com tabela oficial, incluindo alterações territoriais ao longo do tempo.

Registros sem correspondência não serão descartados silenciosamente. Eles irão para uma tabela de quarentena com motivo, quantidade e amostra para investigação.

## 7. Tempo epidemiológico

### 7.1 Campo preferencial

`SEM_PRI` representa a semana epidemiológica de início dos sintomas e é o campo preferencial quando válido. `DT_SIN_PRI` será usado para conferir a consistência e recuperar casos quando a regra aprovada permitir.

### 7.2 Validações mínimas

- formato esperado da semana epidemiológica;
- ano dentro do período selecionado;
- semana entre 1 e 52 ou 53 conforme calendário epidemiológico;
- consistência entre `SEM_PRI` e `DT_SIN_PRI`;
- datas impossíveis ou fora do intervalo em quarentena;
- nenhuma conversão silenciosa de semana epidemiológica para semana ISO.

O diagnóstico preliminar encontrou datas com anos impossíveis e posteriores ao recorte. A conversão deve usar modo seguro, produzir nulo em caso inválido e registrar a causa.

### 7.3 Data de corte e maturação

Toda execução deve registrar `data_corte`. Sem ela, não é possível reproduzir o que o sistema conhecia em uma semana passada.

As semanas recentes são incompletas devido ao tempo entre sintomas, procura por atendimento, notificação, digitação e encerramento. O pipeline deve calcular distribuições de atraso usando, quando disponíveis:

- `DT_SIN_PRI`;
- `DT_NOTIFIC`;
- `DT_DIGITA`;
- `DT_ENCERRA`.

Treinar com totais finais e inferir com semanas ainda incompletas cria uma diferença de regime. Há duas soluções válidas:

1. retirar do treino/inferência semanas sem maturação suficiente; ou
2. gerar um *nowcast* do total final antes de construir as defasagens do *forecast*.

## 8. Arquitetura de dados

```text
SINAN individual + IBGE + clima + geografia + CNES
                         ↓
Bronze: arquivos imutáveis, checksum, data de coleta e proveniência
                         ↓
Prata: tipos corrigidos, códigos validados, regras históricas e quarentena
                         ↓
Ouro epidemiológica: município × semana, casos e indicadores de qualidade
                         ↓
Ouro de atributos: lags, médias móveis, clima e contexto territorial
                         ↓
Treino/validação → registro de modelo → previsão semanal → monitoramento
```

### 8.1 Bronze

Preserva exatamente os recursos obtidos, sem alteração destrutiva:

- arquivo e URL de origem;
- data/hora de coleta;
- tamanho e checksum;
- ano/recurso declarado;
- versão do pipeline;
- status da ingestão.

### 8.2 Prata

Normaliza sem ainda criar atributos de modelo:

- tipos de datas e categorias;
- município de residência;
- calendário epidemiológico;
- classificação por vigência;
- duplicidade quando o campo for confiável;
- identificador técnico do registro;
- data de corte e atraso;
- flags de validade e quarentena.

`NDUPLIC_N` está preenchido em uma fração muito pequena do recorte regional e campos antigos aparentam ter conteúdos incompatíveis. Portanto, a deduplicação inicial não deve depender exclusivamente dele. A versão inicial deve medir duplicidade exata/quase exata de chaves estáveis, publicar a taxa encontrada e manter o dado original rastreável.

### 8.3 Ouro epidemiológica

Uma linha por município e semana, com o seguinte contrato mínimo:

| Grupo | Campos essenciais |
|---|---|
| Chave | `codigo_ibge_7`, `ano_epidemiologico`, `semana_epidemiologica` |
| Tempo | `data_inicio_semana`, `data_fim_semana`, `data_corte` |
| Alvo | `casos_confirmados`, `casos_provaveis`, `target_definition_id` |
| Denominador | `populacao`, `ano_populacao`, `incidencia_100k` |
| Cobertura | `fonte_recebida`, `semana_madura`, `dias_desde_fim_semana` |
| Qualidade | inválidos, sem município, atrasados, descartados, quarentena |
| Proveniência | versão do dataset, pipeline e fontes |

### 8.4 Ouro de atributos

Será derivada da tabela epidemiológica e das fontes externas. Ela nunca altera o alvo consolidado e pode ser regenerada para cada data de corte.

## 9. Construção do painel completo

O painel não pode conter apenas semanas com casos. Para cada município válido e cada semana do período:

1. gerar a grade município × semana;
2. agregar os casos elegíveis;
3. fazer junção da agregação com a grade;
4. preencher `casos = 0` somente quando a fonte daquela semana foi recebida e considerada madura;
5. manter nulo quando não for possível distinguir ausência de casos de ausência de dados;
6. adicionar indicadores de cobertura e maturação.

Essa distinção é crítica:

```text
0    = fonte disponível e nenhum caso elegível
NULL = quantidade desconhecida ou lote/cobertura insuficiente
```

Transformar todo nulo em zero ensina ao modelo que falhas de transmissão são ausência de dengue.

## 10. Fontes complementares

### 10.1 População e área

Usar estimativas municipais e censos do IBGE com ano de referência. Para cada semana, vincular o denominador vigente ou aplicar interpolação documentada.

Derivar:

- incidência por 100 mil habitantes;
- densidade demográfica;
- faixa populacional;
- crescimento ou mudança de denominador;
- área territorial.

O modelo de contagem pode usar população como exposição; modelos de árvore devem receber população e incidência histórica. Métricas devem ser calculadas tanto em contagem quanto em incidência.

### 10.2 Clima

Fonte inicial: séries históricas do INMET. Uma estação não representa automaticamente todo o município. A integração deve registrar:

- estação utilizada e coordenadas;
- distância entre estação e centroide/território;
- período de funcionamento;
- percentual de dados ausentes;
- regra de agregação diária para semanal;
- método de preenchimento;
- versão e data de coleta.

Atributos iniciais:

- precipitação acumulada;
- temperatura média, mínima e máxima;
- umidade média;
- anomalias em relação à climatologia;
- acumulados/médias das últimas 2, 4, 8 e 12 semanas.

Para prever `t+h`, não é permitido usar clima observado depois da data de emissão. As alternativas são:

- clima observado apenas até `t`;
- previsão meteorológica disponível na data de corte;
- climatologia histórica para semanas futuras.

Cada alternativa deve ser avaliada como experimento diferente.

### 10.3 Território e vizinhança

Usar malhas municipais oficiais para criar:

- latitude/longitude do centroide;
- área e densidade;
- municípios limítrofes;
- região intermediária/imediata ou região de saúde, quando apropriado;
- distância entre centroides;
- zona climática ou bioma, se validado.

Casos dos vizinhos devem ser defasados. A soma contemporânea da semana alvo é vazamento.

### 10.4 CNES e outras arboviroses

CNES, zika e chikungunya entram somente após o núcleo mínimo funcionar. O CNES deve respeitar competência histórica, e não o estoque atual replicado para todo o passado.

Essas fontes participam de estudo de ablação para demonstrar ganho real fora da amostra.

## 11. Atributos do modelo

### 11.1 Núcleo epidemiológico mínimo

| Grupo | Atributos sugeridos |
|---|---|
| Histórico recente | casos/incidência em `t-1`, `t-2`, `t-3`, `t-4` |
| Memória intermediária | `t-8`, `t-13`, `t-26` |
| Sazonalidade anual | `t-52` e, quando necessário, vizinhança de `t-52` |
| Tendência | diferenças e razões entre janelas recentes |
| Suavização | médias, somas, máximo, desvio e inclinação em 2, 4, 8, 13 e 26 semanas |
| Calendário | semana epidemiológica, ano, seno/cosseno da semana |
| Território | município, UF, população, densidade, área e coordenadas |
| Qualidade | atraso, maturação, completude e cobertura da fonte |

Todos os cálculos móveis devem aplicar `shift(1)` ou equivalente antes da janela. Caso contrário, o alvo da própria semana entra no atributo.

### 11.2 Atributos espaciais

- soma e média de casos nos municípios vizinhos em `t-1`, `t-2` e `t-4`;
- incidência máxima entre vizinhos;
- quantidade de vizinhos em situação epidêmica;
- distância ao município com maior crescimento recente;
- médias espaciais ponderadas por fronteira ou distância.

O grafo de vizinhança deve possuir versão e vigência. Municípios insulares ou sem vizinhos válidos precisam de uma categoria explícita.

### 11.3 Atributos climáticos

- valores defasados em 1 a 12 semanas;
- acumulados/médias móveis;
- anomalias contra a normal do próprio município/estação;
- interações entre chuva, temperatura e umidade;
- indicadores de cobertura e imputação.

O atraso biologicamente plausível deve ser explorado, mas a janela vencedora será escolhida apenas nos folds de desenvolvimento.

### 11.4 Atributos que não entram no *forecast* municipal

Campos clínicos e administrativos do próprio caso futuro são consequências da ocorrência e não preditores disponíveis antes dela. Não usar como entrada do *forecast*:

- classificação final da semana alvo;
- critério de confirmação;
- evolução, óbito e hospitalização futuros;
- exames, sorotipo ou sintomas do caso futuro;
- data de encerramento futura;
- total revisado publicado depois da data de corte;
- qualquer estatística calculada com o período de teste completo.

Esses campos continuam úteis para definir alvos, descrever gravidade e construir modelos clínicos separados.

## 12. Conjuntos de treino, validação e teste

Divisão aleatória de linhas é proibida. Linhas do mesmo município e semanas vizinhas são altamente dependentes.

### 12.1 Desenvolvimento temporal

Proposta inicial de *walk-forward*:

| Fold | Treino | Validação |
|---|---|---|
| 1 | 2015–2019 | 2020 |
| 2 | 2015–2020 | 2021 |
| 3 | 2015–2021 | 2022 |
| 4 | 2015–2022 | 2023 |

O treinamento cresce a cada fold, simulando o que estaria disponível na época. Hiperparâmetros, atributos e limiares são escolhidos apenas nesses folds.

### 12.2 Testes bloqueados

- **Teste temporal principal:** 2024, ano de forte pressão epidêmica e importante teste de extrapolação;
- **Teste temporal secundário:** 2025;
- **2026:** fora do teste final enquanto o ano/lote estiver incompleto.

2024 e 2025 não podem orientar seleção de atributo ou hiperparâmetro depois de abertos como teste. Se isso já ocorrer, a avaliação deixa de ser teste final e deve ser registrada como desenvolvimento.

### 12.3 Generalização para prefeitura nova

Reservar municípios inteiros que nunca aparecem no treino. A amostra espacial deve ser estratificada por:

- UF;
- porte populacional;
- intensidade histórica;
- cobertura de dados;
- condição litorânea/interior ou contexto territorial disponível.

Duas perguntas serão respondidas separadamente:

1. o modelo prevê o futuro de municípios conhecidos?
2. o modelo prevê uma prefeitura nunca vista?

Para municípios não vistos, o teste deve também impedir que estatísticas históricas globais do próprio município sejam calculadas usando o período reservado.

### 12.4 Lacuna entre treino e validação

Como atributos incluem janelas temporais, pode ser necessária uma margem (*gap*) entre treino e validação para impedir sobreposição indireta. A largura deve ser pelo menos compatível com o maior horizonte e será registrada na configuração do experimento.

## 13. Baselines obrigatórios

Nenhum modelo avançado será aprovado sem superar referências simples:

| Baseline | Previsão |
|---|---|
| Zero | Sempre zero; mede o efeito da esparsidade. |
| Última semana | `ŷ(t+h) = y(t)` |
| Média móvel | Média das últimas 4 ou 8 semanas. |
| Sazonal ingênuo | Valor da mesma semana do ano anterior. |
| Média sazonal histórica | Média da mesma semana em anos anteriores, calculada só no treino. |
| Regressão de contagem | Poisson e/ou binomial negativa com exposição populacional. |

O baseline zero pode ter erro médio aparentemente bom em municípios pequenos, mas utilidade epidemiológica ruim. Por isso, as métricas de magnitude devem ser acompanhadas de detecção de períodos críticos.

## 14. Modelos candidatos

### 14.1 Candidato A — modelo único de contagem

Treinar CatBoost, LightGBM ou XGBoost com objetivo Poisson/Tweedie, ou regressão binomial negativa quando aplicável. Entradas incluem município/UF, população, histórico, calendário, clima e vizinhos.

Vantagens:

- implementação mais simples;
- previsão direta de contagem não negativa;
- aprende relações não lineares e interações.

Riscos:

- excesso de zeros;
- dispersão maior que a esperada pelo Poisson;
- municípios grandes dominarem a perda;
- identificador municipal virar mecanismo de memorização.

### 14.2 Candidato B — arquitetura em duas etapas (*hurdle*)

Devido ao painel preliminar ter cerca de 86% de zeros:

1. classificador estima `P(casos > 0)` ou `P(alerta)`;
2. regressor estima a quantidade condicionada a casos positivos;
3. a saída combina probabilidade e magnitude.

Essa arquitetura deve ser comparada ao modelo único, não presumida superior.

### 14.3 Candidato C — modelo por UF

Treinar um modelo para cada estado, mantendo o mesmo pipeline. Ele pode capturar diferenças de cobertura e clima, mas reduz o compartilhamento de aprendizado.

### 14.4 Candidato D — global com calibração local

Treinar o modelo regional e ajustar uma calibração por município ou UF usando apenas histórico anterior à previsão. É a principal ponte para implantação em uma prefeitura.

### 14.5 Modelos que ficam para uma etapa posterior

- redes recorrentes, Transformers temporais e redes neurais em grafo;
- modelos bayesianos espaço-temporais de grande escala;
- ensembles complexos.

Eles só entram após o painel, baselines, avaliação e monitoramento estarem corretos. Maior complexidade não compensa vazamento ou alvo mal definido.

## 15. Estratégia de treinamento

### 15.1 Um modelo por horizonte

Preferência inicial: treinar um modelo direto para cada horizonte (`h=1`, `h=2`, `h=3`, `h=4`). Isso evita acumular erros de previsão recursiva e permite escolher atributos diferentes por horizonte.

Uma versão multi-horizonte pode ser comparada depois, desde que use exatamente os mesmos cortes.

### 15.2 Balanceamento territorial

Sem ajuste, Bahia, Ceará e Pernambuco e municípios populosos podem dominar a função objetivo. Comparar:

- peso uniforme por linha;
- peso inverso ao número de linhas/volume do município;
- peso por faixa populacional;
- amostragem estratificada;
- perdas sobre incidência e contagem.

A seleção deverá considerar desempenho macro por município, não apenas erro total regional.

### 15.3 Busca de hiperparâmetros

A busca ocorre somente nos folds 2015–2023. Faixas iniciais para árvores:

| Hiperparâmetro | Faixa inicial |
|---|---|
| profundidade | 4–10 |
| taxa de aprendizagem | 0,01–0,15 |
| número máximo de árvores | 300–3.000 com *early stopping* |
| regularização L2 | escala logarítmica de baixa a alta |
| subamostragem | 0,6–1,0 quando suportada |
| aleatoriedade | sementes fixadas e repetidas |

O objetivo da busca deve combinar métrica global e macro municipal. Não otimizar MAPE, pois zeros e valores pequenos a tornam instável.

### 15.4 Reprodutibilidade

Cada execução registra:

- commit do código;
- versões das dependências;
- configuração completa;
- sementes;
- lista de atributos;
- consultas e versões das fontes;
- período e data de corte;
- municípios de cada partição;
- métricas e artefatos;
- duração e recursos computacionais.

## 16. Métricas

### 16.1 Magnitude

- MAE;
- RMSE, com cautela à influência de picos;
- WAPE;
- RMSLE, quando a transformação for compatível;
- desvio de Poisson/Tweedie para modelos de contagem;
- erro da incidência por 100 mil habitantes.

MAPE não será métrica principal porque o painel contém muitos zeros e números pequenos.

### 16.2 Alerta epidemiológico

- precisão, revocação e F1;
- PR-AUC, preferível quando o evento é raro;
- sensibilidade de surtos;
- taxa de falsos alarmes;
- antecedência média do alerta;
- precisão entre os `k` municípios priorizados, se houver capacidade operacional limitada.

### 16.3 Calibração e incerteza

- cobertura dos intervalos de 50%, 80%, 90% ou 95%;
- largura média do intervalo;
- curva de calibração da probabilidade de alerta;
- Brier score para eventos binários;
- erro condicionado ao nível de cobertura dos dados.

### 16.4 Recortes obrigatórios

Toda métrica será apresentada:

- regional, microagregada;
- média por município, macroagregada;
- por UF;
- por porte populacional;
- por nível histórico de dengue;
- por horizonte;
- em semanas zeradas, endêmicas e epidêmicas;
- em municípios conhecidos e nunca vistos;
- em semanas com boa e baixa cobertura.

Uma boa média regional não aprova o modelo se ele falha sistematicamente em municípios pequenos ou em um estado.

## 17. Definição de alerta

Contagem prevista e alerta são saídas relacionadas, mas diferentes. O limiar não deve ser um único número para todo o Nordeste.

Alternativas que precisam ser comparadas e validadas com epidemiologistas:

- incidência acima de limite municipal/por porte;
- canal endêmico ou diagrama de controle;
- percentil histórico calculado somente no treino;
- crescimento sustentado por várias semanas;
- probabilidade de ultrapassar limite operacional;
- combinação de magnitude, crescimento e incerteza.

Os percentis 95 e 99 usados no artigo da USP são referência experimental, não regra universal. Limiares devem ser calculados apenas com o passado e versionados por município ou grupo comparável.

## 18. Incerteza

Uma previsão pontual não é suficiente para decisão pública. Comparar:

- regressão quantílica;
- *bootstrap* temporal/ensemble de sementes;
- intervalos conformais calibrados em períodos anteriores;
- distribuição preditiva de modelos de contagem.

A calibração precisa respeitar tempo e município. Resíduos do teste final não podem ser usados para estreitar os próprios intervalos avaliados.

Quando cobertura ou atraso estiverem fora do regime de treino, o sistema deve ampliar a incerteza ou suspender a publicação, em vez de retornar um número excessivamente confiante.

## 19. Explicabilidade

Para modelos de árvore, usar SHAP ou método equivalente em dois níveis:

- **global:** quais grupos de atributos explicam o desempenho regional e por UF;
- **local:** por que um município recebeu determinada previsão naquela semana.

Regras de apresentação:

- explicar associação, não causalidade;
- agrupar atributos correlacionados, como várias defasagens;
- mostrar valor atual, histórico e cobertura;
- evitar exibir identificador municipal como “causa” operacional;
- acompanhar a explicação por intervalo e versão do modelo.

Explicabilidade não corrige vazamento. Um atributo futuro pode ter SHAP alto e continuar inválido.

## 20. Estudos de ablação

Os conjuntos serão adicionados progressivamente usando os mesmos folds:

| Experimento | Atributos |
|---|---|
| E0 | Baselines simples |
| E1 | Histórico de dengue + calendário |
| E2 | E1 + população, incidência e território |
| E3 | E2 + clima observado disponível |
| E4 | E3 + vizinhança municipal defasada |
| E5 | E4 + CNES histórico |
| E6 | E5 + zika e chikungunya |
| E7 | E6 + indicadores de atraso/*nowcast* |

Uma fonte permanece no produto somente se melhorar desempenho, calibração, robustez ou utilidade operacional em magnitude suficiente para justificar seu custo e sua cobertura.

## 21. Critérios de aprovação

Antes do início dos experimentos, registrar limites mensuráveis. Como regra de processo, um candidato só pode ser promovido se:

1. superar o baseline sazonal no conjunto de desenvolvimento e nos testes bloqueados;
2. não depender de informação posterior à data de emissão;
3. manter resultado aceitável em todos os estados e portes priorizados;
4. apresentar sensibilidade de períodos críticos sem taxa impraticável de falsos alertas;
5. possuir intervalos razoavelmente calibrados;
6. funcionar para municípios nunca vistos ou declarar explicitamente que precisa de calibração;
7. passar pelos portões de qualidade de dados;
8. ter artefato, configuração, dataset e métricas reproduzíveis;
9. ser aprovado tecnicamente pelo responsável epidemiológico antes de uso decisório.

Não existe aprovação baseada somente em R² ou em uma métrica agregada.

## 22. Portões de qualidade

O job semanal deve validar, antes de inferir:

- arquivo recebido e checksum coerente;
- esquema esperado;
- período e data de corte;
- percentual de municípios reconhecidos;
- datas e semanas válidas;
- duplicidade;
- alteração abrupta do volume;
- atraso de notificação;
- cobertura de população e clima;
- presença dos atributos obrigatórios;
- faixa e distribuição dos atributos contra o treino.

Saídas possíveis:

| Estado | Comportamento |
|---|---|
| Aprovado | Publica normalmente. |
| Aprovado com ressalva | Publica com aviso e incerteza ampliada. |
| Reprovado | Não substitui a última previsão válida; abre incidente. |

## 23. Saída do modelo

Contrato mínimo da previsão:

| Campo | Descrição |
|---|---|
| `prediction_id` | Identificador único e idempotente. |
| `codigo_ibge_7` | Município previsto. |
| `data_emissao` | Momento em que a previsão foi produzida. |
| `semana_alvo` | Semana epidemiológica futura. |
| `horizonte_semanas` | 1 a 4. |
| `casos_previstos` | Estimativa pontual não negativa. |
| `incidencia_prevista_100k` | Estimativa ajustada à população. |
| `limite_inferior` e `limite_superior` | Intervalo de previsão. |
| `probabilidade_alerta` | Probabilidade calibrada. |
| `nivel_alerta` | Categoria operacional versionada. |
| `model_version` | Artefato utilizado. |
| `dataset_version` | Dados e data de corte. |
| `target_definition_id` | Regra do alvo. |
| `quality_status` | Cobertura/portão de qualidade. |
| `top_factors` | Explicações resumidas. |

Previsões não devem ser sobrescritas. Cada emissão é um snapshot para permitir auditoria e avaliação posterior.

## 24. Operação semanal

```text
1. Receber e versionar os novos dados
2. Validar esquema, território, calendário e cobertura
3. Atualizar as camadas prata e ouro
4. Estimar atraso e gerar nowcast das semanas recentes
5. Construir atributos somente até a data de corte
6. Executar os quatro horizontes
7. Calibrar probabilidades e intervalos com artefatos aprovados
8. Aplicar portões de qualidade
9. Registrar e publicar o snapshot
10. Monitorar realizado, erro, deriva e alertas
```

Retreinamento e inferência não são a mesma coisa. A inferência pode ser semanal; o retreinamento deve ocorrer em agenda controlada ou quando houver evidência de deriva, sempre passando novamente pela validação.

## 25. Monitoramento em produção

### 25.1 Dados

- volume por semana e UF;
- atraso e completude;
- municípios ausentes;
- códigos novos/inválidos;
- mudança de esquema;
- distribuição e imputação de clima;
- semanas revisadas depois da publicação.

### 25.2 Modelo

- MAE/WAPE e incidência quando o realizado amadurecer;
- precisão e revocação de alertas;
- cobertura dos intervalos;
- deriva de atributos e previsão;
- erro por UF, porte e município;
- comparação permanente com baselines;
- estabilidade das explicações.

### 25.3 Operação

- tempo do pipeline;
- falhas e repetição idempotente;
- idade da última previsão válida;
- alertas publicados, reconhecidos e atendidos;
- taxa de alertas suspensos por baixa qualidade.

## 26. Do modelo regional à prefeitura contratante

O modelo do Nordeste atende a escala municipal com dados padronizados. Ele não cria automaticamente previsões por bairro.

Ao contratar uma prefeitura:

1. executar o modelo regional como baseline municipal;
2. medir seu desempenho retrospectivo naquela cidade;
3. calibrar com o histórico local sem usar o futuro;
4. receber e validar casos por bairro/distrito, quando disponíveis;
5. incorporar LIRAa, ACE, APS e território local em um modelo separado;
6. comparar regional, calibrado, híbrido e local nos mesmos períodos;
7. publicar o vencedor por horizonte;
8. manter o modelo regional como fallback e referência.

| Dados disponíveis na prefeitura | Entrega possível |
|---|---|
| Apenas fontes públicas | Previsão municipal regional/global. |
| Histórico municipal mais atualizado | Calibração e *nowcasting* local. |
| Casos georreferenciados por território | Previsão por bairro/distrito validado. |
| LIRAa, ACE e APS | Modelo local enriquecido e priorização operacional. |

Dados restritos de uma prefeitura não devem treinar o modelo de outras cidades por padrão. Isso exige finalidade, autorização e governança específicas.

## 27. Estrutura sugerida para a implementação

```text
data/
  sinan/
    dengue-analitico.parquet
  referencias/
    municipios_historico.parquet
    calendario_epidemiologico.parquet
  ouro/
    nordeste_municipio_semana.parquet
    nordeste_atributos_h1.parquet
    nordeste_atributos_h2.parquet
    nordeste_atributos_h3.parquet
    nordeste_atributos_h4.parquet

scripts/modelagem/
  01_validar_fontes.py
  02_construir_dimensoes.py
  03_construir_painel_nordeste.py
  04_enriquecer_populacao.py
  05_enriquecer_clima.py
  06_construir_atributos.py
  07_treinar_baselines.py
  08_treinar_candidatos.py
  09_avaliar_modelos.py
  10_publicar_modelo.py
  11_inferir_semanal.py
  12_monitorar.py

configs/modelagem/
  alvo_confirmados_v1.yaml
  folds_nordeste_v1.yaml
  atributos_nucleo_v1.yaml
  portoes_qualidade_v1.yaml

models/
  registry/

reports/modelagem/
  qualidade/
  experimentos/
  model_cards/
```

Arquivos grandes derivados não devem entrar no Git. O repositório guarda código, configuração, esquemas, pequenas amostras de teste e relatórios; os datasets e artefatos ficam em armazenamento versionado apropriado.

## 28. Ordem de implementação

### Fase 1 — fundação epidemiológica

- [ ] Validar o dicionário histórico de classificação.
- [ ] Construir dimensão histórica de municípios.
- [ ] Construir calendário epidemiológico.
- [ ] Tipar e validar o Parquet sem carregá-lo integralmente em pandas.
- [ ] Gerar quarentena e relatório de qualidade.
- [ ] Gerar `nordeste_municipio_semana.parquet`.

### Fase 2 — benchmark

- [ ] Criar painel completo com zeros conhecidos e nulos de cobertura.
- [ ] Adicionar população e incidência.
- [ ] Criar atributos históricos sem vazamento.
- [ ] Implementar folds temporais e espaciais.
- [ ] Treinar baselines.
- [ ] Congelar testes 2024 e 2025.

### Fase 3 — candidatos

- [ ] Treinar modelo de contagem.
- [ ] Treinar arquitetura em duas etapas.
- [ ] Comparar modelo regional, por UF e calibrado.
- [ ] Produzir métricas por horizonte, UF e porte.
- [ ] Gerar intervalos e explicações.

### Fase 4 — enriquecimento

- [ ] Integrar clima com cobertura auditável.
- [ ] Adicionar vizinhança defasada.
- [ ] Executar ablação.
- [ ] Construir alvo operacional de casos prováveis.
- [ ] Construir modelo separado de atraso/*nowcasting*.

### Fase 5 — produto

- [ ] Definir limiares com epidemiologistas.
- [ ] Registrar artefato e *model card*.
- [ ] Criar job semanal idempotente.
- [ ] Publicar snapshots na API/dashboard.
- [ ] Monitorar dados, deriva, realizado e alertas.
- [ ] Executar piloto com prefeitura e comparar modelo regional/local.

## 29. Experimentos que respondem às decisões de negócio

| Pergunta | Experimento |
|---|---|
| Um único modelo atende todo o Nordeste? | Regional × modelos por UF nos mesmos folds. |
| Atende uma nova prefeitura? | *Holdout* de municípios inteiros. |
| Clima justifica a integração? | E2 × E3 no estudo de ablação. |
| Vizinhos melhoram alerta? | E3 × E4, sempre com valores defasados. |
| É melhor prever contagem ou incidência? | Modelos equivalentes e métricas duplas por porte. |
| Duas etapas ajudam com 86% de zeros? | Modelo único × *hurdle*. |
| Casos prováveis são mais úteis que confirmados? | Dois alvos, comparando atraso, estabilidade e desempenho. |
| O global substitui o modelo local? | Regional × calibrado × local × híbrido em cidades piloto. |
| O horizonte de quatro semanas é confiável? | Avaliação independente de `h=1` a `h=4`. |

## 30. Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Códigos municipais históricos incompatíveis | Dimensão territorial com vigência e quarentena. |
| Mudança de classificação do SINAN | Regra por período e alvo versionado. |
| Atraso nas semanas recentes | Data de corte, maturação e *nowcasting* separado. |
| Ausência confundida com zero | Flags de cobertura e painel com nulos explícitos. |
| Vazamento temporal | Gerador de atributos por data de corte e testes automatizados. |
| Cidades grandes dominam | Pesos, métricas macro e recortes por porte. |
| Modelo memoriza município | *Holdout* espacial e análise sem identificador. |
| Clima futuro indisponível | Climatologia ou previsão meteorológica versionada. |
| Mudança territorial | Vigência de município, malha e vizinhança. |
| Falsos alertas | Calibração, limiares operacionais e monitoramento. |
| Confiança excessiva | Intervalos, status de qualidade e suspensão segura. |
| Métrica boa sem utilidade | Avaliação de alerta, antecedência e piloto operacional. |

## 31. Critério de conclusão do primeiro marco

O primeiro marco estará concluído quando existirem, de forma reproduzível:

1. painel município × semana validado para 2015–2025;
2. relatório dos códigos, datas, classificações, duplicidade e cobertura;
3. população e incidência vinculadas;
4. gerador de atributos sem vazamento para quatro horizontes;
5. folds temporais e espaciais congelados;
6. resultados dos baselines e de pelo menos dois candidatos;
7. avaliação de 2024 e 2025 por UF, porte e municípios não vistos;
8. intervalos, calibração e análise de alertas;
9. *model card* do vencedor e motivos da decisão;
10. pipeline de inferência semanal executável sem ler todo o SINAN em memória.

Isso produz um modelo regional defensável. Integração com dashboard, previsão intramunicipal e automação operacional são marcos posteriores e não devem ser confundidos com a conclusão científica do primeiro experimento.

## 32. Relação com os demais documentos

- [Do experimento da USP ao modelo para prefeituras](../resumosDeArtigos/fontesDadosReproducaoArtigoPrevisaoDengue.md): arquitetura global, local e híbrida, fontes e onboarding municipal.
- [Análise comparativa do artigo e dos dados abertos](../resumosDeArtigos/analiseComparativaArtigoPrevisaoDengue.md): auditoria científica e limitações do código original.
- [Documento de requisitos](../documento_de_requisitos.md): RF-005, RF-007, RF-010, RF-016, RNF-012 e RNF-014.
- [Modelo de negócio](../possiveis_modelos_de_negocios.md): implantação, assinatura recorrente e especialização por prefeitura.

## 33. Referências principais

- [Portal de Dados Abertos do SUS — Arboviroses/Dengue](https://dadosabertos.saude.gov.br/dataset/arboviroses-dengue): recursos anuais, definição de casos prováveis e recomendação de residência para incidência.
- [Dicionário de dados do SINAN/Dengue](https://portalsinan.saude.gov.br/images/documentos/Agravos/Dengue/DIC_DADOS_ONLINE.pdf): campos e códigos do sistema.
- [SINAN — Ministério da Saúde](https://www.gov.br/saude/pt-br/composicao/svsa/sistemas-de-informacao/sinan): contexto oficial do sistema.
- [Estimativas da população dos municípios — IBGE](https://www.ibge.gov.br/estatisticas/sociais/populacao/9103): denominadores populacionais anuais.
- [Dados históricos — INMET](https://portal.inmet.gov.br/dadoshistoricos): arquivos meteorológicos anuais.
- [Artigo e código analisados](../resumosDeArtigos/resumoArtigoPrevisaoDengue.md): referência para atributos, CatBoost, SHAP e comparação com SARIMA.

## 34. Próxima entrega técnica

A próxima entrega não deve ser o treinamento do CatBoost. Deve ser o gerador auditável de `nordeste_municipio_semana.parquet`, acompanhado de:

- dimensão municipal validada;
- calendário epidemiológico;
- configuração versionada do alvo;
- relatório de qualidade;
- contagens de reconciliação entre bronze, prata, quarentena e ouro.

Somente depois que esses artefatos forem aprovados será seguro criar as defasagens e iniciar os experimentos de previsão.
