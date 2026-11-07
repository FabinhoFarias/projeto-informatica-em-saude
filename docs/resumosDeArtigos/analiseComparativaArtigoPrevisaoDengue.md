# Análise comparativa — artigo, dados abertos e Plataforma Denguinhos

**Artigo:** *Predicting Dengue Outbreaks with Explainable Machine Learning*<br>
**Autores:** Robson Aleixo, Fabio Kon, Rudi Rocha, Marcela Santos Camargo e Raphael Y. de Camargo<br>
**Publicação:** AI4Health/CCGrid 2022, p. 940–947<br>
**DOI:** <https://doi.org/10.1109/CCGrid54584.2022.00114><br>
**Auditoria:** 5 de novembro de 2026

## 1. Conclusão executiva

O artigo é uma boa referência científica para o núcleo preditivo do Denguinhos, principalmente por combinar histórico epidemiológico, clima, território e explicações SHAP. Ele não entrega, porém, um modelo pronto para ser incorporado ao produto.

A base aberta nacional do SINAN/Dengue permite construir séries por município, semana ou mês, além de descrever classificação, evolução, hospitalização, sorotipo e atraso de notificação. Ela não fornece regularmente bairro, setor censitário, coordenada ou endereço. Por isso:

- uma primeira versão municipal do modelo é viável com dados abertos;
- uma previsão por bairro ou distrito depende de dados municipais intramunicipais autorizados;
- a malha de bairros do IBGE não permite inferir o bairro de um registro que contém apenas o município;
- os 32,5 milhões de registros consolidados pelo projeto são notificações, e não automaticamente casos confirmados;
- o alvo do treinamento precisa ser definido e versionado antes de treinar qualquer modelo.

Para o negócio SaaS B2G, a oportunidade não está em copiar o CatBoost do artigo. O valor defensável é oferecer um pipeline municipal auditável: integrar fontes, corrigir atrasos, validar previsões no tempo, explicar resultados, controlar acesso, entregar alertas e ligar a análise à operação dos ACE e gestores.

## 2. O que o artigo fez

O trabalho prevê a quantidade mensal de casos de dengue em 160 bairros do município do Rio de Janeiro, com horizontes de um a três meses. Um único modelo CatBoost é treinado para todos os bairros. O SARIMA é usado como referência estatística.

Cada linha do conjunto analítico representa um bairro em um mês. O modelo recebe:

- casos de dengue nos três meses anteriores;
- prevalência histórica de dengue do bairro;
- soma de casos nos bairros vizinhos;
- precipitação, temperatura e umidade;
- dengue, zika e chikungunya anteriores;
- densidade demográfica;
- quantidade de estabelecimentos de saúde;
- índice LIRAa.

O artigo transforma a regressão em três categorias operacionais: sem surto, surto leve e surto grave. Os limites são os percentis 95 e 99 da distribuição de treino. As explicações globais e locais são geradas com TreeSHAP.

### 2.1 Resultados publicados

| Modelo | Horizonte | MAE mediano | RMSE mediano | MAPE mediano | R² mediano |
|---|---:|---:|---:|---:|---:|
| CatBoost | 1 mês | 3 | 6 | 0,77 | 0,47 |
| CatBoost | 3 meses | 3 | 10 | 1,20 | 0,38 |
| SARIMA | 1 mês | 3 | 8 | 0,65 | 0,11 |
| SARIMA | 3 meses | 4 | 18 | 0,96 | -0,16 |

Para três meses, o artigo relata 97% de acerto nos períodos sem surto, detecção de 76% dos surtos e ocorrência de algum surto em 86% das previsões classificadas como graves.

Esses números não devem ser usados como promessa comercial do Denguinhos. Eles foram medidos em uma cidade, em uma base enriquecida e com uma validação que não simula integralmente o uso prospectivo.

## 3. Auditoria dos artefatos originais

O repositório público foi auditado no commit `5c437a84333d3e872098d2d11f101540513b2f01`. O [registro de origem](codigoOriginalPrevisaoDengue/ORIGEM.md) descreve os oito scripts Python e o notebook disponibilizados pelos autores; a cópia do código permanece somente no ambiente local, fora do Git deste projeto.

### 3.1 Conjunto intermediário distribuído pelos autores

O arquivo `dengue_input_from_source_v10.csv`, mantido apenas no repositório original, possui:

- 16.960 linhas e 77 colunas;
- 160 bairros e 160 códigos de bairro;
- uma linha por bairro/mês;
- período de janeiro de 2012 a outubro de 2020;
- 1.920 linhas em cada ano completo e 1.600 em 2020;
- nenhum valor ausente nas variáveis selecionadas de dengue, clima, vizinhança, densidade e CNES;
- 33,96% de ausência em `liraa`, zika e chikungunya;
- atributos territoriais e enriquecidos que não existem no SINAN aberto nacional.

O artigo informa dados desde janeiro de 2011. O arquivo analítico começa em 2012 porque as defasagens removem o início da série.

### 3.2 O que está implementado

- CatBoost com os hiperparâmetros descritos no artigo;
- SARIMA por bairro;
- previsão recursiva de vários meses;
- cálculo de casos dos vizinhos;
- métricas de regressão e categorias de surto;
- gráficos territoriais;
- valores e visualizações SHAP.

### 3.3 Problemas que impedem uso direto

| Achado | Consequência |
|---|---|
| `main.py` contém marcadores `<<<<<<<`, `=======` e `>>>>>>>`. | O arquivo não compila no estado publicado. |
| `base_prepare` retira apenas o intervalo de teste e conserva períodos futuros no treino. | Uma previsão histórica pode aprender com anos posteriores. |
| A prevalência do bairro é calculada no conjunto de treino que contém futuro. | O vazamento também alcança uma das variáveis mais importantes. |
| Os percentis de surto usam os outros anos, inclusive posteriores ao ano avaliado. | Os limiares não representam o que seria conhecido na data da previsão. |
| Não existe pipeline completo do SINAN bruto até o CSV analítico. | A definição exata de `dengue_diagnosis` não é reproduzível a partir dos scripts. |
| O esboço para Indaiatuba está incompleto. | Não há adaptação funcional pronta para outro município. |
| A soma de vizinhos usa limites de fatia potencialmente deslocados em uma posição. | O cálculo deve ser reimplementado e testado, não copiado. |
| Exceções abrem `IPython.embed()`. | Um job automatizado pode ficar bloqueado aguardando interação. |
| Há chamadas a `DataFrame.append`, removidas do pandas atual. | O código exige modernização. |
| O ambiente declara Python 3.6 e 428 dependências. | Reprodução e manutenção são frágeis. |
| Não há testes, modelo serializado, API, monitoramento ou licença explícita. | O material é um protótipo acadêmico, não um componente de produção. |

O uso de anos futuros no treino é descrito pelo próprio artigo como validação cruzada por ano. Isso pode responder a uma pergunta retrospectiva de generalização, mas não mede o desempenho de uma implantação que só conhece o passado.

## 4. O que os dados abertos já oferecem

O [Portal de Dados Abertos do SUS](https://dadosabertos.saude.gov.br/dataset/arboviroses-dengue) disponibiliza arquivos anuais de 2000 a 2026 e informa atualização semanal. O dicionário oficial atual possui 121 campos. A base histórica consolidada pelo Denguinhos apresenta 197 colunas porque a união preserva variações de esquema entre os anos; isso não significa que todos os anos preencham todos os campos.

### 4.1 Grupos de atributos do SINAN/Dengue

| Grupo | Campos principais | Descrição e uso analítico |
|---|---|---|
| Identificação da notificação | `TP_NOT`, `ID_AGRAVO` | Tipo de notificação e agravo/CID registrado. |
| Tempo epidemiológico | `DT_SIN_PRI`, `SEM_PRI` | Início dos sintomas e semana epidemiológica; referência preferencial para curva de ocorrência. |
| Tempo operacional | `DT_NOTIFIC`, `SEM_NOT`, `NU_ANO`, `DT_DIGITA`, `DT_ENCERRA` | Notificação, digitação e encerramento; permitem medir atualização e atraso. |
| Local da notificação | `SG_UF_NOT`, `ID_MUNICIP`, `ID_REGIONA`, `ID_UNIDADE` | Onde está a unidade que notificou; mede carga assistencial, não necessariamente residência ou transmissão. |
| Residência | `SG_UF`, `ID_MN_RESI`, `ID_RG_RESI`, `ID_PAIS` | Onde o paciente reside; é a referência recomendada pelo Ministério da Saúde para incidência. |
| Provável infecção | `COUFINF`, `COPAISINF`, `COMUNINF`, `TPAUTOCTO` | Local provável de infecção e indicação de autoctonia; preenchimento depende da investigação. |
| Demografia | `ANO_NASC`, `NU_IDADE_N`, `CS_SEXO`, `CS_GESTANT`, `CS_RACA`, `CS_ESCOL_N`, `ID_OCUPA_N` | Perfil do registro. A idade codifica unidade e valor, portanto não deve ser tratada como inteiro comum. |
| Sinais e sintomas | `FEBRE`, `MIALGIA`, `CEFALEIA`, `EXANTEMA`, `VOMITO`, `NAUSEA`, `DOR_COSTAS`, `CONJUNTVIT`, `ARTRITE`, `ARTRALGIA`, `PETEQUIA_N`, `LEUCOPENIA`, `LACO`, `DOR_RETRO` | Caracterização clínica; códigos 1/2 significam sim/não e nulo não deve virar “não”. |
| Condições preexistentes | `DIABETES`, `HEMATOLOG`, `HEPATOPAT`, `RENAL`, `HIPERTENSA`, `ACIDO_PEPT`, `AUTO_IMUNE` | Comorbidades registradas na investigação. |
| Exames e sorotipo | `DT_SORO`, `RESUL_SORO`, `DT_NS1`, `RESUL_NS1`, `DT_VIRAL`, `RESUL_VI_N`, `DT_PCR`, `RESUL_PCR_`, `SOROTIPO`, `HISTOPA_N`, `IMUNOH_N` | Resultados laboratoriais e sorotipo, sujeitos a indicação e cobertura. |
| Gravidade e hospitalização | `HOSPITALIZ`, `DT_INTERNA`, campos `ALRM_*`, `GRAV_*`, `DT_ALRM`, `DT_GRAV` | Hospitalização, sinais de alarme e dengue grave. Muitos campos são condicionais à classificação. |
| Classificação e evolução | `CLASSI_FIN`, `CRITERIO`, `EVOLUCAO`, `DT_OBITO`, `DT_ENCERRA` | Define confirmação, descarte, critério e desfecho. É indispensável para construir o alvo. |
| Qualidade e fluxo | `NDUPLIC_N`, `TP_SISTEMA`, `CS_FLXRET`, `FLXRECEBI`, `MIGRADO_W` | Duplicidade, sistema de origem e fluxo de retorno. `NDUPLIC_N=2` não deve ser computado na incidência. |

### 4.2 Três localizações que não podem ser confundidas

| Pergunta | Campo recomendado |
|---|---|
| Onde a unidade registrou o caso? | `ID_MUNICIP` |
| Onde o paciente residia? | `ID_MN_RESI` |
| Onde ocorreu a provável infecção? | `COMUNINF`, em conjunto com `TPAUTOCTO` e a investigação |

O modelo municipal inicial deve normalmente agregar por residência. A análise de transmissão pode usar município provável de infecção, mas precisa declarar a cobertura e o volume ignorado.

### 4.3 O que não existe regularmente no conjunto público

- bairro de residência padronizado;
- distrito sanitário municipal;
- setor censitário da residência;
- endereço ou coordenada do caso;
- população e densidade demográfica;
- clima;
- geometria e vizinhança territorial;
- índices LIRAa/LIA;
- quantidade histórica de estabelecimentos por território;
- casos de zika e chikungunya já agregados como atributos da dengue;
- produção das visitas dos ACE e dados do PEC.

O Ministério da Saúde informa que o menor nível de desagregação dos dados abertos do SINAN é o município. Logo, uma malha de bairros ou setores não resolve a ausência da localização de cada notificação.

## 5. Comparação atributo por atributo com o artigo

| Atributo do artigo | O SINAN/Dengue aberto tem? | Fonte necessária | Situação para o Denguinhos |
|---|---|---|---|
| Casos de dengue no território | Parcial | SINAN; regra de caso e agregação | Disponível por município; bairro exige fonte municipal. |
| Defasagens `t-1`, `t-2`, `t-3` | Derivável | Série já fechada por período | Implementar sem atravessar o corte temporal. |
| Prevalência histórica | Derivável | Série de dengue e população | Calcular apenas no treino; avaliar incidência em vez de contagem bruta. |
| Casos nos vizinhos | Não diretamente | Casos intramunicipais + polígonos/adjacência | Inviável por bairro só com SINAN aberto. |
| Precipitação | Não | [INMET/BDMEP](https://portal.inmet.gov.br/dadoshistoricos/) ou dado em grade | Exige política para estação, distância, falhas e agregação. |
| Temperatura | Não | INMET/BDMEP ou dado em grade | Mesmo cuidado da precipitação. |
| Umidade | Não | INMET/BDMEP ou dado em grade | Verificar cobertura histórica de cada estação. |
| Zika e chikungunya | Não dentro da base de dengue | Bases próprias do SINAN | Integrar e alinhar território, período e regra de caso. |
| Densidade demográfica | Não | IBGE e população/área | Disponível por município e recortes censitários, com ano de referência. |
| Estabelecimentos de saúde | Apenas unidade notificadora do registro | [CNES](https://cnes.datasus.gov.br/pages/downloads/arquivosBaseDados.jsp) | Construir estoque histórico por competência e tipo de estabelecimento. |
| LIRAa | Não | [LIRAa/LIA](https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/a/arboviroses/liraa) e município | Cobertura e periodicidade variam; não presumir valor mensal. |
| Bairro e geometria | Não no registro aberto | Prefeitura e [malhas do IBGE](https://www.ibge.gov.br/geociencias/organizacao-do-territorio/malhas-territoriais/26565-malhas-de-setores-censitarios-divisoes-intramunicipais.html) | A geometria está disponível, mas o vínculo caso–bairro não. |
| Alvo “surto” | Não pronto | Regra epidemiológica versionada | Calibrar por município e somente com treino; percentis do artigo são referência, não norma. |

## 6. Definição do alvo do Denguinhos

Antes do treinamento, o produto precisa decidir qual contagem será prevista. Opções diferentes não são intercambiáveis:

1. **notificações:** todos os registros recebidos;
2. **casos prováveis:** suspeitos, excluídos os descartados, conforme orientação do portal;
3. **casos confirmados:** classificação final compatível, com regra histórica versionada;
4. **casos por início dos sintomas:** melhor aproximação da curva epidemiológica, mas sujeita a atraso;
5. **casos por notificação:** melhor aproximação da carga conhecida pelo sistema em cada data;
6. **incidência:** casos elegíveis divididos pela população do território e período.

Recomendação: manter pelo menos duas séries. A série por `DT_SIN_PRI` representa ocorrência epidemiológica; a série por `DT_NOTIFIC`/`DT_DIGITA` representa o que estava disponível operacionalmente e sustenta o nowcasting. Cada execução deve registrar a data de corte da base.

O arquivo `ANO_ARQUIVO` criado pelo pipeline informa a origem anual do recurso, não a data do evento. Ele não deve ser o eixo temporal do modelo.

## 7. Aderência ao modelo de negócio

O [modelo de negócio](../possiveis_modelos_de_negocios.md) define um SaaS híbrido B2G com implantação, licença recorrente e serviços complementares.

| Componente comercial | Contribuição do artigo | O que falta para o produto |
|---|---|---|
| Setup e onboarding | Demonstra quais fontes e atributos precisam ser integrados. | Contrato de dados municipal, saneamento, geografia local, regras de caso, qualidade e capacitação. |
| Licença SaaS | Demonstra valor de previsão e explicação. | Jobs recorrentes, modelos versionados, API, multitenancy, segurança, monitoramento, SLA e interface operacional. |
| Atualização dos modelos | Oferece uma configuração CatBoost de referência. | Validação temporal, retreinamento controlado, aprovação, rollback e monitoramento de deriva. |
| Nowcasting | Não implementa. | Modelar atraso de notificação com data de corte real. |
| Clusterização espacial | Usa vizinhança, mas não identifica hotspots com DBSCAN/SaTScan. | Pipeline geoespacial e método de hotspot separado. |
| Relatórios avançados | Gera figuras acadêmicas e SHAP. | Relatórios auditáveis, snapshots, linguagem operacional e métricas de impacto. |
| Integrações customizadas | Integra fontes em um CSV já pronto. | Conectores repetíveis com proveniência, contratos e tratamento de falhas. |
| Outras arboviroses | Usa zika/chikungunya como atributos. | Targets, regras, validações e módulos próprios para cada agravo. |

### 7.1 Posicionamento comercial recomendado

Não prometer “previsão por bairro usando apenas dados públicos”. A oferta deve ser separada em níveis:

- **Plano municipal com dados abertos:** previsão e nowcasting por município;
- **Plano territorial com implantação:** bairro/distrito quando o cliente fornece localização intramunicipal confiável;
- **Plano operacional integrado:** inclui LIRAa, produção ACE, PEC autorizado, tarefas, alertas e avaliação de impacto.

Isso alinha a unidade de valor ao porte do município, à quantidade de territórios/agentes e ao esforço real de integração.

## 8. Aderência aos requisitos do Denguinhos

| Requisito | Aderência do artigo | Lacuna principal |
|---|---|---|
| RF-001 — ingestão multifonte | Conceitual | Não há conector operacional nem atualização incremental auditável. |
| RF-005 — previsão por bairro | Forte no experimento | O horizonte do produto é 2–4 semanas; bairro depende de dados municipais. |
| RF-006 — hotspots históricos | Fraca | Vizinhança não equivale a clusterização espacial. |
| RF-007 — nowcasting | Ausente | O artigo usa base consolidada e não simula atraso de notificação. |
| RF-008 — mapa de risco | Parcial | Há mapas de avaliação, não mapa web operacional e versionado. |
| RF-009 — recomendações | Parcial | SHAP explica previsão, mas não define ou acompanha ação. |
| RF-010 — módulo epidemiológico | Parcial | Há métricas e notebook; faltam dados reais integrados, exportação e calibração. |
| RF-012 — rota inteligente | Ausente | O artigo não otimiza cobertura, rota ou tarefas de ACE. |
| RF-016 — Saúde Única | Parcial | Cruza clima e epidemiologia, mas não PEC/APS e produção territorial do produto. |
| RF-033 — entrega das predições | Ausente | Não há agenda, snapshot, política de visibilidade ou idempotência. |
| RNF-003 — milhões de registros | Ausente | O conjunto analítico tem 16.960 linhas. |
| RNF-006 — finalidade e privacidade | Não demonstrada | A base está agregada; não há fluxo operacional identificado/multicliente. |
| RNF-012 — viés e falsos alertas | Parcial | Há matriz de confusão, mas não calibração contínua ou análise por subgrupos/territórios. |
| RNF-014 — lacunas e subnotificação | Fraca | Ausências estão presentes, mas não há política produtiva de cobertura e incerteza. |

## 9. Arquitetura recomendada

```text
Camada bronze
SINAN bruto + INMET + IBGE + CNES + LIRAa + dados municipais
                              ↓
Camada prata
esquemas normalizados, proveniência, competência, qualidade e data de corte
                              ↓
Camada ouro
território × semana epidemiológica, alvos e atributos sem informação futura
                              ↓
Treino e avaliação assíncronos
baselines + CatBoost/contagens + validação walk-forward + SHAP
                              ↓
Registro de modelos
artefato, esquema, período, métricas, limiar, versão e limitações
                              ↓
Inferência e publicação
snapshot territorial + API autorizada + mapas + alertas + tarefas
```

Os 32,5 milhões de registros não devem ser carregados integralmente em pandas. A preparação atual em Parquet/DuckDB é adequada para análise e deve evoluir para tabelas agregadas semanais. Treinamento usa a camada ouro, não o CSV bruto de 10,47 GiB.

## 10. Validação exigida para o produto

### 10.1 Separação temporal

Usar walk-forward prospectivo:

```text
treino até 2021 → validação em 2022
treino até 2022 → validação em 2023
treino até 2023 → validação em 2024
```

Dentro de cada corte, calcular novamente prevalência, imputação, normalização, limiares e seleção de variáveis. Nenhum dado posterior pode participar dessas etapas.

### 10.2 Simulação da informação disponível

Para cada data histórica de previsão, usar somente notificações que já teriam sido digitadas naquele momento. Isso exige snapshots históricos ou simulação por `DT_DIGITA`. Sem essa etapa, a avaliação usa retrospectivamente casos tardios e superestima a capacidade operacional.

### 10.3 Baselines mínimos

- último valor observado;
- média sazonal da mesma semana/mês;
- SARIMA ou modelo temporal equivalente;
- regressão Poisson ou binomial negativa;
- CatBoost com objetivo apropriado para contagem;
- classificador/calibrador de surto, se a decisão exigir probabilidade.

### 10.4 Métricas

Manter MAE e RMSE, mas não depender apenas delas. Avaliar:

- recall de surtos e falsos alertas por território;
- precisão, F1 e curva precisão-revocação;
- calibração das probabilidades;
- erro de incidência e de magnitude do pico;
- antecedência do alerta;
- desempenho por porte, cobertura e volume histórico;
- estabilidade entre anos epidêmicos e não epidêmicos;
- utilidade operacional validada com epidemiologistas.

SHAP explica a contribuição matemática das variáveis; não prova causalidade e não deve gerar recomendação automática de intervenção.

## 11. Plano de implementação recomendado

1. Definir caso provável, confirmado, descartado, duplicado e data de referência.
2. Construir tabela municipal semanal usando `ID_MN_RESI`, `DT_SIN_PRI`, `DT_NOTIFIC` e `DT_DIGITA`.
3. Integrar população do IBGE e calcular incidência.
4. Medir atraso, completude, mudanças de esquema e cobertura por município/ano.
5. Implementar baselines e validação walk-forward.
6. Integrar INMET e medir o ganho incremental fora da amostra.
7. Implementar CatBoost e explicações somente depois dos baselines.
8. Criar nowcasting separado do forecast.
9. Obter dados municipais de bairro/distrito e validar sua cobertura antes de ativar RF-005 nessa escala.
10. Integrar LIRAa, CNES, zika/chikungunya e produção ACE como fontes versionadas.
11. Publicar snapshots com horizonte, corte, modelo, qualidade, limitações e política de visibilidade.
12. Monitorar deriva, falsos alertas e impacto sem transformar correlação em causalidade.

## 12. Decisão recomendada

O artigo deve ser tratado como referência de desenho experimental, não como dependência do produto. O Denguinhos deve reimplementar o pipeline com código próprio, testes e validação prospectiva.

A sequência comercial e técnica mais segura é:

1. entregar análise e previsão municipal com dados abertos;
2. provar ganho sobre baselines e documentar incerteza;
3. oferecer implantação territorial para municípios com dados por bairro/distrito;
4. conectar previsão a alertas, decisões e tarefas sem substituir a cobertura oficial nem a autoridade sanitária;
5. usar a integração e a governança operacional como principal diferencial do SaaS.

## Fontes principais

- [Artigo em PDF](https://users.ime.usp.br/~kon/papers/Ai4Health_2022___Dengue.pdf)
- [Registro bibliográfico e DOI](https://doi.org/10.1109/CCGrid54584.2022.00114)
- [Repositório original](https://gitlab.com/interscity/health/dengue-prediction)
- [SINAN/Dengue — Portal de Dados Abertos do SUS](https://dadosabertos.saude.gov.br/dataset/arboviroses-dengue)
- [Dicionário oficial do SINAN/Dengue](https://s3.sa-east-1.amazonaws.com/ckan.saude.gov.br/SINAN/Dengue/dic_dados_dengue.pdf)
- [Dados históricos do INMET](https://portal.inmet.gov.br/dadoshistoricos/)
- [Malhas de setores, distritos e bairros do IBGE](https://www.ibge.gov.br/geociencias/organizacao-do-territorio/malhas-territoriais/26565-malhas-de-setores-censitarios-divisoes-intramunicipais.html)
- [Estimativas populacionais do IBGE](https://www.ibge.gov.br/estatisticas/sociais/populacao/9103-estimativas-de-populacao.html)
- [Downloads do CNES](https://cnes.datasus.gov.br/pages/downloads/arquivosBaseDados.jsp)
- [LIRAa/LIA — Ministério da Saúde](https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/a/arboviroses/liraa)
- [Documento de requisitos do Denguinhos](../documento_de_requisitos.md)
- [Modelo de negócio do Denguinhos](../possiveis_modelos_de_negocios.md)
