# Resumo — Predicting Dengue Outbreaks with Explainable Machine Learning

## Referência

ALEIXO, Robson et al. *Predicting Dengue Outbreaks with Explainable Machine Learning*. AI4Health/CCGrid 2022, p. 940–947. DOI: <https://doi.org/10.1109/CCGrid54584.2022.00114>.

Artigo: <https://users.ime.usp.br/~kon/papers/Ai4Health_2022___Dengue.pdf>

Código-fonte disponibilizado pelos autores: <https://gitlab.com/interscity/health/dengue-prediction>

Análise comparativa com os dados abertos, o modelo de negócio e os requisitos do Denguinhos: [analiseComparativaArtigoPrevisaoDengue.md](analiseComparativaArtigoPrevisaoDengue.md)

Análise do que pode ser reaproveitado do experimento da USP e comparação entre modelo municipal, global e híbrido: [fontesDadosReproducaoArtigoPrevisaoDengue.md](fontesDadosReproducaoArtigoPrevisaoDengue.md)

Cópia auditada dos scripts Python do commit consultado: [codigoOriginalPrevisaoDengue/ORIGEM.md](codigoOriginalPrevisaoDengue/ORIGEM.md)

## Objetivo

O artigo apresenta um método de aprendizado de máquina para prever a quantidade mensal de casos de dengue em cada bairro do município do Rio de Janeiro. As previsões são feitas com antecedência de um ou três meses.

Além de estimar o número de casos, o trabalho procura identificar surtos e explicar quais variáveis mais influenciaram cada previsão. A finalidade é apoiar gestores públicos na antecipação de ações de vigilância e controle da dengue.

## Dados utilizados

Os autores construíram uma base mensal por bairro reunindo dados de diferentes fontes entre 2011 e 2020:

- casos de dengue, zika e chikungunya do SINAN;
- temperatura, precipitação e umidade do INMET;
- população e densidade demográfica;
- estabelecimentos e serviços de saúde do CNES;
- índices de infestação do mosquito obtidos pelo LIRAa;
- limites, centroides e relações de vizinhança entre os bairros.

O modelo utiliza como variáveis principais:

- casos de dengue nos três meses anteriores;
- prevalência histórica da dengue no bairro;
- soma de casos nos bairros vizinhos;
- temperatura, chuva e umidade;
- casos anteriores de zika e chikungunya;
- densidade demográfica;
- quantidade de unidades de saúde;
- índice LIRAa.

## Preparação dos dados

Os registros das diferentes fontes foram consolidados em uma tabela na qual cada linha representa um bairro em determinado mês. Foram criadas variáveis temporais, como `t-1`, `t-2` e `t-3`, correspondentes à quantidade de casos nos meses anteriores.

Também foi construída uma variável espacial com a soma dos casos registrados nos bairros vizinhos. Essa informação busca representar a propagação territorial da doença entre áreas próximas.

## Modelos avaliados

### CatBoost

O método principal utiliza o CatBoost, um algoritmo baseado em árvores de decisão com *gradient boosting*. O modelo aprende relações não lineares entre o histórico epidemiológico, as condições ambientais e as características territoriais.

Os principais parâmetros relatados são:

- taxa de aprendizado igual a `0,1`;
- *boosting* do tipo `Plain`;
- *bootstrap* `Bernoulli`;
- política de crescimento `Lossguide`.

### SARIMA

O SARIMA foi adotado como referência estatística. Esse modelo utiliza exclusivamente a estrutura temporal da série, incluindo tendências e sazonalidade, sem explorar da mesma maneira os fatores ambientais e espaciais usados pelo CatBoost.

## Identificação de surtos

As previsões numéricas também foram convertidas em categorias de risco. Os autores empregaram percentis da distribuição histórica de casos para separar períodos comuns de períodos com surtos mais intensos.

Essa estratégia permite avaliar não apenas a proximidade entre o número previsto e o número real, mas também se o sistema consegue alertar sobre meses epidemiologicamente críticos.

## Avaliação

Os modelos foram avaliados com métricas de regressão, como:

- erro absoluto médio — MAE;
- raiz do erro quadrático médio — RMSE;
- erro percentual absoluto médio — MAPE;
- coeficiente de determinação — R².

Para a detecção de surtos, foram utilizadas métricas como precisão, revocação e F-score.

## Resultados principais

O CatBoost apresentou resultados superiores ao SARIMA na maior parte das avaliações, sobretudo nas previsões com três meses de antecedência.

As medianas apresentadas no artigo incluem:

| Modelo | Horizonte | MAE | RMSE | MAPE | R² |
|---|---:|---:|---:|---:|---:|
| CatBoost | 1 mês | 3 | 6 | 0,77 | 0,47 |
| CatBoost | 3 meses | 3 | 10 | 1,20 | 0,38 |
| SARIMA | 1 mês | 3 | 8 | 0,65 | 0,11 |
| SARIMA | 3 meses | 4 | 18 | 0,96 | -0,16 |

Na previsão de três meses, o modelo conseguiu reconhecer a maioria dos períodos sem surto e detectar uma parcela relevante dos surtos. O artigo relata aproximadamente:

- 97% de acerto para situações sem surto;
- detecção de 76% dos surtos;
- 86% de ocorrência de algum surto quando o modelo indicou a categoria mais grave.

O modelo, entretanto, apresentou dificuldade para estimar a magnitude de surtos muito grandes. Em períodos com poucos casos, também ocorreram previsões acima do valor observado.

## Explicabilidade com SHAP

O trabalho utiliza SHAP para explicar a contribuição de cada variável nas previsões do CatBoost. A técnica permite produzir:

- explicações globais sobre as variáveis mais importantes para o modelo;
- explicações locais para uma previsão específica;
- análises da interação entre variáveis.

As variáveis que mais influenciaram o modelo foram, em geral:

1. casos de dengue no mês anterior;
2. prevalência histórica do bairro;
3. precipitação;
4. casos nos bairros vizinhos;
5. temperatura;
6. casos registrados dois e três meses antes;
7. LIRAa;
8. registros de zika e chikungunya.

O SHAP explica como o modelo chegou a determinado resultado, mas não demonstra uma relação causal. Uma variável importante para a previsão não deve ser interpretada automaticamente como causa do surto.

## Contribuições do trabalho

As principais contribuições do artigo são:

- previsão de dengue em escala intramunicipal;
- combinação de informações temporais, ambientais e espaciais;
- uso dos casos de bairros vizinhos;
- comparação com um modelo tradicional de séries temporais;
- explicações globais e locais por meio de SHAP;
- possibilidade de antecipar ações de saúde pública em áreas específicas.

## Limitações

O artigo e seu código apresentam limitações que devem ser consideradas antes de uma reprodução:

- os resultados foram obtidos especificamente para o Rio de Janeiro;
- o modelo tende a subestimar surtos muito grandes;
- bairros com poucos casos produzem séries esparsas e mais difíceis de prever;
- a qualidade depende da integração de várias fontes além do SINAN;
- o código utiliza Python e dependências antigas;
- o repositório contém trechos fortemente acoplados aos arquivos do Rio de Janeiro;
- não foi encontrado um artefato de modelo previamente treinado para uso direto;
- o repositório não apresenta uma licença de software explícita;
- a separação entre treino e teste permite que períodos futuros participem do treinamento de previsões passadas, o que pode produzir vazamento temporal.

Para uma avaliação que represente uso real, os dados de treinamento devem sempre ser anteriores ao período previsto. Uma estratégia adequada seria treinar até o final de um ano e avaliar exclusivamente o ano seguinte, repetindo o processo progressivamente.

## Disponibilidade e reprodutibilidade

Os autores disponibilizaram código, dados intermediários, previsões, valores SHAP, figuras e um *notebook*. Entretanto, o material deve ser tratado como protótipo acadêmico, não como serviço pronto para produção.

É possível reproduzir a abordagem conceitual, mas seria necessário:

1. modernizar e reduzir as dependências;
2. corrigir conflitos e scripts incompletos;
3. reconstruir a preparação dos dados;
4. substituir os arquivos territoriais do Rio pelos da região estudada;
5. eliminar vazamentos temporais;
6. criar testes automatizados;
7. versionar os dados e os modelos;
8. validar o desempenho na população e no território de destino.

## Síntese

O artigo demonstra que dados epidemiológicos, climáticos, demográficos e espaciais podem ser combinados para prever surtos de dengue em bairros. O CatBoost obteve desempenho superior ao SARIMA em vários cenários, enquanto o SHAP tornou as previsões mais interpretáveis.

Sua maior contribuição não é um modelo universal já treinado, mas um pipeline de referência: consolidar dados por território e período, criar variáveis históricas e de vizinhança, treinar um modelo de previsão, comparar com baselines e explicar os resultados. A aplicação em outra cidade exige reconstrução da base, validação temporal rigorosa e adaptação às características epidemiológicas e territoriais locais.

## Auditoria do dicionário público do SINAN

O dicionário oficial analisado está disponível em:

<https://s3.sa-east-1.amazonaws.com/ckan.saude.gov.br/SINAN/Dengue/dic_dados_dengue.pdf>

Entre os campos úteis para uma série epidemiológica estão:

| Campo | Significado | Uso possível |
|---|---|---|
| `dt_notific` | Data da notificação | Série operacional por data conhecida pelo sistema |
| `sem_not` | Semana epidemiológica da notificação | Agregação semanal |
| `dt_sin_pri` | Data dos primeiros sintomas | Aproximação do início clínico |
| `sem_pri` | Semana dos primeiros sintomas | Curva epidemiológica por início dos sintomas |
| `id_mn_resi` | Município de residência | Carga associada à população residente |
| `id_municip` | Município da unidade notificadora | Carga de atendimento e notificação |
| `comuninf` | Provável município de infecção | Análise do local provável de transmissão |
| `tpautocto` | Indicação de caso autóctone | Separação entre transmissão local e importada |
| `classi_fin` | Classificação final | Seleção de confirmados, descartados e inconclusivos |
| `criterio` | Critério de confirmação | Controle de qualidade e análise de sensibilidade |
| `sorotipo` | Sorotipo identificado | Caracterização epidemiológica, quando preenchido |
| `nduplic_n` | Marcação de duplicidade | Exclusão de registros que não devem ser contados |

É essencial não confundir três localizações:

- **município de notificação:** onde está a unidade que registrou o caso;
- **município de residência:** onde o paciente reside;
- **provável município de infecção:** onde a transmissão pode ter ocorrido.

A variável territorial deve ser escolhida de acordo com a pergunta. Para estimar a incidência entre residentes, a referência inicial tende a ser `id_mn_resi`. Para estudar transmissão local, também devem ser consideradas a autoctonia e a provável fonte de infecção.

### Limite geográfico do conjunto público

O dicionário público não fornece de maneira regular:

- bairro de residência padronizado;
- código do setor censitário da residência;
- coordenadas residenciais;
- endereço que possa ser geocodificado.

Consequentemente:

| Escala de previsão | Viabilidade apenas com o SINAN público |
|---|---|
| Unidade Federativa | Viável |
| Município | Viável |
| Bairro | Não garantida |
| Setor censitário | Inviável |

Não é metodologicamente válido distribuir artificialmente os casos municipais entre bairros ou setores. A malha territorial informa onde essas áreas estão, mas não permite descobrir a localização intramunicipal de uma notificação que contém somente o município.

## Por que o artigo conseguiu prever por bairro

O repositório da pesquisa contém uma base intermediária já enriquecida. Nela aparecem, entre outros elementos:

- nome e código do bairro;
- centroides geográficos;
- limites territoriais;
- população e densidade demográfica;
- estabelecimentos de saúde;
- clima mensal;
- dengue, zika e chikungunya;
- LIRAa;
- relações de vizinhança entre bairros.

Portanto, a granularidade do artigo não veio somente do arquivo público de dengue. Houve uma etapa anterior de integração territorial que precisa ser reconstruída para qualquer nova cidade.

Para prever por bairro, será necessário obter da vigilância municipal pelo menos uma destas alternativas:

- casos já agregados por bairro e período;
- bairro de residência padronizado;
- código territorial confiável;
- coordenadas anonimizadas;
- endereço tratado e geocodificado em ambiente autorizado.

Dados individuais de localização não devem ser publicados nem enviados ao frontend. Resultados em áreas com poucos registros também precisam de supressão ou agregação para evitar reidentificação.

## Auditoria técnica do repositório da pesquisa

O material público é valioso para compreender o experimento, mas não constitui uma aplicação pronta para implantação.

### Conteúdo disponível

- scripts de preparação e treinamento;
- implementação do CatBoost;
- baseline SARIMA;
- cálculo de casos nos bairros vizinhos;
- geração de valores SHAP;
- dados intermediários do Rio de Janeiro;
- previsões e figuras utilizadas na pesquisa;
- um *notebook* para visualização das explicações.

### Ausências e problemas encontrados

- não há artefato CatBoost treinado em formato como CBM, Pickle, Joblib ou ONNX;
- não há API de inferência;
- não há testes automatizados;
- não há pipeline operacional de atualização dos dados;
- o ambiente declarado usa Python 3.6 e dependências antigas;
- o `requirements.txt` contém centenas de pacotes, inclusive componentes específicos do sistema operacional;
- o arquivo principal contém marcadores de conflito do Git não resolvidos;
- a vizinhança dos bairros depende de uma planilha específica;
- existem rotinas incompletas de transformação para outra cidade;
- o código está fortemente acoplado a nomes, arquivos e estruturas do Rio de Janeiro;
- não foi encontrada licença explícita para reutilização do software.

A visibilidade pública do repositório não equivale a uma licença de reutilização. Antes de incorporar trechos substanciais do código, deve-se solicitar aos autores uma licença ou autorização expressa.

## Risco de vazamento temporal

O problema metodológico mais importante encontrado está na separação entre treino e teste. O código remove do treinamento os meses que serão previstos, mas pode conservar meses posteriores ao intervalo avaliado.

Exemplo inadequado:

```text
Previsão simulada: março de 2017
Treinamento: inclui observações de 2018, 2019 e 2020
```

Isso permite que o modelo aprenda com o futuro e faz a avaliação parecer melhor do que uma previsão prospectiva real.

Para uma reconstrução rigorosa, deve ser usada validação temporal progressiva:

```text
Treino até dezembro de 2021 → teste em 2022
Treino até dezembro de 2022 → teste em 2023
Treino até dezembro de 2023 → teste em 2024
```

O corte temporal deve ser respeitado em todas as etapas, inclusive:

- cálculo de médias e prevalências;
- normalização das variáveis;
- definição dos limiares de surto;
- seleção de variáveis;
- ajuste de hiperparâmetros;
- imputação de valores ausentes.

Também é necessário simular o atraso de notificação. Uma base consolidada meses depois contém registros que ainda não estariam disponíveis no momento real da previsão.

## Adaptação para cidades do interior

Um modelo treinado no Rio de Janeiro não deve ser transferido diretamente para cidades do interior. As localidades podem diferir em:

- tamanho populacional;
- densidade urbana;
- quantidade de bairros;
- mobilidade entre territórios;
- volume e regularidade das notificações;
- cobertura das estações meteorológicas;
- capacidade de vigilância e diagnóstico;
- sazonalidade e incidência de dengue;
- preenchimento dos campos do SINAN.

Em municípios menores, séries mensais por bairro podem conter muitos zeros. Treinar um modelo independente para cada bairro reduziria ainda mais a quantidade de exemplos. Uma alternativa mais robusta é utilizar um modelo agrupado, treinado com todos os territórios, incluindo cidade e bairro como identificadores ou características.

### Etapa inicial recomendada

Com o SINAN público, já é possível construir uma primeira previsão municipal contendo:

- contagem de casos por mês ou semana;
- incidência por 100 mil habitantes;
- defasagens de 1, 2, 3, 6 e 12 períodos;
- médias móveis;
- mês ou semana epidemiológica;
- proporção de confirmados;
- casos autóctones;
- hospitalizações e casos graves;
- sorotipo, quando houver cobertura suficiente;
- registros de zika e chikungunya, se importados separadamente.

O primeiro horizonte recomendado é de um mês. A previsão de três meses deve ser acrescentada depois que o modelo de um mês estiver validado.

### Modelos que devem ser comparados

O CatBoost não deve ser avaliado isoladamente. A comparação mínima deve conter:

1. persistência — repetir o valor do último período;
2. média histórica sazonal;
3. SARIMA ou outro modelo temporal equivalente;
4. CatBoost para contagens, avaliando objetivo Poisson ou Tweedie;
5. classificador separado para risco de surto, se essa for uma saída necessária.

Em séries muito esparsas, pode ser útil uma abordagem em duas etapas:

1. estimar a probabilidade de ocorrência ou surto;
2. estimar a quantidade de casos condicionada à ocorrência.

## Fontes adicionais necessárias

Para aproximar a reprodução do artigo, o SINAN precisa ser combinado com outras fontes.

### Clima

O Banco de Dados Meteorológicos do INMET oferece séries de temperatura, precipitação e umidade:

<https://portal.inmet.gov.br/servicos/bdmep-dados-historicos>

Se uma cidade não possuir estação, deve-se documentar a estação substituta, sua distância e as limitações. Outra possibilidade é utilizar dados climáticos em grade, desde que sua resolução e método de extração sejam registrados.

### População e território

O IBGE disponibiliza malhas de municípios, bairros, distritos e setores censitários, além de agregados populacionais:

<https://www.ibge.gov.br/geociencias/organizacao-do-territorio/malhas-territoriais/2971-np-malhas-de-setores-censitarios-divisoes-intramunicipais/26565-malhas-de-setores-censitarios-divisoes-intramunicipais.html>

As malhas permitem construir relações de contiguidade entre territórios, mas não substituem a localização dos casos.

### Unidades de saúde e vetor

- o CNES pode fornecer quantidade e tipos de estabelecimentos de saúde;
- o LIRAa pode fornecer indicadores de infestação do mosquito;
- dados do LIRAa e de bairros possivelmente precisarão ser solicitados às prefeituras ou secretarias municipais.

## Arquitetura sugerida para uma implementação

A previsão epidemiológica pode ser organizada como um pipeline independente:

```text
SINAN + INMET + IBGE + CNES + dados municipais
                         ↓
                 ETL epidemiológico
                         ↓
              PostgreSQL com PostGIS
                         ↓
        serviço Python de treinamento e previsão
              CatBoost + SHAP + baselines
                         ↓
                API de consulta
                         ↓
             mapas, séries e explicações
```

Uma divisão possível de responsabilidades seria:

- **PostgreSQL/PostGIS:** territórios, observações, versões dos dados e previsões;
- **armazenamento de objetos:** arquivos brutos e artefatos treinados;
- **serviço Python:** transformação, treinamento, previsão e SHAP;
- **worker agendado:** importação, validação e retreinamento;
- **API de consulta:** autenticação e exposição controlada dos resultados;
- **interface de visualização:** mapas, séries temporais, alertas e explicações.

Os treinamentos não devem ocorrer durante uma requisição HTTP. Eles precisam ser executados como tarefas assíncronas e produzir modelos versionados.

## Plano de reconstrução

Uma reprodução confiável pode seguir estas etapas:

1. definir oficialmente as cidades e o período histórico;
2. auditar cobertura, duplicidades, classificação e atraso do SINAN;
3. construir a série municipal sem informação futura;
4. adicionar população e calcular incidência;
5. implementar baselines simples;
6. adicionar clima e avaliar o ganho real;
7. treinar CatBoost com validação temporal progressiva;
8. calibrar limiares de surto somente com dados de treino;
9. gerar explicações SHAP e intervalos de incerteza;
10. obter e auditar dados municipais de bairro;
11. criar a camada de vizinhança usando polígonos territoriais;
12. avaliar se o volume de casos sustenta previsões por bairro;
13. considerar setores censitários somente com localização autorizada;
14. empacotar dados, modelo, métricas e proveniência por versão;
15. disponibilizar os resultados com explicações SHAP sem apresentá-las como evidência causal.

## Conclusão consolidada

O modelo do artigo pode ser reconstruído conceitualmente, mas não pode ser simplesmente baixado e utilizado em outro município. O código disponível funciona principalmente como registro de um experimento acadêmico voltado ao Rio de Janeiro.

Com o conjunto público do SINAN, uma previsão por município é viável. Previsões por bairro dependem de uma fonte intramunicipal adicional e de uma auditoria de cobertura. Previsões por setor censitário não são sustentadas pelos campos públicos analisados e exigiriam georreferenciamento autorizado, além de controles de privacidade.

Para cidades do interior, a estratégia mais defensável é começar com um modelo municipal de um mês, compará-lo com baselines simples, incluir clima e população e somente então avaliar granularidades menores. A qualidade científica dependerá mais da construção correta da base e da validação temporal do que da escolha isolada do CatBoost.
