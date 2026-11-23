# API do VIGIA+

**Status:** primeira versão mockada, executável localmente e preparada para receber persistência real.

Este documento descreve o que já está implementado na API, como executar e quais decisões do planejamento anterior foram preservadas. A API é uma porta de acesso independente do front-end: futuramente outros aplicativos (web, celular ou integrações municipais) poderão consumir os mesmos contratos.

## 1. Visão arquitetural

O planejamento registrado em [`docs/arquitetura/frontDDD.md`](../../../docs/arquitetura/frontDDD.md), no modelo de banco e nos diagramas de consulta Web → API previa:

- um front-end separado da camada de dados;
- API versionada em `/v1`;
- autorização por usuário, perfil, prefeitura e unidade;
- uma futura combinação de BFF, serviços de API, PostgreSQL/PostGIS, Redis e workers;
- contratos que permitam substituir mocks por adaptadores reais sem reescrever as telas.

A implementação atual mantém essa direção, com uma API Express/TypeScript mockada. O banco, Prisma, Redis, filas, BFF e autenticação municipal real ainda não foram conectados.

```text
Front-end Next.js / futuro aplicativo
              │ HTTPS + Bearer JWT
              ▼
app/api/server        composição HTTP, middlewares e rotas
              │
              ▼
backend/application   casos de uso
backend/domain        entidades e interfaces (ports)
              │
              ▼
backend/infrastructure repositórios mockados
              │
              └── futuro: Prisma/PostgreSQL/PostGIS, sem alterar os casos de uso
```

### Organização do código

- `app/api/server/app.ts`: cria o Express, registra middlewares, autenticação e rotas.
- `app/api/server/main.ts`: ponto de entrada do servidor HTTP.
- `app/api/server/security.ts`: JWT, perfis, permissões e middlewares de autorização.
- `backend/domain/entities/`: entidades do domínio, atualmente com `Property`.
- `backend/domain/repositories/`: contratos (`PropertyRepository`).
- `backend/application/use-cases/`: casos de uso (`ListPropertiesUseCase` e `GetPropertyUseCase`).
- `backend/infrastructure/repositories/`: implementação mockada dos repositórios.
- `backend/infrastructure/mock-data.ts`: dados fictícios identificáveis pela origem `MOCK`.

A inversão de dependência fica na aplicação: os casos de uso recebem interfaces do domínio; `createApi(repository)` permite injetar outro repositório sem mudar a camada HTTP. Quando o Prisma for adotado, deve ser criado um adaptador em `backend/infrastructure`, mantendo a mesma interface.

## 2. Execução local

Instale as dependências e suba a API:

```bash
npm install
npm run api:dev
```

Por padrão, o servidor escuta em `http://localhost:4000`. A porta pode ser alterada com `API_PORT`.

Teste o estado da API:

```bash
curl http://localhost:4000/health
```

O front-end continua sendo iniciado separadamente com `npm run dev`.

## 3. Variáveis de ambiente

Nunca versionar arquivos `.env*`. Em desenvolvimento, use um arquivo local:

```dotenv
API_PORT=4000
API_JWT_SECRET=uma-chave-local-com-pelo-menos-32-caracteres
API_ALLOWED_ORIGINS=http://localhost:3000
SENHA_DEMO=vigia-demo-local
```

Em produção:

- `API_JWT_SECRET` é obrigatório e deve possuir pelo menos 32 caracteres;
- `API_ALLOWED_ORIGINS` deve conter somente origens reais autorizadas, separadas por vírgula;
- o login mockado fica desabilitado;
- a API exige HTTPS, considerando `x-forwarded-proto` quando executada atrás de proxy;
- `SENHA_DEMO` serve apenas para o ambiente de demonstração e não substitui o provedor de identidade real.

## 4. Autenticação e autorização

`GET /health` é público. O login de demonstração é a única rota pública em `/v1`:

```http
POST /v1/auth/login
Content-Type: application/json

{"email":"gestor@demo.local","password":"vigia-demo-local","role":"GESTOR"}
```

Resposta:

```json
{
  "data": {
    "user": {
      "id": "u-2",
      "email": "gestor@demo.local",
      "role": "GESTOR",
      "municipalityId": "lagoa-de-itaenga"
    },
    "accessToken": "<jwt>",
    "expiresIn": 1800
  }
}
```

As demais rotas exigem:

```http
Authorization: Bearer <accessToken>
```

O token é assinado com HS256, possui emissor e audiência fixos, expira em 30 minutos e carrega `sub`, `email`, `role` e `municipalityId`. A API rejeita token ausente, inválido, expirado ou com algoritmo/issuer/audience incorretos.

### Perfis e permissões

| Perfil | Acesso principal |
|---|---|
| `ADMIN` | usuários, território, visitas, laboratório, relatórios, estoque, planejamento, mapas, priorização e diagnóstico |
| `GESTOR` | gestão territorial, visitas, laboratório, relatórios, estoque, planejamento, mapas, priorização e diagnóstico |
| `AGENTE_CAMPO` | leitura territorial, imóveis/visitas, registro de visita e mapas |
| `LABORATORISTA` | território, fila/amostras, resultados e exportação de relatórios |
| `DIGITADOR` | território, visitas, digitação e relatórios |
| `EPIDEMIOLOGISTA` | território, relatórios, mapas, priorização e diagnóstico |

O middleware `requirePermission` retorna `403` quando o perfil não possui a permissão. Para imóveis, há ainda escopo por usuário: um agente de campo só lista e consulta imóveis atribuídos ao próprio `user.id`; imóveis de outro agente respondem `404` para não revelar sua existência.

## 5. Proteções HTTP implementadas

- `helmet` para cabeçalhos de segurança;
- CORS com allowlist de `API_ALLOWED_ORIGINS`, sem wildcard;
- limite de requisições de 120 por minuto por origem/IP;
- limite de corpo JSON de 1 MB;
- HTTPS obrigatório em produção;
- respostas de autorização sem expor detalhes internos;
- segredo JWT gerado aleatoriamente quando não está em produção e não foi configurado;
- escopo municipal presente no token, preparado para isolamento por `municipalityId`/`cliente_id`.

Estas proteções são a base do protótipo. Ainda será necessário adicionar refresh token, revogação de sessão, auditoria, CSRF para BFF com cookie, validação de payload por endpoint, RLS no banco e identidade municipal real antes de produção.

## 6. Endpoints disponíveis

Todas as respostas, salvo `204`, usam o envelope `{ "data": ... }`. Erros usam `{ "error": "..." }`. Os endpoints abaixo são mockados e retornam dados demonstrativos ou aceitam gravações apenas em memória.

### Autenticação e administração

| Método | Rota | Permissão | Situação |
|---|---|---|---|
| `POST` | `/v1/auth/login` | pública em desenvolvimento | implementado; login demo |
| `GET` | `/v1/auth/me` | token | implementado |
| `POST` | `/v1/auth/logout` | token | implementado; encerra no cliente |
| `GET` | `/v1/usuarios` | `users:read` | mock |
| `GET` | `/v1/usuarios/aces` | `users:read` | mock |
| `GET` | `/v1/permissoes` | `users:read` | mock |
| `GET` | `/v1/configuracao-municipal` | `territory:read` | mock |

### Território, atribuições e cobertura

| Método | Rota | Permissão | Situação |
|---|---|---|---|
| `GET` | `/v1/territorios` | `territory:read` | bairros mockados de Lagoa de Itaenga |
| `GET` | `/v1/quarteiroes` | `territory:read` | 30 quarteirões demonstrativos |
| `GET` | `/v1/atribuicoes` | `territory:read` | contrato disponível; ainda sem registros |
| `GET` | `/v1/cobertura` | `reports:read` | cobertura geral do ciclo |
| `GET` | `/v1/cobertura/aces` | `reports:read` | cobertura por ACE demonstrativa |
| `GET` | `/v1/cobertura/territorios` | `reports:read` | cobertura por território demonstrativa |
| `GET` | `/v1/imoveis` | `visits:read` | filtros `busca`, `quarteirao` e `aceId` |
| `GET` | `/v1/imoveis/:id` | `visits:read` | imóvel individual com escopo do ACE |

### Operação de campo

| Método | Rota | Permissão | Situação |
|---|---|---|---|
| `POST` | `/v1/visitas` | `visits:write` | cria registro mock com pendência de sincronização |
| `GET` | `/v1/visitas/:id` | `visits:read` | consulta mock |
| `GET` | `/v1/visitas/:id/ocorrencias` | `visits:read` | mock |
| `POST` | `/v1/visitas/:id/ocorrencias` | `visits:write` | cria ocorrência mock |
| `POST` | `/v1/visitas/:id/anexos` | `visits:write` | cria anexo mock |
| `GET` | `/v1/retornos` | `visits:read` | mock |

### Laboratório, estoque e relatórios

| Método | Rota | Permissão | Situação |
|---|---|---|---|
| `GET` | `/v1/amostras` | `laboratory:read` | fila mockada |
| `GET` | `/v1/amostras/:id` | `laboratory:read` | consulta amostra |
| `POST` | `/v1/amostras/:id/resultado` | `laboratory:write` | registra resultado mock |
| `GET` | `/v1/estoque` | `stock:read` | saldo de larvicidas e tubitos |
| `GET` | `/v1/estoque/movimentacoes` | `stock:read` | mock vazio |
| `GET` | `/v1/relatorios/diario` | `reports:read` | resumo diário |
| `GET` | `/v1/relatorios/semanal` | `reports:read` | consolidado semanal |
| `GET` | `/v1/relatorios/ciclo` | `reports:read` | consolidado por ciclo |

### Planejamento, mapas e análise

| Método | Rota | Permissão | Situação |
|---|---|---|---|
| `GET` | `/v1/planejamento/ciclos` | `planning:read` | ciclos mockados |
| `GET` | `/v1/planejamento/ciclos/:id/acoes` | `planning:read` | ações mockadas |
| `GET` | `/v1/mapas` | `maps:read` | referência municipal mockada |
| `GET` | `/v1/hotspots` | `maps:read` | contrato mock |
| `GET` | `/v1/ocorrencias` | `visits:read` | ocorrências mock |
| `GET` | `/v1/saneamento` | `territory:read` | ocorrências de saneamento mock |
| `GET` | `/v1/ingestao` | `territory:manage` | status da ingestão mock |
| `GET` | `/v1/priorizacao` | `prioritization:read` | contrato mock |
| `GET` | `/v1/diagnostico` | `diagnosis:read` | contrato mock |

## 7. Filtros e exemplo de consulta

```bash
TOKEN="..."
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:4000/v1/imoveis?quarteirao=10&busca=Rua%20das%20Palmeiras"
```

Os casos de uso de imóveis validam busca por número, nome de logradouro e número do quarteirão. A resposta contém `data` com os imóveis e metadados do mock. Paginação, cursor, ordenação e filtros avançados ainda devem ser definidos antes da integração com o banco de 996 imóveis.

## 8. Contratos futuros preservados

Os diagramas em `docs/arquitetura/preview/` continuam sendo a referência para a evolução: leituras de risco devem usar snapshots publicados, filtros territoriais devem respeitar tenant/unidade, respostas devem evoluir para DTOs versionados com `request_id`, `ETag` e flags de qualidade, e simulações/exportações devem ser jobs assíncronos com idempotência.

O modelo lógico em `docs/arquitetura/banco/` permanece uma especificação, não uma migration executável. A futura persistência deve preservar `cliente_id`, vigência de atribuições, histórico de visitas, versões documentais, auditoria, identidade offline e relações com laboratório/estoque.

## 9. O que ainda não está implementado

- persistência Prisma/PostgreSQL/PostGIS;
- dados reais de prefeitura, CNES, SisPNCD, mapas e imóveis;
- criação/edição persistente de ciclos, atribuições, visitas, amostras, estoque e ocorrências;
- OpenAPI/Swagger publicado e geração automática de clientes;
- validação Zod individual dos corpos de mutação;
- paginação/cursor, ETags e `request_id`;
- refresh/revogação de tokens, MFA, auditoria e RLS;
- upload real e armazenamento seguro de fotos/anexos;
- fila, workers e endpoints de jobs para simulações/exportações;
- BFF Next.js com cookie HttpOnly e proteção CSRF;
- login integrado ao provedor de identidade da prefeitura.

Por isso, esta API está pronta para demonstrar os fluxos e validar contratos, mas ainda não deve ser usada para dados pessoais ou operação de saúde em produção.

## 10. Critério para substituir os mocks

1. Definir e validar o schema Prisma conforme o modelo lógico documentado.
2. Implementar adaptadores de repositório em `backend/infrastructure`.
3. Substituir cada rota mock por um caso de uso validado, sem acessar Prisma diretamente no controller.
4. Aplicar `municipalityId`, unidade, perfil e escopo territorial em todas as consultas.
5. Adicionar validação de entrada, auditoria, testes de autorização e testes de contrato.
6. Publicar OpenAPI e conectar o front por um cliente tipado.
7. Só então habilitar identidade real, uploads, jobs e dados de produção.

Essa sequência preserva o desenho anterior e evita que o protótipo acabe acoplado ao banco ou a um único front-end.

## 11. Fluxo ACE integrado em memória

A versão atual possui um armazenamento em memória atrás da API para validar o fluxo completo sem antecipar o schema Prisma. Foram acrescentados:

- `POST /v1/visitas` e `GET /v1/visitas/:id`;
- `GET /v1/imoveis/:id/visitas`;
- `GET /v1/usuarios/aces/:id/historico`;
- `GET /v1/usuarios/aces/:id/imoveis`;
- `GET/POST /v1/retornos` e `GET /v1/imoveis/:id/retornos`;
- `GET/POST /v1/visitas/:id/ocorrencias`;
- `POST /v1/visitas/:id/anexos`;
- `GET/POST /v1/atribuicoes`;
- `POST /v1/sincronizacao` e `GET /v1/sincronizacao/:operationUuid`;
- relatórios diário, semanal e por ciclo calculados a partir das visitas em memória.

O armazenamento está em `backend/infrastructure/stores/ace-memory-store.ts`. Os dados sobrevivem à navegação enquanto o processo da API estiver ativo, mas são apagados quando o servidor reinicia. A futura implementação Prisma deve substituir esse adaptador mantendo os contratos HTTP e casos de uso.
