Atue como um Arquiteto de Software Sênior especialista em Engenharia Reversa e Integração de Sistemas de Saúde Baseados em PostgreSQL. 

Estou desenvolvendo uma plataforma própria que precisa automatizar a inserção de dados em um software governamental fechado chamado SisPNCD (Sistema do Programa Nacional de Controle da Dengue). Como o SisPNCD não possui API ou importação de planilhas aberta, a integração será feita via injeção direta via SQL (INSERTs/UPDATEs) no banco de dados PostgreSQL local que o SisPNCD instala na máquina do usuário.

Preciso que você me ajude a analisar a estrutura desse banco de dados para criar uma documentação técnica de integração e o mapeamento de dados (Data Mapping) entre a minha plataforma e o SisPNCD.

Para começarmos, monte um guia passo a passo estruturado respondendo e fornecendo os seguintes itens:

1. QUERIES DE INVESTIGAÇÃO (DESCOBERTA DO SCHEMA):
Forneça as queries SQL nativas do PostgreSQL que devo rodar no banco local (via DBeaver/pgAdmin) para extrair as seguintes informações cruciais para a minha documentação:
- Listar todas as tabelas do schema public (ordenadas por relevância presumida de dados geográficos e produção).
- Listar todas as colunas de uma tabela específica, mostrando tipo de dado, se aceita NULL e se é Chave Primária (PK).
- Identificar todas as Chaves Estrangeiras (FK) e relacionamentos entre tabelas de produção (ex: Visitas, FAD 7) e tabelas de cadastro (Bairros, Quarteirões, Localidades).
- Listar todas as SEQUENCES (para entender os IDs auto-incrementais) e TRIGGERS ativos no banco (para saber se o banco tem regras de validação internas).

2. MODELO DE TABELA DE MAPEAMENTO (DATA MAPPING DE DEPARA):
Crie um modelo de tabela Markdown em branco (Template "De/Para") para documentação técnica, mapeando os campos comuns de uma planilha de campo de agentes de endemias (Ex: Data da Visita, Tipo de Imóvel, Depósitos Inspecionados, Depósitos Tratados) para as futuras colunas que descobriremos no Postgres do SisPNCD.

3. SCRIPT TEMPLATE DE CONEXÃO E VALIDAÇÃO (FLUXO DE SEGURANÇA):
Crie a estrutura de um script em [INSIRA SUA LINGUAGEM AQUI - Ex: Python/Node.js/C#] que mostre a lógica correta para uma integração segura. O script deve simular:
- Abertura de transação (BEGIN TRANSACTION).
- Uma query de validação prévia (Ex: verificar se o ID do bairro ou quarteirão enviado pela minha plataforma realmente existe na tabela de localidades do SisPNCD antes de tentar o insert).
- Tratamento de erro (ROLLBACK) caso a validação ou o INSERT falhem, garantindo que o banco do SisPNCD nunca seja corrompido.

Apresente as respostas de forma clara, técnica e modular, prontas para serem copiadas e colinhas na minha documentação interna de arquitetura.
