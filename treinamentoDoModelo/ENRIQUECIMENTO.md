# Estratégia de enriquecimento e imputação

Este documento especifica as regras realmente implementadas no pipeline. O objetivo é gerar uma tabela pequena, auditável e temporalmente coerente para prever casos confirmados por município no Nordeste.

## 1. Fontes e disponibilidade

| Fonte | Obtenção | Enriquecimento | Regra de disponibilidade |
|---|---|---|---|
| SINAN/Dengue | Parquet local completo | Casos, início dos sintomas, semana e diagnósticos de qualidade | Snapshot revisado; história usada com oito semanas de margem por padrão. |
| Localidades IBGE | API por UF | Código oficial, nome e UF | Cadastro atual; vínculos inválidos ficam em quarentena. |
| Malhas IBGE | GeoJSON por UF, referência 2022 | Centroide e contiguidade queen | Contexto territorial fixo, explicitamente não histórico. |
| População IBGE | Agregado 6579, variável 9324 | Estimativas anuais | Disponibilidade conservadora assumida a partir de janeiro do ano seguinte. |
| Censo 2022 IBGE | Agregado 4714, variável 93 | Âncora populacional | Nunca antes de 28/06/2023; versões revisadas atuais. |
| Área IBGE | Agregado 4714, variável 6318 | Área territorial de referência e densidade | Contexto fixo de 2022. |
| NASA POWER | API diária por célula compartilhada | Temperatura, umidade e precipitação | Semana observada anterior à emissão, mais o atraso configurado. |
| INMET, alternativa | ZIPs anuais de estações automáticas | Mesmas três variáveis, IDW entre estações | Cobertura horária e distância limitadas; atraso configurado. |
| Fontes municipais opcionais | CSV agregado com competência e disponibilidade | CNES, LIRAa, arboviroses, ACE, APS e outras | Junção para trás por `disponivel_em`; validade limitada pela competência. |

O pipeline salva os downloads e um `.meta.json` por arquivo com URL, horário da coleta, bytes, SHA-256 e cabeçalhos disponíveis. Erros de rede ou de esquema abortam a etapa: nunca viram zeros ou uma fonte falsa.

## 2. Regras epidemiológicas

O benchmark inicial considera somente `CLASSI_FIN=10,11,12` no período de 2015–2025. A seleção não junta campos antigos e atuais automaticamente. Classificação ausente não é imputada e não confirma dengue.

O município é o de residência. Se o registro tiver seis posições, a correspondência ocorre com os seis primeiros dígitos de um código oficial de sete posições. Se já tiver sete, todos precisam coincidir. Prefixos de UF servem para recorte, não para provar que o código existe.

`SEM_PRI` válido tem preferência. A data é conferida contra a semana e serve como recuperação quando a semana é inválida/ausente. Conflito entre uma semana válida e data fora dela vai para quarentena. Datas recuperadas e classificações ausentes ficam contabilizadas no relatório.

O calendário usa domingo–sábado e a primeira semana com pelo menos quatro dias no ano. Por exemplo, a SE 1/2020 começa em 29/12/2019 e a SE 1/2021 em 03/01/2021. O ano civil da data não substitui o ano epidemiológico.

## 3. Duplicidade

As colunas de controle de duplicidade têm cobertura irregular no histórico. A regra inicial remove somente o marcador explícito `NDUPLIC_N=2`, quando habilitado, e registra quantos foram removidos da contagem elegível.

Registros iguais em município, semana e dados demográficos podem pertencer a pessoas diferentes. Não é feita deduplicação por essas combinações. Também não se usa hash das poucas colunas projetadas para remover registros. Sem identificador confiável não é possível afirmar que duas notificações iguais são a mesma pessoa.

## 4. Zeros e cobertura

O arquivo nacional não contém, regularmente, a prova de notificação negativa de cada município em cada semana. Há duas políticas:

- `snapshot_anual`: recurso anual presente, semana madura e nenhum caso elegível → zero **inferido**, marcado em `zero_inferido=1`;
- `somente_observados`: só considera disponível uma célula com pelo menos uma notificação, ainda que todas tenham sido descartadas. Demais células ficam desconhecidas.

Uma tabela explícita pode substituir essa política:

```csv
codigo_ibge,semana_inicio,fonte_recebida
2611606,2023-01-01,1
2611606,2023-01-08,0
```

Configure `painel.cobertura_csv`. Com essa fonte, linhas ausentes na tabela são desconhecidas e ficam nulas. `fonte_recebida=1` precisa significar cobertura validada para todo o município/semana.

Semanas com menos de `maturacao_dias` desde o fim até a data de corte também ficam com alvo nulo. Nenhum alvo nulo é imputado no treinamento.

## 5. População, área e densidade

As estimativas 6579 e a âncora censitária 2022 são mantidas como registros anuais independentes. O processo não pressupõe que todos os anos existam: o próprio IBGE não fornece estimativa nessa tabela para alguns anos censitários/intermediários.

Para cada origem de previsão:

1. considera as âncoras com `disponivel_em <= semana_inicio`;
2. usa a âncora mais recente do próprio município;
3. impede o uso se a idade ultrapassar `max_idade_anos`;
4. preserva o ano e a idade do denominador;
5. calcula população, log da população, porte, densidade e incidência.

Não há interpolação entre um valor passado e um censo futuro, nem preenchimento para trás. Também não há mediana populacional entre municípios. Se a população continuar desconhecida, a linha é inelegível para treino e inferência; o relatório informa a quantidade.

`defasagem_publicacao_dias=366` significa 366 dias após 1/janeiro do ano de referência. É uma hipótese conservadora de disponibilidade para o benchmark, não a data de publicação original de cada edição. As APIs retornam valores revisados; sem baixar vintages históricos não se pode declarar uma reconstrução estrita as-of.

A âncora do Censo 2022 tem uma exceção explícita: `censo2022_disponivel_em=2023-06-28`, data da divulgação dos primeiros resultados. Ela nunca é usada no primeiro semestre de 2023 antes dessa data. Veja o [anúncio oficial do IBGE](https://www.ibge.gov.br/novo-portal-destaques.html?destaque=37016).

A área oficial é a variável 6318 do Censo 2022. Quando ela falta, usa-se área geodésica GRS80 da malha simplificada, com `area_aproximada=1`. A densidade usa o denominador populacional disponível na origem e a área de referência fixa.

## 6. Clima NASA POWER

O padrão é `provedor: nasa_power` porque permite preparar o Nordeste sem baixar todos os ZIPs nacionais de estações. O código agrupa municípios que compartilham o mesmo ponto de consulta. A grade padrão é 0,5° de latitude × 0,625° de longitude, coerente com a escala dos dados meteorológicos POWER.

Esse método aproxima o município pelo centroide e um ponto de grade próximo. Ele não é uma medição de estação na cidade nem uma média exata sobre o polígono. Distância ao ponto e provedor são preservados.

Uma consulta cobre todo o intervalo para cada ponto. Até quatro workers são permitidos, com três por padrão, retries para 429/5xx e timeout. O tamanho da resposta e o tempo dependem da quantidade de pontos e do serviço. Não é criada uma requisição para cada município × ano × semana.

Parâmetros:

- `T2M`: temperatura média diária do ar a 2 m;
- `RH2M`: umidade relativa média diária;
- `PRECTOTCORR`: precipitação diária corrigida.

O preenchimento técnico `-999` e valores fora dos limites físicos adotados viram nulos. A agregação usa semana epidemiológica em UTC:

- temperatura: média com pelo menos seis dias válidos por padrão;
- umidade: média com pelo menos seis dias válidos;
- precipitação: soma somente com os sete dias válidos, sem extrapolar chuva parcial.

As semanas são deslocadas por `atraso_semanas` antes da criação dos atributos. O modelo nunca usa a chuva observada da própria semana alvo.

## 7. Clima INMET

Para usar estações:

```yaml
clima:
  provedor: inmet
  inmet_zips: []
```

Preserve os demais parâmetros da configuração. Com lista vazia, o código descobre os links dos ZIPs anuais no portal oficial. Para controlar a aquisição ou evitar mudanças de links, informe uma lista de URLs HTTPS ou caminhos locais.

O parser abre os CSVs de dentro dos ZIPs sem extrair o conteúdo todo para disco. Lê os metadados, seleciona estações do Nordeste e identifica as colunas por nomes normalizados. Sentinelas e limites físicos são tratados por hora antes da agregação.

Os totais/médias são combinados nas semanas que atravessam a virada de ano. A semana só é aceita com cobertura horária mínima configurada, 80% por padrão. Precipitação parcial aceita por essa regra é o total observado, sem multiplicação para estimar horas faltantes; o atributo de cobertura acompanha o valor.

Para cada município, são usadas até três estações num raio de 150 km, com peso `1 / max(distância_km,1)²`. A ponderação é recalculada apenas entre estações com dado válido na semana/variável. Ausência de estação no raio permanece nula; não existe seleção ilimitada de uma estação distante.

A escolha usa um conjunto fixo de estações por coordenada; falhas de cobertura continuam explícitas. Esta implementação não estima microclima, altitude ou barreiras orográficas. A cobertura deverá ser analisada por UF e município antes de comparar INMET com POWER.

## 8. Imputação climática e estatística

A estratégia tem duas camadas.

### 8.1 Preenchimento causal antes do treinamento

Temperatura e umidade podem carregar o último valor conhecido por até duas semanas (`ffill_semanas`). A chuva não recebe forward fill: a chuva da semana anterior não representa chuva nesta semana.

São preservadas flags de observação ausente e de uso de forward fill. Se a ausência global de alguma variável superar o portão configurado, a preparação falha. Para treinar deliberadamente sem clima, use `provedor: nenhum`; essa escolha fica registrada como ablação.

### 8.2 Preenchimento aprendido em cada fold

O imputador só recebe as linhas de ajuste do fold:

1. clima ausente → mediana de UF × número da semana no treino;
2. se o grupo não existir → mediana da UF no treino;
3. se ainda faltar → mediana global do treino;
4. demais atributos numéricos ausentes → mediana do treino;
5. categoria ausente → `DESCONHECIDO`;
6. atributo 100% ausente no treino → excluído daquele modelo.

Cada atributo numérico ativo ganha indicador de ausência, inclusive se as ausências aparecerem apenas na inferência. O esquema de entrada permanece estável. Medianas e lista de exclusões são serializadas com o modelo e registradas em `imputacao_hN.json`.

A mediana sazonal de precipitação é uma imputação estatística com flag, não uma observação de chuva. A avaliação deve comparar versões com e sem clima para verificar se essa imputação realmente ajuda.

O imputador do early stopping é ajustado somente no prefixo interno. Depois de fixar a quantidade de árvores, ele é reajustado no conjunto de ajuste completo. O bloco de calibração, a validação externa e os testes continuam excluídos do ajuste.

## 9. O que nunca é imputado

- alvo de casos;
- classificação final individual;
- código municipal inválido;
- população com valor de outra cidade;
- semana sem evidência de cobertura, quando a política exige cobertura explícita;
- dado futuro para recuperar uma lacuna passada.

Rótulos não conhecidos são retirados da avaliação/treino, com contagens de elegibilidade. Atender esse princípio não significa ignorar as ausências: elas permanecem nos dados e relatórios.

## 10. Atributos derivados

O instante de referência é o domingo de `semana_inicio=t`. Os alvos são `y(t+h)`, com `h=1,2,3,4`. O padrão conserva uma margem de oito semanas para os casos consolidados: o atributo mais recente é `casos(t-8)`.

Lags de casos e janelas terminam nessa última semana liberada. O histórico sazonal tem até 60 semanas de atraso no padrão. Linhas sem essa profundidade de história ficam inelegíveis, evitando misturar começo da série com ausência real de dengue.

As janelas incluem médias, máximo, desvio e tendência. A incidência usa a população disponível na origem. O calendário usa seno e cosseno da semana para evitar uma quebra artificial entre dezembro e janeiro.

As anomalias climáticas usam média expansiva da mesma semana em anos **anteriores**, com no mínimo duas observações históricas. Não é usada uma climatologia calculada com 2024/2025 para explicar 2020.

A soma de vizinhos usa somente casos já defasados e retorna nulo se qualquer vizinho elegível estiver desconhecido. A cobertura e o número de vizinhos acompanham o atributo. Municípios sem vizinhos têm soma nula, e não zero epidemiológico inventado.

Os municípios reservados para teste espacial não fornecem séries para a soma de vizinhos do treino. O teste espacial permite histórico local do município como entrada na previsão, mas nenhum rótulo dessa cidade entra no ajuste. Isso mede generalização para cidade nunca vista no treinamento **com histórico disponível**, não para uma cidade sem qualquer dado.

## 11. Contrato de fontes opcionais

O mesmo conector permite CNES histórico, LIRAa, zika, chikungunya, focos/ACE e indicadores agregados da APS. O CSV precisa ter:

```csv
codigo_ibge,competencia,disponivel_em,qtd_cnes
2611606,2020-01-01,2020-02-15,350
2611606,2020-02-01,2020-03-15,352
```

E a configuração:

```yaml
fontes_opcionais:
  - nome: cnes
    caminho: dados/cnes_municipio.csv
    colunas: [qtd_cnes]
    max_idade_dias: 93
```

`competencia` descreve o período do indicador, e `disponivel_em` informa quando ele poderia ser conhecido. Para indicadores de um período completo, a disponibilidade deve ser posterior ao fim desse período. O código valida competência não posterior à disponibilidade, usa junção temporal para trás e rejeita duplicidade de publicação por município.

Valores negativos são rejeitados. Depois de `max_idade_dias` desde a competência, o indicador volta a ficar ausente. O imputador aprende seus parâmetros somente no treino e mantém a flag de ausência.

Para LIRAa, não repita o valor indefinidamente como se houvesse levantamento semanal. Para CNES, não replique o estoque atual por todo o histórico. Para casos de outras arboviroses, não coloque na origem uma semana que ainda não tinha sido recebida.

Essas tabelas são opcionais porque o SINAN de dengue não contém esses dados. O código não baixa CNES bruto e não fabrica datas de publicação de fontes municipais. A aquisição e aprovação desses insumos deve respeitar os contratos acima antes de habilitá-los.

## 12. Teste, calibração e interpretação

O experimento atual ajusta até 2024 e valida exclusivamente em 2025. As últimas 26 semanas do passado são reservadas à calibração residual. Os rótulos são purgados pelo início da semana alvo, portanto um horizonte longo não invade o corte de validação.

O modelo final não tem teste independente posterior a 2025 no recorte atual. A seleção entre candidatos prioriza recall de ocorrência com piso de precisão; MAE macro municipal, PR-AUC e resultados por UF permanecem auditáveis. Os baselines usam a mesma disponibilidade de casos, inclusive a margem de atraso.

Os intervalos são calibrados por quantil absoluto dos resíduos, por UF quando há amostra suficiente e global no fallback. A probabilidade experimental de ultrapassar o limiar usa a distribuição residual empírica. Dependência temporal e mudanças de regime podem invalidar a cobertura nominal; as métricas reais de cobertura são sempre registradas.

O limiar é um percentil do treino com piso de casos configurável. Ele não é uma definição oficial de epidemia. A aprovação de alertas operacionais continua dependente da vigilância epidemiológica.

### Balanceamento da ocorrência de surto

Quando o candidato CatBoost é `hurdle`, o classificador `y > 0` pode receber SMOTENC apenas nas linhas de treino de cada UF. A razão positiva:negativa é limitada pela configuração (padrão 0,20), há dois vizinhos e há teto de exemplos sintéticos por UF. Calibração, validação de 2025 e municípios reservados nunca participam do ajuste.

A regressão da quantidade, condicionada à ocorrência, é treinada exclusivamente com semanas positivas reais. Isso evita que a interpolação de SMOTE crie contagens epidemiológicas fictícias. Cada `smote_h*.json` registra o número de observações criadas por UF.

## 13. Proveniência e limites de causalidade temporal

Um único snapshot revisado não permite demonstrar que toda informação estava presente em 2020 exatamente como está agora. A margem de atraso, as junções temporais e a separação de teste impedem vários vazamentos, mas não recuperam revisões históricas de SINAN, população, clima ou fronteiras.

Por isso os artefatos são identificados como pesquisa retrospectiva. Para evoluir para operação prospectiva, armazenar snapshots imutáveis a cada atualização, registrar a disponibilidade real, construir triângulos de atraso e avaliar nowcasting antes do forecast. O código de preparação e os contratos de entrada já foram separados para permitir essa evolução.

## 14. Fontes oficiais e documentação

- [SINAN/Dengue — Portal de Dados Abertos do SUS](https://dadosabertos.saude.gov.br/dataset/arboviroses-dengue).
- [Dicionário de dados do SINAN Online](https://portalsinan.saude.gov.br/images/documentos/Agravos/Dengue/DIC_DADOS_ONLINE.pdf).
- [API de localidades do IBGE](https://servicodados.ibge.gov.br/api/docs/localidades).
- [API de malhas do IBGE](https://servicodados.ibge.gov.br/api/docs/malhas?versao=3).
- [API de agregados do IBGE](https://servicodados.ibge.gov.br/api/docs/agregados?versao=3).
- [Estimativas populacionais, tabela 6579](https://sidra.ibge.gov.br/tabela/6579).
- [Censo 2022: população, área e densidade, tabela 4714](https://sidra.ibge.gov.br/tabela/4714).
- [NASA POWER — API diária](https://power.larc.nasa.gov/docs/services/api/temporal/daily/).
- [INMET — arquivos históricos](https://portal.inmet.gov.br/dadoshistoricos).
- [CatBoost — perdas de regressão e contagem](https://catboost.ai/docs/en/concepts/loss-functions-regression).
