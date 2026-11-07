# Validação da implementação

Execuções realizadas em 6 de novembro de 2026, com o Parquet real do projeto. Os tempos abaixo são medições locais, não SLA nem projeção de duração do treinamento completo.

Esta página registra o ensaio histórico da implementação inicial. A configuração atual compara dez candidatos com validação exclusivamente em 2025; os resultados abaixo não medem esse novo experimento.

## Ambiente

Ambiente virtual temporário, sem instalar pacotes no Python da aplicação: Python 3.9.6, DuckDB 1.4.5, pandas 2.3.3, NumPy 2.0.2, PyArrow 21.0.0, CatBoost 1.2.10, scikit-learn 1.6.1, Shapely 2.0.7 e pyproj 3.6.1. Para o usuário, recomenda-se Python 3.10–3.12 por compatibilidade de wheels e TLS.

Os arquivos de saída de validação foram produzidos em diretórios temporários. O SINAN de entrada não foi modificado e os testes não executaram a configuração completa de produção.

Também foi preparado o ambiente local `treinamentoDoModelo/.venv`, com as mesmas dependências. O redirecionamento do Python 3.15 para esse interpretador foi validado pela execução real do comando `painel` com os três municípios.

## 1. Integração com fontes reais

O teste com Recife, Olinda e Jaboatão dos Guararapes executou:

1. download de localidades e malha do IBGE;
2. população estimada, população censitária e área oficial;
3. download diário NASA POWER, agrupando as três cidades em um ponto de consulta;
4. agregação do SINAN local;
5. geração de atributos;
6. treino Poisson reduzido;
7. inferência na última origem.

Resultado: 1.722 linhas município-semana, 76.075 casos elegíveis, todos os municípios com população e previsões não negativas. A execução integrada inicial levou aproximadamente 7,6 segundos. Usou somente um horizonte, 25 árvores máximas e validação em 2023; portanto não mede o tempo do treino padrão.

## 2. Preparação regional completa

Os nove estados foram processados com referências reais do IBGE. Neste ensaio, o clima foi desativado explicitamente para medir a agregação e o enriquecimento estrutural separados do custo da aquisição meteorológica.

| Medida | Resultado |
|---|---:|
| Registros regionais lidos | 5.598.577 |
| Registros candidatos ao período | 2.615.302 |
| Registros válidos no período | 2.576.467 |
| Município inválido | 8 |
| Conflito entre data e semana | 31.580 |
| Semana/data inválida ou fora do calendário do recorte | 7.247 |
| Municípios/unidades IBGE | 1.794 |
| Semanas epidemiológicas | 574 |
| Linhas no painel completo | 1.029.756 |
| Casos confirmados elegíveis | 1.350.029 |
| Linhas sem denominador populacional | 0 |
| Alvos nulos com política `snapshot_anual` | 0 |
| Zeros inferidos em células sem qualquer notificação | 784.548 |

O número de zeros inferidos não é o total de semanas com zero confirmado: há semanas com notificações descartadas e zero confirmado que possuem evidência de uma notificação recebida.

O total de casos difere do diagnóstico preliminar do plano porque esta implementação usa o calendário epidemiológico domingo–sábado, valida códigos, recupera semanas pela data quando permitido e aplica quarentena de conflitos. Não é uma reconciliação automática com boletim oficial.

Tempos medidos:

- aquisição inicial das referências do IBGE, antes de paralelizar esses downloads: cerca de 48 segundos;
- painel regional: 18,4 segundos;
- enriquecimento de população, geografia, vizinhos e atributos sem clima: aproximadamente 8–9 segundos;
- painel + atributos: aproximadamente 27,3 segundos.

As referências do IBGE passaram a ser consultadas com até quatro workers. Não foi estimado o ganho em um novo download completo, pois o tempo depende da API/rede.

## 3. Treino com escala regional

Foi executado um ensaio regional com todos os municípios, reserva espacial ativa, 41 atributos numéricos estruturais, horizonte de uma semana, validação em 2020, no máximo 15 árvores e profundidade 4.

O fold teve 281.471 linhas de ajuste e 42.302 de calibração. Poisson e hurdle foram treinados e avaliados em municípios conhecidos e reservados. O candidato final, imputador, calibração e metadados foram serializados. O treinamento reduzido levou aproximadamente 20–23 segundos nas duas execuções, incluindo a versão final com a data de divulgação do Censo 2022 respeitada.

Esse ensaio verifica escala, memória, partições e execução. Não representa a escolha científica final, não abriu os testes reais de 2024/2025 e não aprova um modelo epidemiológico para produção.

## 4. Testes automatizados

Comando:

```sh
python -m unittest discover -s treinamentoDoModelo/tests -v
```

A suíte cobre:

- ano inválido anterior ao limite de timestamps, chegando à quarentena sem overflow;
- calendário brasileiro, incluindo semana 53 e virada do ano;
- bloqueio do uso da âncora censitária de 2022 antes de 28/06/2023;
- código de município com dígito inválido;
- reconciliação das contagens e exclusão de duplicidade explicitamente marcada;
- cobertura desconhecida conservada como alvo nulo;
- disponibilidade e expiração de fonte opcional;
- imputação ajustada somente com o treino;
- chuva com dia ausente não transformada em seca;
- recomposição de semana INMET dividida em dois ZIPs anuais;
- alteração de casos futuros sem mudança dos atributos passados;
- alteração do clima futuro sem mudança dos atributos passados;
- exclusão de municípios reservados das séries de vizinhos que alimentam o treino;
- fluxo sintético completo de treino, avaliação explícita e inferência.

Resultado final: **14 testes aprovados**, executados também no ambiente virtual local do projeto.

O leitor INMET foi testado com arquivos sintéticos que reproduzem o layout público, inclusive `DATA DE FUNDACAO` antes do cabeçalho e a virada de ano. Não foi feito o download integral de todos os ZIPs históricos do INMET neste ensaio.

## 5. O que ainda exige experimento completo

- aquisição e análise de cobertura meteorológica para todos os pontos do Nordeste;
- comparação INMET × NASA POWER;
- quatro horizontes × quatro folds × configurações de hiperparâmetros;
- avaliação bloqueada de 2024 e 2025 depois de congelar escolhas;
- validação dos limiares de alerta com epidemiologistas;
- backtest com snapshots históricos reais e componente de nowcasting;
- implantação corrente e integração com o produto.

Os comandos, configurações, relatórios e artefatos para iniciar esses experimentos estão implementados. Os resultados de pesquisa devem continuar identificados como retrospectivos até que existam snapshots históricos de disponibilidade.
