# Integração do front-end com a API

**Atualização:** 22/11/2026  
**Escopo:** rotas do App Router e módulos operacionais do VIGIA+.

Este documento registra o que já atravessa a API, o que ainda usa dados mockados no front-end e quais contratos precisam ser implementados para concluir a integração. A regra arquitetural é:

```text
app/(dashboard)/rota/page.tsx
        ↓
app/api/client.ts e app/api/services.ts
        ↓
API /v1
        ↓
componente por props
```

Componentes em `components/` não devem executar `fetch`, importar repositórios ou conhecer URLs da API.

## Status resumido

| Rota/módulo | Leitura pela API | Escrita pela API | Situação |
|---|---:|---:|---|
| `/painel` | Sim | Não se aplica | indicadores, territórios, ACEs, imóveis, quarteirões, visitas, sincronizações e relatórios carregados pela API |
| `/visitas` | Sim | Não se aplica | imóveis paginados pela API |
| `/visitas/[idImovel]` | Sim | Parcial | imóvel e ficha principal integrados; ocorrências, anexos e retornos pendentes na interface |
| `/usuarios` | Sim | Não | usuários e territórios carregados pela API; ações administrativas ainda locais |
| `/usuarios/ace/[id]` | Sim | Não | perfil, histórico e imóveis do ACE integrados |
| `/territorio-conferencia` | Sim | Não | conferência e atribuições carregadas pela API; alteração ainda não conectada |
| `/laboratorio` | Parcial | Não | fila inicial integrada; transições e resultado ainda locais |
| `/planejamento` | Sim | Não | ciclos são carregados pela API; criação/edição ainda local |
| `/digitacao-relatorios` | Sim | Não | fichas e relatórios são carregados pela API; transcrição ainda local |
| `/estoque` | Sim | Não | estoque, movimentações e consumo são carregados pela API |
| `/saneamento` | Sim | Não | ocorrências são carregadas pela API |
| `/mapas` | Sim | Não | metadados do mapa, hotspots e posições de ACE são carregados pela API |
| `/hotspots` | Não | Não | redireciona para `/mapas` |
| `/priorizacao-territorial` | Sim | Não | dados de priorização carregados pela API; decisão ainda local |
| `/diagnostico` | Sim | Não | indicadores carregados pela API; visualizações complementares locais |
| `/ingestao` | Sim | Não | status de ingestão carregado pela API; processamento do arquivo ainda no navegador |
| `/simulacao` | Sim | Não | territórios e cobertura carregados pela API; simulação ainda local |
| `/configuracao-municipal` | Sim | Não | configuração e permissões carregadas pela API; alterações ainda locais |

## 1. `/painel`

### Já integrado

A página consulta:

```http
GET /v1/cobertura
GET /v1/cobertura/territorios
GET /v1/cobertura/aces
GET /v1/quarteiroes
GET /v1/imoveis
```

Esses dados alimentam a visão do gestor de cobertura municipal, territórios, ACEs e imóveis.

### Situação atual

O painel agora recebe um DTO completo produzido pela página server-side. Os
componentes não importam `demo-data`, repositórios ou regras de domínio: apenas
renderizam os dados recebidos e disparam eventos de interface. A página agrega
visitas, atribuições, imóveis, sincronizações, cobertura e relatórios antes de
renderizar o painel.

O filtro por ciclo e a separação detalhada de recusas/fechados dependem de o
endpoint fornecer `cicloId` e os status de visita no contrato definitivo.

Endpoints necessários:

```http
GET /v1/cobertura?cicloId=...
GET /v1/cobertura/aces?cicloId=...
GET /v1/cobertura/territorios?cicloId=...
GET /v1/relatorios/diario?cicloId=...
```

## 2. `/visitas`

### Já integrado

```http
GET /v1/imoveis
```

A consulta aceita `busca`, `quarteirao`, `aceId`, `page` e `limit`.

### Pendências

- Carregar ciclos pela API;
- Filtrar a lista pelo ciclo selecionado;
- Consultar status da última visita diretamente da API;
- Remover qualquer estado de sessão usado para representar visita.

```http
GET /v1/planejamento/ciclos
GET /v1/imoveis?cicloId=...&page=...&limit=...
```

## 3. `/visitas/[idImovel]`

### Já integrado

```http
GET /v1/imoveis/:id
POST /v1/visitas
```

O `POST /v1/visitas` é chamado por Server Action em `app/(dashboard)/visitas/actions.ts`.

### Pendências

Conectar os controles da ficha:

```http
GET  /v1/imoveis/:id/visitas
GET  /v1/imoveis/:id/retornos
GET  /v1/visitas/:id/ocorrencias
GET  /v1/visitas/:id/anexos
POST /v1/visitas/:id/ocorrencias
POST /v1/visitas/:id/anexos
POST /v1/retornos
POST /v1/sincronizacao
```

Também é necessário retirar o status visual fictício de sincronização e utilizar a resposta da API.

## 4. `/usuarios`

### Já integrado

```http
GET /v1/usuarios
GET /v1/territorios
```

### Pendências

As ações do cadastro ainda alteram somente o estado React. Implementar:

```http
POST  /v1/usuarios
PATCH /v1/usuarios/:id
POST  /v1/usuarios/:id/ativar
POST  /v1/usuarios/:id/desativar
POST  /v1/usuarios/:id/redefinir-senha
PUT   /v1/usuarios/:id/permissoes
```

## 5. `/usuarios/ace/[id]`

### Já integrado

```http
GET /v1/usuarios/aces
GET /v1/usuarios/aces/:id/historico
GET /v1/usuarios/aces/:id/imoveis
```

### Pendências

O histórico deve incluir também:

- atribuições atuais;
- ciclo consultado;
- sincronizações;
- retornos separados por motivo;
- amostras coletadas;
- consumo de larvicida;
- ocorrências e anexos.

```http
GET /v1/atribuicoes?aceId=...
GET /v1/sincronizacao?aceId=...
GET /v1/retornos?aceId=...
GET /v1/amostras?aceId=...
GET /v1/estoque/consumo?aceId=...
```

## 6. `/territorio-conferencia`

### Já integrado

```http
GET /v1/usuarios/aces
GET /v1/territorios
GET /v1/quarteiroes
GET /v1/atribuicoes
GET /v1/imoveis
```

### Pendências

O seletor de ACE ainda não chama a API. Implementar:

```http
POST /v1/atribuicoes
```

Para conferência territorial:

```http
PATCH /v1/imoveis/:id/status-territorial
POST  /v1/imoveis/:id/divergencias
```

## 7. `/laboratorio`

### Já integrado

```http
GET /v1/amostras
```

### Pendências

```http
GET  /v1/amostras/:id
POST /v1/amostras/:id/receber
POST /v1/amostras/:id/iniciar-analise
POST /v1/amostras/:id/resultado
POST /v1/amostras/:id/concluir
```

Também é necessário vincular cada amostra a:

- imóvel;
- visita;
- ACE;
- ciclo;
- coleta;
- resultado laboratorial.

## 8. `/planejamento`

### Pendências

```http
GET   /v1/planejamento/ciclos
GET   /v1/planejamento/ciclos/:id/acoes
POST  /v1/planejamento/ciclos
PATCH /v1/planejamento/ciclos/:id
POST  /v1/planejamento/ciclos/:id/acoes
POST  /v1/planejamento/ciclos/:id/publicar
```

A página deve deixar de manter ciclos, atividades e territórios apenas no estado local.

## 9. `/digitacao-relatorios`

### Pendências

```http
GET  /v1/fichas-manuais
POST /v1/fichas-manuais
GET  /v1/relatorios/diario
GET  /v1/relatorios/semanal
GET  /v1/relatorios/ciclo
```

A origem da ficha (`PAPEL` ou `DIGITAL`) deve ser persistida na API.

## 10. `/estoque`

### Pendências

```http
GET  /v1/estoque
GET  /v1/estoque/movimentacoes
GET  /v1/estoque/consumo
POST /v1/estoque/movimentacoes
```

O consumo precisa estar relacionado à visita, ao imóvel, ao ACE, ao produto e ao ciclo.

## 11. `/saneamento`

### Pendências

```http
GET   /v1/saneamento
GET   /v1/ocorrencias
POST  /v1/saneamento
PATCH /v1/saneamento/:id
POST  /v1/saneamento/:id/historico
```

## 12. `/mapas` e `/hotspots`

### Pendências

```http
GET /v1/mapas
GET /v1/mapas/aces
GET /v1/hotspots
GET /v1/territorios
GET /v1/imoveis?bbox=...
```

Os marcadores de imóveis, ACEs e hotspots ainda precisam deixar de usar arrays locais. A consulta por `bbox` deve ser implementada antes de carregar todos os imóveis no mapa.

## 13. `/priorizacao-territorial`

### Pendências

```http
GET  /v1/priorizacao
GET  /v1/territorios
GET  /v1/cobertura/territorios
POST /v1/priorizacao/:id/decisao
POST /v1/priorizacao/:id/revisao
```

As regras de priorização devem ser executadas na API para que outros clientes obtenham o mesmo resultado.

## 14. `/diagnostico`

### Pendências

```http
GET /v1/diagnostico
GET /v1/territorios
GET /v1/cobertura/territorios
GET /v1/relatorios/ciclo
```

O diagnóstico não deve calcular indicadores exclusivamente no navegador.

## 15. `/ingestao`

### Pendências

```http
GET  /v1/ingestao
POST /v1/ingestao/arquivos
GET  /v1/ingestao/:id
GET  /v1/ingestao/:id/erros
POST /v1/ingestao/:id/confirmar
```

O processamento e a validação do arquivo devem sair do navegador. O front deve enviar o arquivo e consultar o status do processamento.

## 16. `/simulacao`

### Pendências

```http
POST /v1/simulacoes
GET  /v1/simulacoes/:id
GET  /v1/simulacoes/:id/resultado
```

Por ser uma operação potencialmente longa, recomenda-se retornar `202` e processar por job assíncrono.

## 17. `/configuracao-municipal`

### Pendências

```http
GET   /v1/configuracao-municipal
PATCH /v1/configuracao-municipal
PUT   /v1/configuracao-municipal/modulos
PUT   /v1/configuracao-municipal/branding
POST  /v1/configuracao-municipal/unidades
```

As alterações de módulos, branding, catálogos e unidades ainda são apenas locais.

## 18. Relatório diário

### `/api/relatorios/resumo-diario`

A rota Next ainda monta o relatório a partir de `lib/visitas/daily-report.ts`. Deve funcionar como BFF e consultar:

```http
GET /v1/relatorios/diario?data=AAAA-MM-DD
```

O template HTML pode continuar no Next.js, mas os dados devem vir exclusivamente do retorno da API.

## 19. Critérios de conclusão

Uma rota só deve ser considerada integrada quando:

- a página em `app` consulta a API;
- o componente recebe os dados por props ou por um contrato de apresentação;
- não há mock de execução no componente;
- GETs possuem estado de carregamento e erro;
- ações de escrita usam Server Actions em `app`;
- permissões são verificadas pela API;
- os dados respeitam o município e o escopo territorial;
- há teste de autorização e resposta HTTP;
- `npx tsc --noEmit --incremental false` passa;
- `npm run build` passa.

## 20. Ordem recomendada de implementação

1. Concluir `/painel` e cobertura baseada em visitas;
2. Concluir `/usuarios` e ações administrativas;
3. Concluir `/visitas/[idImovel]`, ocorrências, anexos e retornos;
4. Concluir `/laboratorio`;
5. Concluir `/territorio-conferencia` e atribuições;
6. Concluir `/planejamento`;
7. Concluir `/estoque` e consumo;
8. Concluir `/saneamento`;
9. Concluir `/mapas` e hotspots;
10. Concluir `/digitacao-relatorios`;
11. Concluir `/ingestao`;
12. Concluir `/priorizacao-territorial`, `/diagnostico` e `/simulacao`;
13. Concluir `/configuracao-municipal`;
14. Migrar o relatório diário para a API.
