# Importação de território por pessoa

O VIGIA+ agora aceita atribuições territoriais separadas do campo resumido `territory` do usuário. Uma pessoa pode ter mais de uma atribuição, cada uma com setor, microárea, localidade, quarteirões, fonte e período de vigência.

## Arquivo esperado

Para a primeira integração, solicitar à prefeitura um dos relatórios do SisPNCD/SisLOC:

- **Cadastro de Localidades/Cenário**;
- **Extrato de Quarteirões por Agente**.

O arquivo pode ser `.csv` ou `.xls` exportado pelo painel de relatórios. O contrato interno aceita os seguintes nomes de coluna e aliases: `id_agente`/`matricula`/`cpf`, `nome_agente`, `codigo_setor`, `setor`, `codigo_microarea`, `microarea`, `codigo_localidade`, `localidade`, `codigo_quarteirao`/`quarteirao`, `vigencia_inicio` e `vigencia_fim`.

O parser CSV está em `lib/identidade/territory-import.ts`. Para XLS, o pipeline deve converter a planilha para linhas com os mesmos cabeçalhos antes de chamar `assignmentFromRow`; a dependência `read-excel-file` já existe no projeto.

## Persistência recomendada

Persistir uma tabela de atribuições, em vez de gravar apenas o nome do setor na pessoa:

```text
territorial_assignment
id
user_id
sector_code
sector_name
microarea_code
microarea_name
locality_code
locality_name
block_codes
source
source_file
valid_from
valid_until
created_at
```

Use `user_id` para a conta interna e mantenha a matrícula ou o identificador de origem em uma coluna própria. Não use CPF como chave principal. A chave de deduplicação da carga deve combinar pessoa, código territorial, período e fonte. Uma alteração de setor deve encerrar a vigência anterior e criar uma nova atribuição, preservando o histórico.

## Por que esse recorte é compatível com a fonte

O SisPNCD é descrito como sistema para coletar, registrar, monitorar e controlar atividades de vigilância entomológica, com módulo municipal/local e módulo web de gestão. A documentação estadual também descreve o Sistema de Localidades como base de localidades e orienta o cadastro de áreas e microáreas no SisPNCD. Relatórios de campo usam localidade, quarteirão e agente como referências operacionais.

Fontes consultadas:

- [SESAB — Controle vetorial do Aedes aegypti / SisPNCD](https://www.ba.gov.br/saude/suvisa/vigilancia-epidemiologica/controle-vetorial-do-aedes-aegypti-sispncd)
- [Norma operacional do Tocantins sobre Sistemas de Cadastro de Localidade](https://central3.to.gov.br/arquivo/403958/)
- [Manual/formulário do PNCD com localidade e quarteirão](https://central.to.gov.br/download/102147)
- [Manual do SisPNCD com referência a microáreas e agente](https://central.to.gov.br/download/102142)

Essas fontes sustentam o desenho do contrato e do pedido de extração. Os nomes exatos das colunas do arquivo municipal precisam ser confirmados com o supervisor antes da primeira carga.
