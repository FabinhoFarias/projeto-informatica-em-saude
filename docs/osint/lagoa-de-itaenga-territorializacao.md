# Extração OSINT — territorialização de saúde de Lagoa de Itaenga

## Resultado da extração pública

O município possui **23 territórios explicitamente publicados** no diagnóstico municipal: **14 bairros urbanos** e **9 localidades rurais**. A relação estruturada está em [lagoa-de-itaenga-territorios.csv](../../data/territorios/lagoa-de-itaenga-territorios.csv).

O documento oficial é o [Diagnóstico da Pessoa Idosa de Lagoa de Itaenga](https://itaenga.pe.gov.br/v1/wp-content/uploads/2026/02/DIAGNOSTICO-FINALIZADO-ITAENGA-10.02.2026_compressed.pdf). Ele lista a zona urbana (Centro, Nova Itaenga, Vila Boa Esperança, Bom Jesus, Saudade, Salinas, São Sebastião, Independência, Campo, Irmãos Oliveira, Moinho, Baixa Fria e Jacaré I e II) e a zona rural (Sítio Camboa, Sítio Imbé, Sítio Açude de Pedra, Sítio Quatis, Sítio Arrombados, Sítio Cai Cai, Sítio Marrecos, Sítio Amarelado e Sítio Angicos).

## Rede assistencial localizada no CNES

O cadastro público do CNES lista **22 estabelecimentos municipais**. A extração tabular está em [lagoa-de-itaenga-cnes-estabelecimentos.csv](../../data/territorios/lagoa-de-itaenga-cnes-estabelecimentos.csv), com código CNES, nome e fonte. A fonte primária é a [consulta de estabelecimentos mantidos pelo município no CNES](https://cnes2.datasus.gov.br/Listar_Mantidas.asp?VCnpj=11097250000108&VEstado=26&VNome=MUNICIPIO+DE+LAGOA+DO+ITAENGA).

O CNES também disponibiliza consultas separadas para [equipes](https://cnes2.datasus.gov.br/Mod_Ind_Equipes.asp), [profissionais](https://cnes.cnes.datasus.gov.br/pages/profissionais/consulta.jsp?search=0) e [extração de estabelecimentos](https://cnes.cnes.datasus.gov.br/pages/estabelecimentos/extracao.jsp). Essas consultas podem complementar a tabela quando a competência mensal for definida.

## O que não foi encontrado publicamente

Não foi localizado um arquivo oficial aberto que associe **ACE → setor → microárea → quarteirão/localidade** especificamente para Lagoa de Itaenga. O CNES identifica estabelecimentos, equipes e profissionais, mas não substitui a planilha operacional de territorialização do controle de endemias.

Para completar essa camada, solicitar à Secretaria Municipal de Saúde o relatório **“Cadastro de Localidades/Cenário”** ou **“Extrato de Quarteirões por Agente”** do SisPNCD/SisLOC, preferencialmente em CSV/XLSX. Solicitar, no mínimo, os campos: nome e matrícula do ACE, código/nome do setor, código/nome da microárea, localidade, quarteirão, bairro, zona, situação e competência.

## Correção da regionalização

Lagoa de Itaenga pertence à **II Gerência Regional de Saúde (II GERES)**, não à III GERES. A confirmação está na [lista oficial de endereços das GERES da SES-PE](https://cartadeservicos.saude.pe.gov.br/endereco-geres/) e no [portal das GERES](https://portal.saude.pe.gov.br/geres/). O contato institucional divulgado para a II GERES é `2regionaldesaude@gmail.com` e o telefone informado é `(81) 3628-8843`.

## Pedido formal via LAI / E-SIC

Protocolar o pedido solicitando a exportação vigente da territorialização de ACE e, se possível, o histórico por competência:

- [E-SIC municipal](https://cloud.tenosoft.com.br/portal/sic/?entidade=154)
- [Ouvidoria municipal](https://cloud.tenosoft.com.br/portal/ouvidoria/154)
- [Pedido de informação no portal da transparência](https://transparencia.itaenga.pe.gov.br/portal/v81/sic/sic.php?entidade=154)
- E-mail geral: `contato@itaenga.pe.gov.br`
- E-mail da Ouvidoria: `ouvidoria@itaenga.pe.gov.br`
- Telefone: `(81) 3653-2168`

### Texto sugerido para o pedido

> Solicito, com fundamento na Lei nº 12.527/2011, a disponibilização em formato aberto (CSV ou XLSX) do Cadastro de Localidades/Cenário ou Extrato de Quarteirões por Agente do SisPNCD/SisLOC referente ao município de Lagoa de Itaenga-PE. Solicito que o arquivo contenha, quando existentes, matrícula/nome do ACE, código e nome do setor, código e nome da microárea, localidade, bairro, quarteirão, zona urbana/rural, situação do cadastro e competência/data de atualização. Caso o município utilize outro sistema, solicito o relatório equivalente de territorialização da Vigilância Ambiental/Controle de Endemias.

## Limitações e uso no VIGIA+

Os 23 territórios publicados devem ser tratados como **camada territorial de referência**, não como prova de responsabilidade individual de agentes. A atribuição ACE/microárea só deve entrar no banco após validação da Secretaria de Saúde e registro da fonte, competência e data de vigência. Isso evita associar notificações a agentes incorretos quando houver remanejamentos.
