# Mockups por prefeitura

Cada prefeitura demonstrativa deve possuir um único arquivo em `lib/mockups/`.
O arquivo deve reunir a configuração municipal, territórios, imóveis fictícios,
usuários, priorização e registros de ingestão.

Para criar outra demonstração:

1. Duplique `lagoa-de-itaenga.ts` com o identificador da nova prefeitura.
2. Substitua `municipality`, `mappedTerritories`, casas, usuários e registros.
3. Mantenha `metadata.realData` como `false` enquanto forem dados simulados.
4. Aponte o ambiente ou a página de demonstração para o novo objeto mockup.

O mockup atual é exportado por `lagoaDeItaengaMockup` e representa somente dados
fictícios de Lagoa de Itaenga. Os imóveis não são endereços reais.
