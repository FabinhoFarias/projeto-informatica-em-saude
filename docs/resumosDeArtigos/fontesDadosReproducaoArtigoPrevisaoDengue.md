# Do experimento da USP ao modelo para prefeituras

**Produto:** Plataforma Denguinhos<br>
**Decisão analisada:** modelo específico por prefeitura, modelo global para várias cidades ou arquitetura híbrida<br>
**Referência:** *Predicting Dengue Outbreaks with Explainable Machine Learning*<br>
**Código auditado:** [repositório original dos autores](https://gitlab.com/interscity/health/dengue-prediction), commit `5c437a84333d3e872098d2d11f101540513b2f01`

## Resposta direta

O experimento da USP fornece uma boa receita de atributos e avaliação, mas o modelo publicado foi construído especificamente para os bairros do Rio de Janeiro. Ele não pode receber o código de qualquer município e prever corretamente essa cidade sem dados históricos locais ou sem ter sido treinado novamente em uma base padronizada de várias cidades.

Para o Denguinhos, as três estratégias são tecnicamente possíveis:

1. **modelo municipal:** um modelo treinado somente com a história da prefeitura contratante;
2. **modelo global:** um modelo treinado com muitos municípios para prever qualquer município representado pelas mesmas variáveis;
3. **modelo híbrido:** um modelo global fornece o ponto de partida e cada prefeitura recebe calibração ou modelo local próprio.

**Recomendação:** construir uma arquitetura híbrida. Um modelo global no nível município × semana, usando dados públicos nacionais, atende baseline, municípios sem histórico intramunicipal e início de implantação. Quando uma prefeitura fornecer casos por bairro/distrito, território e dados operacionais, o pipeline treina e compara um modelo especializado naquela cidade. O sistema publica como modelo oficial o candidato que vencer a validação temporal local.

Um modelo nacional pode prever o total municipal com fontes abertas. Ele não consegue, sozinho, prever bairros de uma nova cidade, porque o SINAN aberto não contém regularmente o bairro dos registros. A previsão intramunicipal continua dependendo dos dados da prefeitura.

## O que a equipe da USP efetivamente usou no Rio

O artigo foi produzido por pesquisadores ligados à USP/InterSCity e parceiros. O experimento organizou os dados por bairro e mês no município do Rio de Janeiro. A base intermediária possui 160 bairros e cobre janeiro de 2012 a outubro de 2020 após as defasagens; o código publicado filtra os anos posteriores a 2014 e avalia previsões entre 2016 e 2020.

O alvo é `dengue_diagnosis`, a quantidade mensal de casos de dengue no bairro. O arquivo [`main.py` do repositório original](https://gitlab.com/interscity/health/dengue-prediction/-/blob/5c437a84333d3e872098d2d11f101540513b2f01/main.py) seleciona exatamente estas 13 entradas:

| Variável do código | Significado | Origem necessária | Portabilidade |
|---|---|---|---|
| `t-1` | Casos de dengue no bairro no mês anterior | SINAN municipal por bairro | Alta, se a prefeitura fornecer território |
| `t-2` | Casos de dengue dois meses antes | SINAN municipal por bairro | Alta |
| `t-3` | Casos de dengue três meses antes | SINAN municipal por bairro | Alta |
| `sum_vizinhos_t-1` | Soma dos casos nos bairros vizinhos no mês anterior | Casos por bairro + malha + regra de vizinhança | Alta, mas depende de geografia local |
| `precipitacao (mm)-1` | Precipitação do mês anterior | INMET | Alta |
| `temperatura (°C)-1` | Temperatura do mês anterior | INMET | Alta |
| `umidade ar (%)-1` | Umidade do mês anterior | INMET | Alta, condicionada à cobertura da estação |
| `densidade_demografica` | População dividida pela área do bairro | IBGE e prefeitura | Alta |
| `qtd_cnes` | Quantidade de estabelecimentos de saúde no bairro | CNES | Média; precisa de competência e geolocalização corretas |
| `zika-1` | Casos de zika no mês anterior | SINAN municipal | Condicional; série mais curta e frequentemente ausente |
| `chikungunya-1` | Casos de chikungunya no mês anterior | SINAN municipal | Condicional |
| `liraa` | Índice do levantamento entomológico disponível | Vigilância municipal | Condicional; periodicidade e território variam |
| `critical_neighbor` | Intensidade histórica de dengue do bairro, normalizada entre os bairros | Derivado do histórico de dengue | Reutilizar apenas com cálculo sem informação futura |

Além dessas entradas, os autores usaram:

- **CatBoost** como modelo principal;
- **SARIMA** como baseline temporal;
- previsão recursiva de um e três meses;
- percentis 95 e 99 do treino para classificar intensidade de surto;
- SHAP para explicar as previsões;
- polígonos e relações de vizinhança dos bairros;
- avaliação com MAE, RMSE, MAPE, R², precisão, revocação e F1.

### O que é dado bruto e o que é derivado

| Tipo | Elementos |
|---|---|
| Dados epidemiológicos | dengue, zika e chikungunya por bairro e mês |
| Dados externos | clima, população, área, CNES e LIRAa |
| Dados territoriais | código, nome, polígono, centroide e bairros vizinhos |
| Atributos derivados | `t-1`, `t-2`, `t-3`, soma dos vizinhos e `critical_neighbor` |
| Saída | quantidade futura de dengue e categoria de surto |

O arquivo enriquecido do Rio não é um requisito para atender outra prefeitura. Ele é útil para entender o formato e reproduzir o artigo, mas o modelo municipal precisa reconstruir essas colunas com dados da cidade contratante.

## O que pode ser reaproveitado em qualquer prefeitura

### Reaproveitar como núcleo do produto

- estrutura território × período;
- histórico defasado de dengue;
- clima defasado;
- população e densidade;
- informação dos territórios vizinhos;
- comparação entre CatBoost e baselines;
- validação por períodos futuros;
- explicações SHAP;
- registro de versão e limitações.

### Reaproveitar somente quando houver cobertura local

- LIRAa/LIA;
- casos de zika e chikungunya;
- visitas dos ACE e focos;
- APS e atendimentos febris;
- CNES intramunicipal histórico;
- vizinhança entre bairros ou distritos.

### Não copiar diretamente do experimento

- o modelo treinado com dados do Rio;
- os nomes ou códigos dos bairros cariocas;
- a matriz de vizinhança do Rio;
- a densidade, o CNES e o LIRAa do Rio;
- os percentis 95 e 99 como limiares universais;
- a divisão mensal se o produto municipal trabalha com semanas;
- a validação publicada que permite períodos futuros no treinamento;
- `critical_neighbor` calculado sobre dados que ainda não estariam disponíveis;
- contagem bruta sem considerar população e diferença de porte entre cidades.

## Três arquiteturas possíveis

### A. Um modelo específico para cada prefeitura

Cada cidade possui dataset, treino, hiperparâmetros, limiares e artefato próprios.

**Vantagens:**

- aprende sazonalidade, território e atraso locais;
- aceita atributos exclusivos, como LIRAa, ACE e APS;
- é mais fácil explicar ao epidemiologista municipal;
- evita que cidades grandes dominem o aprendizado.

**Limitações:**

- precisa de histórico local suficiente;
- municípios pequenos podem ter poucos surtos e muitos zeros;
- manutenção e validação precisam ser automatizadas para não gerar trabalho manual por cliente.

**Quando usar:** cidade com aproximadamente cinco ou mais anos de dados consistentes, cobertura territorial confiável e quantidade suficiente de eventos para validação. O tempo mínimo é uma referência, não garantia automática.

### B. Um grande modelo global para várias prefeituras

Todas as cidades são organizadas no mesmo esquema, por exemplo município × semana, e participam de um único treinamento.

**É possível**, mas o dataset precisa incluir:

- código da cidade e UF como contexto, não como única explicação;
- população e densidade;
- clima local;
- histórico de dengue na própria cidade;
- incidência por população ou modelo de contagem com exposição populacional;
- sazonalidade e coordenadas ou região climática;
- cobertura e atraso de notificação;
- atributos com a mesma definição em todas as cidades.

O modelo global não deve aprender apenas que “cidade X costuma ter mais casos”. Ele precisa aprender padrões transferíveis, como interação entre histórico recente, sazonalidade, população e clima.

**Vantagens:**

- aproveita milhões de registros nacionais;
- atende cidades com pouco histórico;
- fornece baseline uniforme para prospecção e início do contrato;
- pode prever municípios usando apenas fontes nacionais.

**Limitações:**

- diferenças de qualidade e atraso podem ser confundidas com epidemiologia;
- cidades grandes podem dominar a função de perda;
- atributos intramunicipais e operacionais não são uniformes;
- um município nunca visto exige avaliação específica de generalização;
- bom resultado médio nacional pode esconder desempenho ruim na cidade cliente.

**Validação obrigatória:** além do corte temporal, reservar municípios inteiros que não participaram do treino. A avaliação deve responder tanto “prevê o futuro de cidades conhecidas?” quanto “generaliza para uma cidade nova?”.

### C. Arquitetura híbrida — recomendada

A plataforma mantém dois níveis:

1. **modelo global municipal:** treinado com fontes nacionais padronizadas, no nível município × semana;
2. **modelo local territorial:** treinado por prefeitura quando existirem casos por bairro/distrito e fontes municipais.

Uma alternativa intermediária é usar o resultado global como baseline ou atributo do modelo local. Outra é calibrar o modelo global com o histórico recente da cidade. A técnica escolhida precisa ser comparada com modelos local e global puros, sem assumir que adaptação sempre melhora o resultado.

| Situação da prefeitura | Estratégia inicial |
|---|---|
| Sem contrato ou sem dados locais | Modelo global no nível municipal, com dados públicos |
| Menos de 3 anos locais | Modelo global; não prometer bairro sem validação |
| 3 a 5 anos locais | Comparar global, local simplificado e calibração híbrida |
| 5 ou mais anos e território consistente | Treinar modelo territorial especializado e comparar com o global |
| Dados operacionais maduros | Enriquecer o modelo local com LIRAa, ACE e APS |
| Série territorial muito esparsa | Agregar para distrito/área ou manter previsão municipal |

## Recomendação para o Denguinhos

### Produto 1 — modelo global de entrada

Construir uma tabela nacional município × semana usando:

- casos de dengue por município de residência;
- defasagens do histórico;
- população e incidência;
- precipitação, temperatura e umidade;
- sazonalidade;
- CNES e atributos territoriais que tenham cobertura nacional;
- indicadores de completude e atraso.

Esse modelo permite demonstração com dados públicos, baseline nacional, priorização comercial e primeira previsão municipal. Ele não deve produzir um mapa fictício de bairros.

#### Como usar a base nacional que o projeto já baixou

Os aproximadamente 32,5 milhões de registros do SINAN/Dengue podem alimentar o modelo global, mas o modelo não deve treinar diretamente uma linha por notificação. A base precisa ser transformada em um painel município × semana:

1. selecionar município de residência por `ID_MN_RESI`;
2. definir ocorrência por `DT_SIN_PRI` ou `SEM_PRI`;
3. aplicar a regra aprovada de caso usando `CLASSI_FIN` e outros campos necessários;
4. excluir duplicidades identificadas por `NDUPLIC_N` conforme o dicionário do período;
5. preservar `DT_NOTIFIC`, `DT_DIGITA` e `DT_ENCERRA` para medir atraso;
6. agregar a quantidade elegível por município e semana epidemiológica;
7. completar semanas sem registros, diferenciando zero confirmado de lote ainda não recebido;
8. adicionar população, clima, sazonalidade, CNES e indicadores de qualidade;
9. criar defasagens usando somente semanas anteriores ao corte;
10. separar treino, validação temporal e municípios nunca vistos.

`ANO_ARQUIVO` identifica o recurso anual de origem e não substitui a data epidemiológica do evento.

O resultado terá uma quantidade de linhas muito menor que o CSV nacional e poderá ser usado para comparar modelos de contagem, árvores e baselines. Para equilibrar cidades de portes diferentes, a avaliação deve incluir incidência e métricas por faixa populacional; na modelagem de contagens, a população pode ser tratada como exposição.

As versões municipais e global podem compartilhar o mesmo histórico público de origem, mas não a mesma granularidade:

| Modelo | Unidade da linha | Fonte do território | Saída possível |
|---|---|---|---|
| Global | Município × semana | Código IBGE no SINAN público | Casos/incidência futura do município |
| Local | Bairro/distrito × semana | Dados e malha da prefeitura | Casos/incidência por território intramunicipal |
| Híbrido | Município + painel territorial local | Fontes nacionais e municipais | Baseline global ajustado e previsão territorial validada |

### Produto 2 — modelo especializado contratado

Durante o onboarding da prefeitura:

1. receber casos por bairro/distrito e malha oficial;
2. reconstruir as variáveis portáveis do artigo;
3. avaliar atributos locais adicionais;
4. treinar modelo local e comparar com o global;
5. validar em cortes temporais e por território;
6. calibrar limiares com a vigilância;
7. publicar o vencedor como modelo daquela prefeitura;
8. monitorar e promover novas versões somente após nova comparação.

### Regra de seleção do modelo

Não definir previamente que toda prefeitura usará CatBoost local ou o modelo global. Para cada cliente, o registro de modelos deve manter:

- baseline sazonal;
- candidato global;
- candidato local;
- candidato híbrido, quando aplicável;
- métricas por horizonte e território;
- cobertura, incerteza e limitações;
- decisão e aprovação do responsável técnico.

O modelo oficial é o que apresenta melhor utilidade prospectiva local, não o que possui a arquitetura mais sofisticada.

## Experimentos necessários antes de decidir definitivamente

### Experimento 1 — reproduzir o conjunto de atributos da USP

Objetivo: validar se o pipeline consegue reconstruir, para uma cidade com dados territoriais, as 13 entradas do código sem vazamento de informação.

### Experimento 2 — ablação de atributos

Treinar versões progressivas:

1. somente histórico de dengue e sazonalidade;
2. adicionar clima;
3. adicionar população e densidade;
4. adicionar vizinhos;
5. adicionar CNES;
6. adicionar zika, chikungunya e LIRAa;
7. adicionar dados operacionais municipais.

Isso mostra quais fontes realmente melhoram a previsão fora da amostra e quais apenas aumentam custo de integração.

### Experimento 3 — local versus global versus híbrido

Executar os três modelos nos mesmos municípios e períodos, usando os mesmos cortes temporais. Comparar erro, detecção de surtos, calibração, cobertura e estabilidade.

### Experimento 4 — município nunca visto

Separar algumas cidades completamente do treino global. Esse teste mede se o grande modelo consegue atender uma prefeitura nova ou se apenas memorizou as cidades conhecidas.

### Experimento 5 — granularidade territorial

Em cidades que forneçam bairros, comparar:

- município;
- distrito ou área de saúde;
- bairro.

Quanto menor o território, maior tende a ser a esparsidade. A melhor granularidade é a menor que mantenha qualidade e utilidade operacional, não necessariamente o bairro.

## 1. Objetivo deste documento

Este documento descreve como transformar dados nacionais e municipais em um pipeline repetível de previsão de dengue para uma prefeitura. O objetivo comercial não é entregar o mesmo modelo do Rio de Janeiro para todos os clientes. Cada implantação deve comparar as alternativas disponíveis e registrar uma versão aprovada para a cidade — global, calibrada, híbrida ou local — preservando um núcleo técnico comum da Plataforma Denguinhos.

O modelo do artigo é uma referência para seleção inicial de atributos — histórico de casos, clima, população, vizinhança, CNES e LIRAa —, mas não deve ser tratado como modelo universal. Municípios diferem em:

- padrão epidemiológico e quantidade de surtos;
- clima, relevo, urbanização e mobilidade;
- qualidade e atraso das notificações;
- divisão em bairros, distritos, áreas e setores operacionais;
- disponibilidade de LIRAa, visitas dos ACE e dados da APS;
- capacidade de resposta e definição operacional de risco.

Por isso, cada contratação produz conjunto analítico, avaliação, limiares e publicação próprios, mesmo quando o artefato global compartilhado for o vencedor. O produto continua sendo único e multicliente: configurações municipais não devem criar uma cópia diferente do código para cada prefeitura.

## 2. O que significa “modelo especializado na cidade”

Um modelo municipal especializado possui:

1. **território próprio:** códigos, nomes, polígonos, hierarquia e vizinhança da prefeitura;
2. **histórico próprio:** casos e indicadores observados naquela população;
3. **regra de alvo própria:** casos prováveis ou confirmados, data epidemiológica e unidade temporal aprovadas;
4. **atributos disponíveis localmente:** clima, LIRAa, visitas, APS, saneamento e outros dados com cobertura comprovada;
5. **validação temporal local:** desempenho medido em anos e surtos que não participaram do treinamento;
6. **limiares locais:** definição de alerta pactuada com a vigilância epidemiológica;
7. **versão independente:** dataset, modelo, métricas, limitações e vigência identificados para aquele cliente;
8. **monitoramento local:** atraso, cobertura, deriva e desempenho acompanhados após a implantação.

Especialização não significa obrigatoriamente treinar um modelo separado para cada bairro. Na maioria dos municípios, é preferível treinar um único modelo municipal com todas as linhas território × período, usando o território como atributo. Isso permite compartilhar padrões entre bairros com poucos casos sem misturar dados de outras prefeituras.

### 2.1 O que é compartilhado e o que é municipal

| Núcleo compartilhado da plataforma | Configuração e artefatos da prefeitura |
|---|---|
| Estrutura dos conectores e contratos de dados | Credenciais, endpoints, arquivos e frequência de cada fonte |
| Camadas bronze, prata e ouro | Lotes, dataset analítico e regras de correspondência locais |
| Motor de validação e qualidade | Limites de qualidade aprovados pela prefeitura |
| Orquestração de treino e inferência | Calendário, horizonte e territórios previstos |
| Catálogo geral de atributos | Lista de atributos elegíveis e disponíveis naquela cidade |
| Implementações dos algoritmos e baselines | Artefato treinado e hiperparâmetros vencedores |
| Registro e monitoramento de modelos | Métricas, limiares, vigência e rollback municipais |
| Segurança e autorização multicliente | Usuários, unidades, permissões e política de visibilidade locais |

O modelo global pode combinar dados públicos nacionais padronizados de várias cidades. Dados restritos entregues por uma prefeitura não entram no treinamento de outras por padrão; esse uso exigiria finalidade, autorização e avaliação próprias. Em todos os casos, o desempenho global não substitui a validação na cidade contratante.

## 3. Níveis possíveis de implantação

Nem toda prefeitura terá imediatamente dados suficientes para previsão por bairro. O contrato deve deixar claro qual nível será entregue.

| Nível | Dados disponíveis | Entrega possível |
|---|---|---|
| **1 — Municipal aberto** | SINAN público, INMET, IBGE e CNES | Série, nowcasting e previsão para o município inteiro; diagnóstico inicial de qualidade. |
| **2 — Territorial municipal** | Casos por bairro/distrito e malha territorial confiável | Modelo especializado por bairro ou distrito, mapa de risco e atributos de vizinhança. |
| **3 — Operacional integrado** | Nível 2 + LIRAa, visitas dos ACE, APS e fluxos locais | Previsão enriquecida, nowcasting, indicadores observados e apoio à priorização operacional. |

Uma previsão intramunicipal não deve ser prometida usando apenas o SINAN aberto nacional. A base pública identifica regularmente o município, mas não fornece bairro padronizado, setor censitário ou coordenada residencial para cada notificação.

## 4. Visão geral do pipeline

```text
Diagnóstico e contrato de dados da prefeitura
                    ↓
Fontes nacionais + fontes municipais autorizadas
                    ↓
Bronze: arquivos originais, imutáveis e versionados
                    ↓
Prata: esquemas normalizados, território e qualidade
                    ↓
Ouro: território × semana epidemiológica
                    ↓
Nowcasting e atributos disponíveis até a data de corte
                    ↓
Treino e validação temporal do município
                    ↓
Registro, aprovação técnica e publicação do modelo
                    ↓
Inferência recorrente, alertas e monitoramento
                    ↓
Retreinamento controlado ou rollback
```

O pipeline possui duas frequências distintas:

- **inferência:** executada conforme a atualização das fontes, normalmente diária ou semanal;
- **treinamento:** executado somente quando houver dados novos suficientes, mudança relevante ou calendário aprovado, e nunca a cada consulta do dashboard.

## 5. Etapa 0 — diagnóstico antes da contratação técnica

Antes de importar dados, a equipe do Denguinhos e a prefeitura devem preencher um inventário conjunto.

### 5.1 Perguntas obrigatórias

- Qual território será previsto: município, distrito, bairro, área de saúde ou outro recorte?
- Existe código estável para cada território ou somente nome digitado?
- Há polígonos oficiais e histórico de alterações territoriais?
- Quantos anos de notificações estão disponíveis nessa granularidade?
- Os casos estão associados à residência, notificação ou local provável de infecção?
- A prefeitura consegue fornecer data de início dos sintomas, notificação, digitação e encerramento?
- Qual regra local define caso provável, confirmado, descartado e duplicado?
- Com que frequência a base é atualizada e quanto tempo leva para consolidar?
- Há LIRAa/LIA, visitas dos ACE, focos, depósitos, APS ou atendimentos febris?
- Quais fontes podem ser usadas para treinamento, operação, relatório ou somente auditoria?
- Quem é responsável por aprovar o dataset, o modelo e os limiares de alerta?

### 5.2 Resultado do diagnóstico

O diagnóstico deve produzir:

- nível de implantação possível;
- fontes e responsáveis;
- período histórico realmente disponível;
- granularidade territorial e temporal;
- lacunas que impedem determinadas entregas;
- plano de acesso e transferência;
- critérios do piloto;
- estimativa de esforço de saneamento;
- decisão de seguir, reduzir a granularidade ou aguardar dados adicionais.

## 6. Etapa 1 — contrato de dados municipal

Cada fonte precisa de um contrato de dados versionado. O contrato não é apenas jurídico: ele descreve tecnicamente o conteúdo esperado.

| Item | O que registrar |
|---|---|
| Fonte e proprietário | Órgão, sistema e unidade responsável. |
| Finalidade | Treinamento, inferência, nowcasting, operação ou auditoria. |
| Escopo | Agravo, período, território e população coberta. |
| Esquema | Campos, tipos, códigos e obrigatoriedade. |
| Chaves | Identificador de origem, código territorial e competência. |
| Temporalidade | Data do evento, atualização, extração e corte. |
| Semântica | Significado de zero, ausente, ignorado e não aplicável. |
| Qualidade | Completude esperada, duplicidade, atraso e regras de rejeição. |
| Segurança | Classificação, perfis autorizados, retenção e forma de transferência. |
| Mudanças | Processo para alteração de leiaute, códigos ou definição epidemiológica. |

Arquivos recebidos não devem ser sobrescritos silenciosamente. Toda entrega municipal precisa de identificador do lote, data de recebimento, hash, período coberto e resultado da validação.

## 7. Etapa 2 — dados necessários

### 7.1 Núcleo mínimo

| Grupo | Conteúdo mínimo | Origem preferencial | Obrigatório para quê? |
|---|---|---|---|
| Epidemiologia | Casos, território de residência, início dos sintomas, notificação, digitação, classificação e duplicidade | SINAN municipal ou extração da vigilância | Alvo, histórico e nowcasting |
| Território | Código, nome, hierarquia, vigência e polígono | Cadastro oficial da prefeitura | Modelo intramunicipal e mapa |
| População | População por território e ano de referência | IBGE e cadastro municipal validado | Incidência, densidade e comparação |
| Clima | Precipitação, temperatura e umidade | INMET ou rede meteorológica validada | Atributos ambientais |
| Calendário | Semana epidemiológica, feriados e períodos de atualização | Ministério da Saúde e prefeitura | Alinhamento temporal |

Sem histórico epidemiológico e território consistente, clima e inteligência artificial não resolvem o problema central.

### 7.2 Dados enriquecedores

| Grupo | Exemplos | Uso possível | Condição de entrada |
|---|---|---|---|
| Entomologia | LIRAa/LIA, IIP, Índice de Breteau, focos e depósitos | Pressão vetorial observada | Método, ciclo, denominador e território documentados |
| Operação dos ACE | Visitas, imóveis inspecionados, pendências, tratamentos e cobertura | Contexto operacional e avaliação de ação | Registros consistentes e disponíveis antes da previsão |
| APS e urgência | Atendimentos febris, sintomas compatíveis e testes | Sinal precoce e nowcasting | Finalidade e campos autorizados; análise agregada |
| Outras arboviroses | Zika e chikungunya | Circulação compartilhada do vetor | Definição e cobertura conhecidas |
| Saúde e assistência | Unidades, capacidade e acessibilidade | Contexto assistencial | Competência histórica, não apenas fotografia atual |
| Ambiente urbano | Saneamento, coleta, água, alagamentos e uso do solo | Vulnerabilidade territorial | Cobertura temporal e geográfica comprovada |
| Mobilidade | Fluxos agregados entre territórios | Propagação espacial | Fonte autorizada, estável e não identificável |

Cada atributo opcional só entra no modelo depois de demonstrar cobertura, disponibilidade operacional e ganho fora da amostra. Ter uma coluna não significa que ela seja válida como variável preditora.

## 8. Onde obter as fontes nacionais

| Fonte | Onde obter | Papel no pipeline | Limitação principal |
|---|---|---|---|
| SINAN/Dengue | [Portal de Dados Abertos do SUS](https://dadosabertos.saude.gov.br/dataset/arboviroses-dengue) | Histórico municipal, auditoria de classificações e baseline nacional | Não oferece regularmente bairro do caso na base pública |
| Clima horário | [Dados históricos do INMET](https://portal.inmet.gov.br/dadoshistoricos) | Chuva, temperatura e umidade | Dados automáticos brutos podem ter falhas |
| Clima histórico consultável | [BDMEP](https://bdmep.inmet.gov.br/) | Estações convencionais e séries históricas | Cobertura varia por estação e período |
| Catálogo meteorológico | [Estações automáticas](https://portal.inmet.gov.br/paginas/catalogoaut) e [convencionais](https://portal.inmet.gov.br/paginas/catalogoman) | Escolha e versionamento das estações | Estação mais próxima pode não representar todos os territórios |
| População e território | [IBGE](https://www.ibge.gov.br/) e [SIDRA](https://sidra.ibge.gov.br/) | População, Censo e indicadores | Ano censitário não acompanha automaticamente mudanças anuais |
| Malhas | [Malhas territoriais do IBGE](https://www.ibge.gov.br/geociencias/organizacao-do-territorio/malhas-territoriais/26565-malhas-de-setores-censitarios-divisoes-intramunicipais.html) | Município, distrito, setor e divisões disponíveis | Bairro oficial da prefeitura pode diferir da divisão do IBGE |
| Estabelecimentos | [Arquivos do CNES](https://cnes.datasus.gov.br/pages/downloads/arquivosBaseDados.jsp) | Estoque de unidades por competência | Histórico e situação cadastral precisam ser tratados |
| LIRAa/LIA | [Ministério da Saúde](https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/a/arboviroses/liraa) | Resultados e orientação nacional | Série detalhada deve frequentemente ser obtida no município |

Fontes nacionais devem ser filtradas pelo código IBGE do município, nunca apenas por nome. O nome pode variar, conter acentos ou coincidir com outro local.

## 9. O que solicitar à prefeitura contratante

### 9.1 Série epidemiológica intramunicipal

Para previsão por bairro ou distrito, solicitar uma tabela com:

- identificador estável do registro na origem ou contagem agregada versionada;
- agravo;
- código e nome do território de residência;
- data ou semana de início dos sintomas;
- data de notificação;
- data de digitação ou primeira disponibilidade no sistema;
- data de encerramento;
- classificação final e critério;
- indicação de descarte e duplicidade;
- hospitalização, gravidade, evolução e sorotipo quando autorizados e úteis;
- data de extração e versão do lote;
- registros sem território identificável contabilizados separadamente.

O conjunto de ML deve ser agregado por território e período, sem nome, CPF, Cartão SUS, endereço residencial ou outro identificador direto. Se a operação autorizada precisar manter dados identificados para vinculação, eles permanecem separados da camada analítica.

### 9.2 Cadastro territorial

Solicitar:

- códigos e nomes oficiais;
- GeoJSON, Shapefile, GeoPackage ou serviço geográfico oficial;
- vigência de cada divisão;
- hierarquia e correspondências entre bairro, distrito, área, setor, localidade e quarteirão;
- aliases e grafias antigas;
- alterações de limites;
- população e área de cada território;
- exceções de vizinhança relevantes à operação municipal.

Não se deve presumir que bairro, distrito sanitário, área de cobertura e setor dos ACE sejam equivalentes ou estejam sempre em uma única hierarquia.

### 9.3 Vigilância entomológica e trabalho de campo

Solicitar, quando existentes:

- campanha ou ciclo;
- datas de início e fim;
- território e estrato;
- imóveis elegíveis, pesquisados e positivos;
- depósitos pesquisados e positivos;
- IIP, Índice de Breteau e respectivos numeradores e denominadores;
- focos, espécies, fase e situação laboratorial;
- visitas, recusas, imóveis fechados, pendências e tratamentos;
- versão da metodologia e responsável pela aprovação.

Valor ausente não deve virar zero. Ciclo não executado, dado ainda não recebido, território não amostrado e resultado negativo são estados diferentes.

### 9.4 APS e sinais precoces

Se o município contratar integração com APS ou urgência, solicitar apenas os campos aprovados para a finalidade, como:

- data do atendimento;
- território de residência ou da unidade;
- síndrome ou conjunto de sintomas autorizado;
- resultado de teste, quando aplicável;
- data de disponibilidade no sistema;
- fonte e versão da definição sindrômica.

Treinamento e inferência devem usar visões agregadas. Dados clínicos identificados não devem ser copiados para notebooks, arquivos de treinamento, demonstrações ou serviços externos.

## 10. Etapa 3 — armazenamento em camadas

### 10.1 Bronze

Preserva exatamente o que foi recebido:

- arquivo original;
- fonte e cliente;
- hash e lote;
- data de extração e recebimento;
- esquema observado;
- resultado da verificação inicial;
- restrição de acesso e retenção.

### 10.2 Prata

Normaliza sem apagar a origem:

- tipos e códigos;
- datas e semanas epidemiológicas;
- classificação e duplicidade;
- unidade territorial canônica;
- aliases e correspondências;
- unidades meteorológicas;
- flags de qualidade;
- histórico de correções.

Uma correção na camada prata referencia o registro original; ela não altera o arquivo bronze.

### 10.3 Ouro

Produz a tabela usada pelo modelo. A unidade recomendada para o Denguinhos é:

```text
cliente + município + território + semana epidemiológica + data de corte
```

Uma linha deve conter o alvo, os atributos disponíveis até o corte e indicadores de cobertura. A data de corte é indispensável para reconstruir o que o sistema realmente sabia ao emitir a previsão.

### 10.4 Volume e desempenho

O treinamento municipal não deve carregar o CSV nacional consolidado de mais de 10 GiB nem os milhões de notificações brasileiras em memória. O fluxo recomendado é:

1. preservar cada arquivo nacional original uma única vez na camada bronze compartilhada e versionada;
2. converter arquivos grandes para formato colunar, particionado por ano e UF;
3. filtrar cedo pelo código IBGE de residência do município contratado;
4. manter somente as colunas necessárias para a etapa em execução;
5. agregar notificações para território × semana antes da criação de atributos;
6. treinar sobre a camada ouro municipal, que é muito menor;
7. processar atualizações de forma incremental e reconstruir tudo apenas quando houver mudança de regra ou correção histórica relevante.

A fonte pública nacional pode ser armazenada uma vez pela plataforma, pois possui a mesma origem para todos os clientes. Datasets derivados, dados fornecidos pela prefeitura, modelos, inferências e permissões continuam isolados por `cliente_id`.

## 11. Etapa 4 — configuração territorial

Antes do treinamento:

1. escolher o nível territorial com cobertura suficiente;
2. validar códigos e polígonos com a prefeitura;
3. construir a tabela de correspondências históricas;
4. calcular área e densidade com sistema de referência adequado;
5. definir vizinhança por fronteira, distância ou fluxo aprovado;
6. testar territórios sem vizinhos e geometrias inválidas;
7. congelar uma versão territorial para cada dataset e modelo.

Mudança de limite não deve reescrever silenciosamente a história. É preciso manter a geometria original, criar correspondência ou reconstruir toda a série sob uma nova versão documentada.

## 12. Etapa 5 — definição do alvo

A prefeitura e o epidemiologista responsável devem aprovar, por escrito:

- agravo previsto;
- casos prováveis, confirmados ou outra regra;
- residência, notificação ou provável local de infecção;
- data de referência — preferencialmente início dos sintomas para ocorrência;
- frequência semanal ou mensal;
- contagem, incidência ou ambos;
- horizonte de 2, 3 ou 4 semanas;
- tratamento de descartes, duplicidades e territórios desconhecidos;
- regra epidemiológica de alerta.

### 12.1 Duas séries diferentes

O pipeline deve manter:

- **série de ocorrência:** organizada pela data de início dos sintomas;
- **série de conhecimento:** organizada pela data em que o registro ficou disponível.

A primeira representa a epidemia; a segunda permite medir atrasos e treinar o nowcasting. Usar uma base consolidada como se estivesse completa na data histórica gera vazamento de informação.

## 13. Etapa 6 — construção dos atributos

### 13.1 Atributos iniciais recomendados

- casos ou incidência em `t-1`, `t-2`, `t-3`, `t-4` e períodos sazonais;
- média, tendência e variação recentes;
- histórico sazonal do território;
- casos nos territórios vizinhos, sempre defasados;
- precipitação acumulada;
- temperatura e umidade agregadas;
- população e densidade;
- semana epidemiológica e componentes sazonais;
- cobertura e atraso recente das notificações.

### 13.2 Atributos condicionais

- LIRAa/LIA;
- visitas e cobertura dos ACE;
- focos e depósitos positivos;
- atendimentos febris da APS;
- zika e chikungunya;
- CNES por competência;
- saneamento, alagamentos e ambiente urbano;
- mobilidade agregada.

### 13.3 Regras contra vazamento

- nenhuma coluna pode usar dado posterior à data de corte;
- prevalência e estatísticas históricas são calculadas somente no treino disponível;
- vizinhos usam períodos anteriores, não a contagem futura do período previsto;
- CNES deve respeitar a competência histórica;
- LIRAa só entra depois da publicação do ciclo;
- preenchimento de ausências não pode consultar o futuro;
- população, malha e regras mantêm versão e vigência;
- atributos calculados em treino devem ser reproduzíveis na inferência.

## 14. Etapa 7 — qualidade e elegibilidade

Antes de treinar, gerar um relatório por fonte, ano e território com:

- linhas recebidas e aceitas;
- duplicidades;
- datas inválidas;
- completude de território e classificação;
- quantidade de casos sem território;
- atraso entre sintomas, notificação e digitação;
- cobertura temporal;
- mudanças de esquema;
- territórios sem população ou geometria;
- falhas de estação meteorológica;
- ciclos entomológicos ausentes;
- distribuição de zeros e surtos.

### 14.1 Portões de qualidade

| Estado | Decisão |
|---|---|
| **Aprovado** | Treinamento e publicação podem prosseguir. |
| **Aprovado com ressalvas** | Treinar somente com limitações visíveis e plano de correção. |
| **Bloqueado** | Não publicar previsão naquela granularidade; corrigir a fonte ou agregar o território. |

Os limites de cada indicador devem ser pactuados durante o piloto. Um percentual universal não deve ser aplicado a todos os municípios sem evidência.

## 15. Etapa 8 — treinamento especializado

### 15.1 Estratégia recomendada

Para cada prefeitura:

1. construir um baseline ingênuo — último valor e sazonal;
2. avaliar um modelo estatístico temporal;
3. avaliar CatBoost ou outro modelo de árvores adequado;
4. considerar modelos de contagem para séries muito esparsas;
5. comparar todos na mesma validação temporal;
6. escolher o modelo mais simples que cumpra o critério operacional;
7. gerar explicações globais e locais sem interpretá-las como causalidade.

O CatBoost do artigo é candidato inicial, não escolha obrigatória. Um algoritmo diferente pode ser superior em uma cidade menor, com poucos territórios ou muitos zeros.

### 15.2 Quantidade de histórico

Como referência de planejamento:

- menos de 3 anos geralmente é insuficiente para avaliar sazonalidade e surtos;
- 3 a 5 anos pode sustentar um piloto, dependendo da qualidade e da quantidade de eventos;
- 5 a 10 anos é preferível para validação municipal;
- muitos anos com poucas epidemias ainda podem ser insuficientes para avaliar alertas graves.

Esses intervalos não são critérios automáticos. A elegibilidade depende do número de períodos, territórios, surtos, mudanças de definição e estabilidade da coleta.

### 15.3 Municípios com poucos casos

Quando a série por bairro for esparsa:

- agrupar para distrito ou área operacional;
- prever incidência municipal e distribuir risco somente com metodologia validada;
- usar modelos de contagem ou hierárquicos;
- manter intervalos de incerteza;
- não transformar ausência de informação em risco baixo.

## 16. Etapa 9 — validação temporal e espacial

Divisão aleatória de linhas não representa o uso real. A validação deve simular o passado:

```text
treino até 2021 → validação em 2022
treino até 2022 → validação em 2023
treino até 2023 → validação em 2024
```

Também é necessário avaliar separadamente territórios com muita e pouca incidência.

### 16.1 Métricas mínimas

| Objetivo | Métricas |
|---|---|
| Magnitude | MAE, RMSE e erro por horizonte |
| Escala relativa | sMAPE ou métrica robusta a zeros |
| Contagem | Deviance de Poisson/Tweedie quando aplicável |
| Alerta | sensibilidade, especificidade, precisão, F1 e matriz de confusão |
| Probabilidade | calibração e Brier score quando houver probabilidade |
| Território | métricas por bairro/distrito e cobertura populacional |
| Operação | antecedência útil, falsos alertas e surtos não detectados |

MAPE não deve ser a única métrica, pois se comporta mal quando o observado é zero ou muito pequeno.

### 16.2 Critério de aprovação

O modelo só pode ser publicado quando:

- supera ou complementa o baseline no horizonte contratado;
- não depende de informação futura;
- apresenta desempenho e incerteza por território;
- foi revisado pelo responsável epidemiológico;
- possui limitações registradas;
- tem regra de rollback;
- seus alertas não são apresentados como diagnóstico ou ordem automática de intervenção.

## 17. Etapa 10 — limiares de alerta municipais

Os percentis 95 e 99 usados no artigo podem servir como experimento, mas não devem virar regra nacional do produto. Cada prefeitura deve escolher uma abordagem compatível com seu protocolo:

- canal endêmico;
- incidência por população;
- percentis históricos calculados apenas no treino;
- limiar operacional por capacidade de resposta;
- combinação de magnitude, probabilidade e tendência.

O sistema deve armazenar versão, vigência, autor e justificativa do limiar. Alterar o limiar muda a classificação do alerta, não o número previsto, e exige nova avaliação operacional.

## 18. Etapa 11 — registro e publicação

Cada modelo publicado precisa registrar:

- `cliente_id` e município geográfico;
- versão do dataset ouro;
- versão territorial;
- definição do alvo;
- data de corte e período de treino;
- atributos e transformações;
- algoritmo e hiperparâmetros;
- métricas por horizonte e território;
- limiares de alerta;
- ambiente e dependências;
- aprovadores técnico e epidemiológico;
- limitações, vigência e motivo da publicação;
- artefato anterior disponível para rollback.

Datasets, modelos, jobs, arquivos e resultados devem ser isolados por cliente. O código IBGE localiza o município, mas não substitui `cliente_id` como chave de isolamento do SaaS.

## 19. Etapa 12 — operação recorrente

### 19.1 Ciclo recomendado

| Frequência | Atividade |
|---|---|
| Diária ou conforme a fonte | Receber lotes, validar e atualizar a camada prata. |
| Semanal | Fechar corte, executar nowcasting, gerar atributos e inferência. |
| Em cada publicação | Criar snapshot com período, corte, horizonte, versão e limitações. |
| Mensal | Revisar cobertura, atraso, deriva e comportamento dos alertas. |
| Trimestral ou após evento relevante | Reavaliar desempenho com dados já consolidados. |
| Conforme política aprovada | Retreinar, comparar com o modelo vigente e promover ou rejeitar o candidato. |

Horários de entrega configurados pelo gestor não significam novo treinamento. Eles apenas disponibilizam a previsão válida mais recente para os perfis autorizados.

### 19.2 Monitoramento

Monitorar:

- atraso e volume das fontes;
- mudança de esquema;
- territórios ausentes;
- deriva dos atributos;
- distribuição das previsões;
- calibração e erro após consolidação;
- falsos alertas e surtos não detectados;
- tempo desde o último treino;
- versão publicada e falhas de inferência;
- decisões humanas tomadas a partir dos alertas, sem confundi-las com execução de campo.

## 20. Nowcasting e forecasting são produtos diferentes

- **Nowcasting:** estima quantos casos recentes já ocorreram, mas ainda não apareceram ou não foram encerrados na base.
- **Forecasting:** estima casos futuros nas próximas semanas.

O nowcasting usa o histórico de atraso entre sintomas, notificação, digitação e encerramento. A previsão futura consome uma série corrigida e atributos disponíveis na data de corte. Os dois resultados devem ser armazenados, avaliados e explicados separadamente.

## 21. Segurança, privacidade e governança

O pipeline municipal deve seguir estes princípios:

- dados identificados somente no ambiente operacional e na finalidade autorizada;
- camada de ML agregada e sem identificadores diretos;
- acesso limitado por prefeitura, unidade, papel, território e vigência;
- criptografia, auditoria e retenção definidas no contrato;
- transferência protegida e credenciais de serviço separadas;
- nenhum dado real em demonstrações, logs, URLs ou notebooks pessoais;
- nenhuma base municipal enviada a serviço externo sem contrato e política de campos;
- grupos pequenos e risco de reidentificação avaliados antes de exportar;
- correções e exclusões com trilha, não por sobrescrita silenciosa.

## 22. Entregáveis da implantação

### 22.1 Taxa de setup e onboarding

- inventário e contrato de dados;
- conectores ou procedimento de importação;
- catálogo territorial municipal;
- relatório de qualidade histórica;
- dataset bronze, prata e ouro versionados;
- definição do alvo e dos limiares;
- baselines e modelos candidatos;
- validação temporal e relatório de limitações;
- modelo municipal aprovado;
- capacitação de gestores e epidemiologistas.

### 22.2 Assinatura recorrente

- ingestão e validação contínuas;
- inferência e nowcasting programados;
- snapshots e mapas autorizados;
- monitoramento de fontes e modelo;
- retreinamento controlado;
- histórico, auditoria e rollback;
- suporte a alterações de leiaute e território dentro do escopo contratado.

### 22.3 Serviços adicionais

- integração com APS, urgência ou sistema legado;
- incorporação de LIRAa e operação dos ACE;
- estudos de impacto;
- novas arboviroses;
- revisão de território e indicadores;
- relatórios analíticos especializados.

## 23. Modelo de solicitação inicial à prefeitura

> Para implantação do modelo municipal de previsão de dengue, solicitamos o inventário das fontes epidemiológicas, territoriais, entomológicas, climáticas e operacionais disponíveis. Para cada fonte, informar órgão responsável, sistema, período histórico, frequência de atualização, granularidade territorial, campos, formato, regra de qualidade e forma autorizada de acesso.
>
> Para a série epidemiológica, solicitamos dados de dengue com território de residência, início dos sintomas, notificação, digitação, encerramento, classificação, critério e duplicidade, preferencialmente cobrindo pelo menos cinco anos. Também solicitamos a data de extração e o dicionário utilizado em cada período.
>
> Para implantação intramunicipal, solicitamos os códigos, nomes, polígonos, vigência e correspondências entre bairros, distritos, áreas, setores e demais divisões adotadas. Quando disponíveis, solicitamos séries de LIRAa/LIA, visitas dos ACE, focos, depósitos e atendimentos sindrômicos agregados, acompanhadas das metodologias e datas de disponibilidade.
>
> O conjunto destinado a análise e aprendizado de máquina será produzido de forma agregada, sem nome, CPF, Cartão SUS ou endereço individual. Eventuais dados identificados necessários à operação permanecerão em ambiente e fluxo separados, conforme finalidade e autorização municipal.

## 24. Checklist de prontidão da prefeitura

### Dados

- [ ] Há histórico epidemiológico suficiente e com dicionário.
- [ ] As datas de sintomas e de disponibilidade estão presentes.
- [ ] Descartes e duplicidades podem ser identificados.
- [ ] A cobertura territorial é mensurável.
- [ ] Ausente, zero e não aplicável têm significados definidos.

### Território

- [ ] Existem códigos estáveis e polígonos oficiais.
- [ ] Mudanças históricas estão documentadas.
- [ ] A população corresponde ao território e ao período.
- [ ] A prefeitura validou hierarquia, aliases e vizinhança.

### Modelo

- [ ] O alvo e o horizonte foram aprovados.
- [ ] Existe baseline de comparação.
- [ ] A avaliação é temporal e sem vazamento.
- [ ] Métricas foram revisadas por território.
- [ ] Limiar, incerteza e limitações estão documentados.

### Operação e governança

- [ ] Há responsáveis pelas fontes, modelo e alertas.
- [ ] A frequência de ingestão e inferência foi definida.
- [ ] Existe política de acesso, retenção e auditoria.
- [ ] Há procedimento de falha, desatualização e rollback.
- [ ] A prefeitura definiu quem pode visualizar e comunicar previsões.

## 25. Critério de conclusão da implantação

A implantação não termina quando um algoritmo consegue treinar. Ela termina quando:

1. a prefeitura consegue explicar a origem de cada atributo;
2. o dataset pode ser reconstruído a partir dos lotes versionados;
3. o modelo foi avaliado simulando apenas informação disponível no passado;
4. o resultado supera um baseline ou demonstra utilidade operacional específica;
5. as limitações aparecem junto da previsão;
6. existe responsável municipal pela interpretação;
7. inferência, monitoramento e rollback foram testados;
8. os dados e modelos da prefeitura estão isolados dos demais clientes;
9. a operação não depende de executar manualmente um notebook;
10. o contrato define atualização, suporte e critérios de retreinamento.

## 26. Papel do artigo do Rio de Janeiro

O artigo e seu [repositório original](https://gitlab.com/interscity/health/dengue-prediction) continuam úteis como referência científica. Eles demonstram que histórico epidemiológico, clima, vizinhança, densidade, CNES e LIRAa podem contribuir para previsão intramunicipal.

O arquivo [`dengue_input_from_source_v10.csv`](https://gitlab.com/interscity/health/dengue-prediction/-/blob/5c437a84333d3e872098d2d11f101540513b2f01/data/dengue_input_from_source_v10.csv) pode ser usado para estudar e auditar o experimento do Rio. Ele não deve ser usado para treinar o modelo de outra prefeitura nem como substituto dos dados locais.

O que deve ser reaproveitado é o método geral:

- combinar tempo, território, clima e vigilância;
- criar atributos defasados;
- comparar com baselines;
- explicar o modelo;
- validar sem informação futura.

O que precisa ser reconstruído em cada contrato é o mais importante: dados, território, alvo, limiares, modelo e operação da cidade contratante.

## 27. Referências

- [Resumo do artigo](resumoArtigoPrevisaoDengue.md)
- [Análise comparativa com o Denguinhos](analiseComparativaArtigoPrevisaoDengue.md)
- [Artigo em PDF](https://users.ime.usp.br/~kon/papers/Ai4Health_2022___Dengue.pdf)
- [Repositório original](https://gitlab.com/interscity/health/dengue-prediction)
- [Portal de Dados Abertos do SUS](https://dadosabertos.saude.gov.br/)
- [INMET](https://portal.inmet.gov.br/dadoshistoricos)
- [IBGE](https://www.ibge.gov.br/)
- [CNES](https://cnes.datasus.gov.br/pages/downloads/arquivosBaseDados.jsp)
- [LIRAa/LIA — Ministério da Saúde](https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/a/arboviroses/liraa)
- [Modelo de negócio do Denguinhos](../possiveis_modelos_de_negocios.md)
- [Documento de requisitos](../documento_de_requisitos.md)
