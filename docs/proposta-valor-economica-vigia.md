# Proposta de valor econômica do VIGIA+

## Objetivo

Este documento fornece uma base para apresentar o possível impacto econômico do VIGIA+ a prefeituras. Os valores abaixo são **cenários ilustrativos**, não resultados comprovados. A economia real só poderá ser calculada após medir a linha de base e executar um piloto municipal.

## Proposta de valor

> O VIGIA+ organiza dados territoriais e epidemiológicos, reduz trabalho manual de consolidação e ajuda a coordenação a direcionar visitas e ações para áreas prioritárias. O possível retorno econômico vem de tempo operacional poupado, menor retrabalho, melhor direcionamento de deslocamentos e redução de atrasos na resposta — sempre com decisão humana e validação da vigilância.

## Onde pode haver economia pública

| Fonte potencial | Como o VIGIA+ pode contribuir | Como medir |
|---|---|---|
| Consolidação de planilhas | Automatizar importação, validação e agregação por território | Horas mensais antes/depois |
| Retrabalho | Detectar duplicidades, campos ausentes e inconsistências | Registros devolvidos e corrigidos |
| Planejamento de visitas | Priorizar setores com sinais combinados | Quilômetros, visitas úteis e cobertura |
| Tempo de resposta | Reduzir intervalo entre sinal e decisão | Dias entre notificação, revisão e ação |
| Comunicação gerencial | Entregar painel e relatório versionado | Tempo para preparar reunião/relatório |
| Alocação de recursos | Apoiar distribuição de equipes, insumos e ações | Recursos por território e resultado observado |

## Evidências operacionais da entrevista municipal

A entrevista realizada pela equipe acrescentou contexto ao problema econômico:

- a priorização ocorre por setores, usando levantamento de índice elevado,
  incidência conhecida e indicadores anotados em pranchetas;
- cada ACE pode ficar responsável por até 1.000 imóveis e muitos trabalham em
  meio período;
- digitadores e gestores conferem fichas manuais e somas para reduzir erros;
- o deslocamento é planejado por setor, não necessariamente por bairro;
- existe demanda por relatório diário resumido, relatório semanal/final resumido
  e futura inclusão de registros do LIRAa.

Esses pontos transformam a proposta de valor: além de priorizar territórios, o
VIGIA+ deve reduzir o esforço de conferência e gerar resumos operacionais para
envio aos órgãos responsáveis. Ainda são evidências qualitativas; os volumes,
horas e custos precisam ser medidos em uma linha de base.

## Referências públicas de custo da dengue

As referências abaixo ajudam a dimensionar o impacto, mas não são uma tabela universal de preço atual. Os valores dependem de ano, gravidade, perspectiva, rede pública/privada e método de cálculo.

### Parâmetros usados em avaliação da CONITEC

O dossiê técnico da CONITEC sobre vacina contra dengue apresenta parâmetros de custo convertidos para reais em 2023, com base em Machado (2019). Consulte diretamente a **Tabela 37, página impressa 136** do PDF para os custos de manejo; os custos diretos não médicos aparecem na seção **7.8, página impressa 138**.

| Tipo de atendimento | Valor de referência | Faixa usada na análise |
|---|---:|---:|
| Tratamento ambulatorial | R$ 205,01 | R$ 164,00–246,00 |
| Internação em enfermaria | R$ 823,53 | R$ 658,82–988,23 |
| Hospitalização em terapia intensiva | R$ 3.692,22 | R$ 2.954,15–4.430,66 |

O mesmo dossiê menciona R$ 237,00 por caso em custos diretos não médicos, incluindo transporte, alimentação, hospedagem e despesas associadas à busca de atendimento. Esses valores devem ser tratados como parâmetros de modelagem, não como faturamento garantido pela prefeitura.

Fonte: [Dossiê técnico da CONITEC — vacina TAK-003, p. 136 e p. 138](https://www.gov.br/conitec/pt-br/midias/consultas/dossie/2023/DossietakedaVacinadengue.pdf#page=136).

### Evidência de custos no setor privado

Um estudo brasileiro com dados de saúde suplementar encontrou custo médio total por caso entre US$ 293,08 em 2015 e US$ 1.594,79 em 2020. O custo médio de hospitalização variou de US$ 968,40 a US$ 1.466,45 no mesmo período. Esses números são privados, foram calculados em dólares e não devem ser aplicados diretamente ao SUS.

Fonte: [Abud et al. — custos diretos do manejo da dengue no Brasil](https://www.scielo.br/j/bjid/a/MBC8FLrFK6TsqRZPcYNb5dB/abstract/?lang=en).

### Fonte pública atual para custos hospitalares

Para substituir demonstrativos históricos, a fonte recomendada é o **SIH/SUS atualizado**, consultado por competência no DATASUS. O tabulador permite filtrar internações por município, período e diagnóstico/CID e retornar quantidade de AIH, permanência e valor aprovado. A fonte oficial não publica uma tabela fixa de “custo atual da dengue”; o valor deve ser calculado a partir da extração mais recente.

Fontes oficiais atuais:

- [DATASUS — Morbidade Hospitalar do SUS (SIH/SUS)](https://datasus.saude.gov.br/acesso-a-informacao/morbidade-hospitalar-do-sus-sih-sus): acesso ao tabulador atualizado por local de internação ou residência.
- [DATASUS — Informações de Saúde/TABNET](https://datasus.saude.gov.br/informacoes-de-saude-tabnet/): orientações para consultas de produção hospitalar.
- [API de Dados Abertos do Ministério da Saúde](https://apidadosabertos.saude.gov.br/): catálogo do endpoint de produção hospitalar `sih-procedimentos-hospitalares`, com procedimentos, município, quantidade de AIH e valores aprovados.

Para o VIGIA+, a extração auditável deve registrar competência, município, CID utilizado, quantidade de internações, dias de permanência, valor aprovado e data da consulta. Assim, o valor de Lagoa de Itaenga ou de outra prefeitura será calculado com dados atuais, sem reutilizar a tabela nacional de 2010–2013.

### Custos sociais e produtividade

O dossiê da CONITEC ressalta que os custos indiretos — absenteísmo, perda de produtividade e dias de escola — podem representar parcela importante da carga total da dengue. Por isso, uma proposta para prefeitura não deve calcular retorno apenas com o valor de uma internação.

## Como usar esses valores na proposta

Use os parâmetros somente para cenários de sensibilidade:

```text
casos evitados ou complicações evitadas × custo unitário de referência
```

Depois desconte:

```text
benefício líquido = economia clínica estimada
                  + economia operacional comprovada
                  - implantação
                  - integração
                  - treinamento
                  - suporte e manutenção
```

O VIGIA+ não deve afirmar que uma previsão evita automaticamente uma internação. O argumento correto é que a plataforma pode reduzir atrasos e melhorar a priorização; eventual redução de casos graves ou internações precisa ser medida em avaliação municipal própria.

## Modelo de cálculo

### Economia operacional mensal

```text
economia_operacional =
  (horas_antes - horas_depois) × custo_hora_da_equipe
  + custo_retrabalho_evitable
  + custo_deslocamento_evitable
```

### Benefício líquido

```text
benefício_líquido = economia_operacional + valor_dos_impactos_mensurados - custo_total_do_VIGIA+
```

O custo total deve incluir implantação, integração, hospedagem, suporte, treinamento, manutenção de regras, segurança, dispositivos e eventuais custos de dados.

### Retorno sobre investimento

```text
ROI = (benefício_líquido / custo_total_do_VIGIA+) × 100
```

Se o município não conseguir monetizar um desfecho, apresentar o resultado como indicador operacional, e não como economia financeira.

## Cenário ilustrativo para discussão

O exemplo abaixo serve apenas para mostrar o método. Não representa Lagoa de Itaenga, Recife ou qualquer prefeitura específica.

| Premissa fictícia | Cenário conservador | Cenário intermediário | Cenário otimista |
|---|---:|---:|---:|
| Horas mensais de consolidação antes | 160 | 240 | 320 |
| Redução estimada após implantação | 15% | 25% | 35% |
| Custo médio da hora da equipe | R$ 35 | R$ 40 | R$ 45 |
| Economia de tempo mensal | R$ 840 | R$ 2.400 | R$ 5.040 |
| Redução adicional de retrabalho/deslocamento | R$ 500 | R$ 1.500 | R$ 3.000 |
| Benefício operacional mensal estimado | R$ 1.340 | R$ 3.900 | R$ 8.040 |

Esses números são uma simulação de sensibilidade. Eles não devem aparecer em uma proposta comercial como promessa ou evidência de retorno.

## Dados necessários para calcular a economia real

Solicitar à prefeitura, preferencialmente por setor e competência:

- quantidade de agentes e horas dedicadas a consolidação;
- quantidade de planilhas e relatórios produzidos;
- tempo médio para fechar uma semana ou ciclo;
- quantidade de registros devolvidos para correção;
- quilômetros e tempo de deslocamento por roteiro;
- quantidade de imóveis, quarteirões e visitas planejadas;
- custo de pessoal, combustível, diárias e materiais;
- tempo entre sinal, validação e ação;
- áreas priorizadas atualmente e critério usado;
- resultados observados após as ações;
- custos de implantação e operação dos sistemas atuais.

## Desenho recomendado de avaliação

1. Medir 8 a 12 semanas de linha de base sem o VIGIA+.
2. Implantar a plataforma em um conjunto de equipes ou territórios.
3. Manter um grupo ou período de comparação quando for viável.
4. Medir os mesmos indicadores após 8 a 12 semanas.
5. Comparar resultados por território, equipe e semana.
6. Registrar mudanças de protocolo, sazonalidade, surtos e alterações de pessoal.
7. Calcular intervalos de incerteza e realizar análise de sensibilidade.
8. Validar o relatório com a Secretaria de Saúde antes de divulgar qualquer economia.

## Indicadores de sucesso

### Operacionais

- horas de consolidação por semana;
- tempo para gerar o relatório;
- percentual de registros válidos na primeira submissão;
- tempo entre sinal e revisão;
- cobertura de visitas planejadas;
- retrabalho por equipe;
- distância média por roteiro;
- percentual de decisões registradas com justificativa.

### Epidemiológicos

Os indicadores epidemiológicos devem ser avaliados com cautela. Redução de casos não pode ser atribuída ao software sem desenho de avaliação adequado, controle de sazonalidade, mudanças de notificação e outras intervenções públicas.

## Como apresentar a proposta à prefeitura

Usar uma mensagem como:

> O VIGIA+ não promete uma economia fixa antes de conhecer a operação local. Propomos medir a linha de base, implantar um piloto e demonstrar quanto tempo, retrabalho e deslocamento podem ser reduzidos, mantendo a decisão sob responsabilidade da equipe de vigilância.

## O que não afirmar

- Não afirmar que o software reduz casos automaticamente.
- Não afirmar um percentual fixo de economia sem piloto.
- Não converter previsão em economia realizada.
- Não considerar visita não realizada como economia.
- Não ignorar custos de implantação e manutenção.
- Não usar estudos de dispositivos médicos como evidência direta do retorno do VIGIA+.

## Relação com o artigo analisado

O artigo de Mascarenhas et al. recomenda declarar perspectiva, custos, desfechos, horizonte, incerteza e limitações em avaliações econômicas. Para o VIGIA+, a aplicação prática é adotar uma avaliação municipal transparente, com comparação entre processo atual e processo apoiado pela plataforma. Consulte o [resumo do artigo](resumosDeArtigos/resumo-artigo-avaliacoes-economicas-dispositivos-pediatricos.md).

## Próxima etapa

Criar uma planilha de linha de base para uma prefeitura piloto e preencher os valores reais antes de transformar esta proposta em preço, caso de negócio ou promessa comercial.

## Registro de fontes para auditoria

Esta seção identifica as fontes usadas na construção dos parâmetros econômicos. Os links devem ser preservados junto com a versão deste documento para permitir rechecagem posterior.

| ID | Fonte oficial ou publicação | URL direta | Informação utilizada | Limitação |
|---|---|---|---|---|
| F-01 | CONITEC — Dossiê técnico da vacina TAK-003 contra dengue | https://www.gov.br/conitec/pt-br/midias/consultas/dossie/2023/DossietakedaVacinadengue.pdf#page=136 | Tabela 37, p. 136: custos de tratamento ambulatorial, enfermaria e UTI; seção 7.8, p. 138: custos diretos não médicos | Valores de modelagem convertidos para reais em 2023; não equivalem automaticamente ao custo local atual |
| F-02 | Abud et al. — custos diretos do manejo da dengue na saúde suplementar brasileira | https://www.scielo.br/j/bjid/a/MBC8FLrFK6TsqRZPcYNb5dB/abstract/?lang=en | Tabela 3 na versão HTML: custos médios privados por caso, atendimento de emergência e hospitalização entre 2015 e 2020 | Fonte acadêmica secundária, sem paginação no HTML; setor privado, valores em dólar e contexto diferente do SUS |
| F-03 | DATASUS — Morbidade Hospitalar do SUS (SIH/SUS) | https://datasus.saude.gov.br/acesso-a-informacao/morbidade-hospitalar-do-sus-sih-sus | Consulta atual por competência, município, CID, AIH, permanência e valor aprovado | Não é uma tabela pronta: a consulta precisa ser parametrizada e salva com data, filtros e resultado |
| F-04 | API de Dados Abertos do Ministério da Saúde — SIH | https://apidadosabertos.saude.gov.br/ | Catálogo do endpoint `sih-procedimentos-hospitalares`, com produção e valores aprovados | A documentação da API deve ser consultada para confirmar filtros e paginação vigentes |
| F-05 | Ministério da Saúde — diagnóstico e manejo clínico da dengue | https://www.gov.br/saude/pt-br/centrais-de-conteudo/publicacoes/svsa/dengue/dengue-diagnostico-e-manejo-clinico-adulto-e-crianca/view | Página oficial e PDF “Manejo clínico da Dengue” anexado no item de download; fundamentação clínica para distinguir manejo ambulatorial, sinais de alarme e internação | A página é o repositório oficial; a paginação deve ser conferida na versão PDF baixada |
| F-06 | DATASUS — regras e composição dos valores SIGTAP | https://wiki.datasus.gov.br/sigtap/index.php/Gerais | Interpretação de valores de procedimento e componentes de custo hospitalar | Valor de referência de remuneração não representa necessariamente custo econômico total |

### Regras de auditoria

- Nenhum valor da tabela deve ser interpretado como economia já obtida pelo VIGIA+.
- Toda atualização de preço deve registrar data de consulta, versão do documento e índice de atualização monetária.
- Estudos públicos, privados e parâmetros SIGTAP devem permanecer separados na análise.
- O custo local deve ser recalculado com dados da prefeitura, SIH/SUS, SIA/SUS, folha, combustível e tempo das equipes.
- Qualquer número apresentado a uma prefeitura deve indicar fonte, ano, perspectiva e se é observado, estimado ou simulado.
