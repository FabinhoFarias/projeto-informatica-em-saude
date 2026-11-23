# Relatório de tecnologias para produção escalável — VIGIA+

**Revisão:** 23/11/2026  
**Escopo:** evolução do protótipo para um SaaS de saúde municipal, com API comercializável separadamente.  
**Base analisada:** requisitos integrado/mock, modelo lógico multicliente, diagramas de arquitetura, especificação de visitas ACE, integração territorial/SisPNCD, pipeline preditivo, CI/CD, segurança e documentação de API.

## 1. Resumo executivo

O VIGIA+ deve ser construído como um **monólito modular inicialmente**, com fronteiras de domínio claras e possibilidade de separar serviços pesados depois. O frontend pode continuar na Vercel, mas a API, banco, filas e workers devem ser tratados como componentes independentes.

Arquitetura recomendada para produção:

```text
Web Next.js na Vercel
        |
        | HTTPS / REST / OpenAPI
        v
API TypeScript em container
        |
        +--> PostgreSQL + PostGIS gerenciado no Brasil
        +--> Redis/Valkey para cache, sessões e filas
        +--> Object Storage S3-compatible para fotos, anexos e exportações
        +--> Workers para ingestão, relatórios, mapas e ML
        +--> Observabilidade centralizada
```

Essa estrutura atende à necessidade de vender a API separadamente, evita dependência do filesystem efêmero da Vercel e permite migrar o provedor brasileiro sem reescrever os domínios.

## 2. Decisões confirmadas na documentação

Os documentos já estabelecem decisões importantes que devem ser preservadas:

- prefeitura como `cliente_id`/tenant;
- secretarias, departamentos e setores como unidades organizacionais;
- isolamento por cliente, unidade, finalidade e concessão;
- PostgreSQL como banco relacional alvo;
- PostGIS para geometrias e territórios;
- API REST versionada em `/v1`;
- frontend e futuro aplicativo consumindo a mesma API;
- workers para ingestão, ML, exportação e tarefas pesadas;
- Redis/Valkey para cache de leitura;
- object storage para arquivos e modelos;
- RBAC, MFA administrativo, auditoria e rastreabilidade;
- visitas ACE, laboratório, relatórios, atribuições e configurações como domínios separados;
- previsão epidemiológica publicada antes de ser lida pela interface, sem treinar modelo durante uma requisição web.

O modelo lógico do banco é um excelente ponto de partida, mas ainda precisa virar schema físico, migrations, índices, políticas RLS, auditoria e regras transacionais antes da produção.

## 3. Stack recomendada

### 3.1 Frontend web

| Tecnologia | Uso | Decisão |
|---|---|---|
| Next.js 16 + React | interface web e Server Components | manter |
| TypeScript | contratos e segurança de tipos | manter |
| Tailwind/CSS tokens | design system | manter |
| Zod | validação de DTOs e formulários | manter |
| Vercel | frontend, previews e CDN | adequado para a camada web |

O frontend não deve acessar banco, filesystem de dados ou regras de negócio. Ele chama a API por um cliente tipado, e os componentes recebem dados prontos para exibição.

### 3.2 API

O repositório já usa Express/TypeScript, autenticação JWT, Helmet, CORS, rate limit e camadas de domínio. Para reduzir risco, a recomendação é:

1. manter Express no primeiro ambiente produtivo;
2. consolidar módulos por domínio e contratos OpenAPI;
3. adicionar validação Zod em toda entrada e saída;
4. separar `routes`, `application`, `domain` e `infrastructure`;
5. executar a API em container stateless;
6. somente migrar para Fastify/NestJS se métricas demonstrarem necessidade.

NestJS seria uma alternativa válida para equipes maiores, mas a migração imediata não traz benefício suficiente para justificar o custo. Fastify pode ser avaliado futuramente para maior throughput.

### 3.3 Banco de dados

**Escolha:** PostgreSQL 16/17 + PostGIS.

Motivos:

- compatível com Prisma;
- transações e integridade referencial;
- suporte a JSONB para payloads controlados;
- índices geoespaciais;
- RLS para defesa adicional do isolamento multicliente;
- portabilidade entre provedores brasileiros;
- adequado para relatórios, auditoria e dados operacionais.

**ORM:** Prisma para migrations, tipos e produtividade. Use SQL/migrations manuais para PostGIS, índices especializados, views materializadas e RLS quando o Prisma não expressar corretamente a regra.

Drizzle ou Kysely são alternativas se o projeto precisar de controle SQL mais direto, mas não há motivo para trocar agora.

### 3.4 Cache e filas

Use Redis ou Valkey gerenciado para:

- cache por `cliente_id`, unidade, permissões, filtros e versão dos dados;
- rate limiting distribuído;
- locks de jobs;
- filas de ingestão, exportação e notificações;
- sessões revogadas e tokens bloqueados, se necessário.

Não usar memória do processo Node como cache de produção: ela se perde ao escalar horizontalmente.

Para jobs, BullMQ é uma opção adequada no ecossistema TypeScript. O job precisa ter idempotência, tentativas limitadas, backoff, dead-letter e observabilidade.

### 3.5 Arquivos e imagens

Fotos de campo, anexos, CSVs, PDFs, exports e modelos não devem ser salvos no disco da Vercel ou do container.

Use object storage S3-compatible no Brasil, com:

- upload por URL assinada;
- criptografia em repouso;
- retenção configurável;
- versionamento;
- antivírus e validação de MIME/tamanho;
- metadados de tenant, usuário e finalidade;
- links temporários, nunca URLs públicas permanentes.

### 3.6 Workers e ML

Separe da API web:

- ingestão SINAN, LIRAa, território e planilhas;
- geração de relatórios;
- processamento de fotos/anexos;
- agregações de cobertura;
- treinamento e avaliação de modelos;
- publicação de previsões.

Os workers podem ser TypeScript para tarefas operacionais e Python para o pipeline epidemiológico já existente. Ambos devem escrever resultados versionados no banco/storage, nunca calcular previsões pesadas durante uma requisição da interface.

## 4. Opções de infraestrutura no Brasil

Os preços mudam; devem ser revalidados antes da contratação.

| Opção | API + banco | Vantagem | Limitação |
|---|---|---|---|
| Zenifra | mesma plataforma para aplicação, PostgreSQL, cache e filas | simples, cobrança em real e região São Paulo | validar limites, SLA e recursos antes de contrato municipal |
| VPS brasileira + Docker | API e PostgreSQL no mesmo servidor | menor custo inicial e controle total | backup, segurança, atualização e alta disponibilidade ficam com a equipe |
| CloudPG + serviço de API | banco gerenciado barato e API separada | custo baixo e banco dedicado | dois fornecedores e operação dividida |
| Magalu Cloud/Jataí | computação e PostgreSQL em infraestrutura nacional | opção mais institucional e escalável | preço e arquitetura exigem cotação |
| H3 ou provedor gerenciado equivalente | PostgreSQL operado no Brasil | reduz trabalho operacional | verificar SLA, backups, PostGIS e exportação |

### Recomendação por fase

**MVP comercial:** Zenifra com API, PostgreSQL e Redis/Valkey no Brasil; Vercel apenas para frontend.  
**Primeiras prefeituras:** API em duas instâncias, PostgreSQL gerenciado com backup diário, storage separado e worker dedicado.  
**Escala institucional:** banco com réplicas/alta disponibilidade, filas dedicadas, observabilidade, IaC e contrato de SLA.

Não recomendamos manter produção apenas em uma VPS sem backup testado. O custo menor não compensa o risco para dados de saúde.

## 5. API como produto separado

A API deve ser um produto independente do frontend:

- domínio próprio, por exemplo `api.vigia...`;
- `/v1` versionado e `/v2` quando houver quebra de contrato;
- OpenAPI publicado e validado no CI;
- SDK TypeScript gerado para o frontend;
- autenticação OIDC/OAuth2 ou provedor compatível;
- JWT de curta duração e refresh seguro;
- escopos e permissões por tenant/unidade;
- limites de requisição por cliente;
- `X-Request-ID` em todas as respostas;
- erros estruturados com `code`, `message`, `details` e `request_id`;
- webhooks assinados para eventos futuros;
- métricas por cliente, rota e status HTTP.

O frontend web e um futuro aplicativo municipal devem ser apenas consumidores da API. Nenhum componente visual deve importar repositórios, mocks ou regras de persistência.

## 6. Segurança e saúde

### Identidade e autorização

- OIDC/OAuth2 com MFA para administração e gestão.
- API deriva `cliente_id`, unidade e escopo do token; não aceita esses valores livremente no corpo.
- RBAC combinado com escopo territorial e finalidade.
- API autoriza novamente mesmo que a interface esconda uma opção.
- RLS no PostgreSQL como segunda barreira.
- Revogação de sessão e rotação de chaves.

### Dados e LGPD

- criptografia TLS em trânsito;
- criptografia em repouso;
- minimização de dados pessoais;
- separação de identificadores e dados operacionais;
- trilha de auditoria para leitura, alteração, exportação e compartilhamento;
- retenção e descarte por política municipal;
- anonimização/pseudonimização em treinamento e relatórios de pesquisa;
- registro de finalidade e base legal;
- backups criptografados e restauração testada.

### Operação offline

O app de campo deve usar uma fila local de operações com UUID idempotente, estado `PENDENTE`, `ENVIANDO`, `RECEBIDA`, `REJEITADA` ou `CONFLITO`. A API deve rejeitar duplicidade sem apagar o registro original.

## 7. Modelo de implantação

```text
GitHub
  └── GitHub Actions: lint, typecheck, testes, OpenAPI, migrations de validação

Vercel
  └── Next.js web

Cloud brasileira
  ├── API stateless (2+ réplicas em produção)
  ├── Worker de jobs
  ├── PostgreSQL + PostGIS
  ├── Redis/Valkey
  └── Object Storage

Observabilidade
  ├── logs estruturados
  ├── métricas
  ├── traces OpenTelemetry
  └── alertas e auditoria
```

Use Docker para padronizar desenvolvimento, testes e imagem de produção. Docker não substitui banco gerenciado, backup ou estratégia de migração.

## 8. Banco e evolução do schema

Antes de produção, transformar o modelo lógico de 79 entidades em migrations incrementais:

1. `cliente`, `prefeitura`, `unidade_organizacional` e usuários;
2. papéis, concessões, permissões e auditoria;
3. território, versões e atribuições;
4. imóveis, quarteirões, visitas, retornos e ocorrências;
5. amostras, resultados e estoque;
6. relatórios e documentos;
7. ingestão, datasets, jobs e quarentena;
8. previsões, versões de modelo e indicadores.

Todas as tabelas operacionais devem ter `cliente_id NOT NULL`. FKs devem respeitar o par de tenant quando aplicável. Criar índices para tenant, unidade, ciclo, data epidemiológica, ACE, imóvel e geometria.

Prisma deve executar migrations no deploy controlado, nunca `db push` em produção. Toda migration deve ser revisada, testada em cópia e acompanhada de plano de rollback.

## 9. Observabilidade e confiabilidade

Adicionar antes da primeira prefeitura:

- logs JSON sem dados sensíveis;
- correlação por `request_id`, `tenant_id` e usuário pseudonimizado;
- métricas de latência, erro, fila, banco e cache;
- traces OpenTelemetry;
- alertas de erro 5xx, falhas de autenticação, fila acumulada e espaço de storage;
- health checks separados para processo, banco, cache e dependências;
- backup automático e teste periódico de restauração;
- runbooks de incidente e comunicação municipal.

Não registrar tokens, senhas, CPF, fotos ou payload clínico completo em logs.

## 10. CI/CD e IaC

O pipeline deve bloquear publicação quando falhar:

```text
format:check
lint
typecheck
test
test:api
contrato OpenAPI
build
```

Use ambientes separados para desenvolvimento, homologação e produção. Variáveis secretas ficam no provedor de secrets, nunca no Git. Infraestrutura deve ser declarada por Terraform/OpenTofu ou blueprint equivalente, incluindo banco, cache, storage, filas, DNS e alertas.

## 11. Estratégia de migração futura

Como o banco ainda será iniciado, a portabilidade deve ser planejada agora:

- PostgreSQL + PostGIS em qualquer provedor;
- Prisma migrations versionadas;
- exportação `pg_dump` periódica;
- bucket de backup independente do provedor;
- dados e anexos separados da aplicação;
- nenhuma dependência de IP fixo ou filesystem local;
- configuração somente por variáveis de ambiente;
- teste de restauração em ambiente isolado;
- documentação de RPO/RTO e janela de migração.

Na troca de provedor, executar migração em paralelo, validar contagens e checksums, congelar escritas por uma janela curta, trocar DNS/`DATABASE_URL` e manter o banco anterior somente para rollback.

## 12. Lacunas que impedem produção hoje

Com base na documentação revisada, ainda precisam ser resolvidos:

- schema físico Prisma e migrations reais;
- banco PostgreSQL/PostGIS persistente;
- substituição dos stores em memória;
- API totalmente integrada aos casos de uso e testes de contrato;
- upload seguro de fotos e anexos;
- fila e worker de jobs;
- auditoria persistente;
- OIDC/MFA produtivo;
- RLS e testes de isolamento entre prefeituras;
- backups e restauração automatizados;
- observabilidade e alertas;
- OpenAPI publicado e SDK gerado;
- política de retenção, consentimento e resposta a incidentes;
- homologação com dados reais anonimizados;
- validação municipal dos territórios e do fluxo SisPNCD.

## 13. Decisão recomendada

Para começar de forma escalável sem criar dívida de infraestrutura:

1. manter Next.js na Vercel somente como frontend;
2. manter a API TypeScript/Express em container stateless;
3. contratar PostgreSQL + PostGIS gerenciado em provedor brasileiro;
4. usar Redis/Valkey gerenciado e object storage separado;
5. usar Prisma para migrations e contratos tipados;
6. executar jobs em worker separado;
7. aplicar OpenAPI, RBAC/RLS, auditoria e observabilidade antes de dados municipais reais;
8. manter Docker e IaC para que API, banco e workers possam mudar de provedor sem reescrita.

Essa é a opção mais equilibrada entre custo, soberania de dados, portabilidade, possibilidade de comercializar a API e crescimento para múltiplas prefeituras.

