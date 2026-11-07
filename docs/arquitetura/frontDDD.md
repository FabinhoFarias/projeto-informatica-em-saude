# Organização do front por domínio

O front usa contextos funcionais para agrupar interfaces e componentes. As páginas em `app/(dashboard)/` definem apenas a rota e compõem a tela. Os contratos, regras e dados de demonstração ficam em `lib/<contexto>/`; os componentes visuais ficam em `components/<contexto>/` com os mesmos nomes de contexto. Isso organiza o protótipo sem afirmar que já existe um backend ou persistência DDD.

| Contexto | Responsabilidade | Código de domínio/aplicação | Interface |
|---|---|---|---|
| `territorios` | Município, bairro, indicadores e nível territorial | `lib/territorios/types.ts`, `demo-data.ts`, `risk.ts` | `components/territorios/risk-badge.tsx` |
| `priorizacao` | Regra de sinal, motivos e sugestão para revisão | `lib/priorizacao/types.ts`, `rules.ts`, `recommendations.ts`, `demo-data.ts` | `components/priorizacao/priorizacao-territorial.tsx` |
| `vigilancia` | Leitura situacional e visão geral | Consome contratos territoriais e indicadores de demonstração | `components/vigilancia/` |
| `ingestao` | Leitura, normalização e resultado de planilha no navegador | `lib/ingestao/types.ts`, `processor.ts`, `demo-data.ts` | `components/ingestao/` |
| `planejamento` | Cenários ilustrativos de alocação de recursos | Lógica local da tela; ainda não é um simulador epidemiológico validado | `components/planejamento/` |
| `identidade` | Perfis, permissões e usuários fictícios | `lib/identidade/permissions.ts`, `types.ts`, `demo-users.ts` | `components/identidade/` |
| `operacao` | Posições dos agentes, focos informados e concentração por célula | `lib/operacao/hotspots.ts`, `import-locations.ts` | `components/operacao/hotspot-workspace.tsx` |
| `plataforma` | Navegação, layout e apresentação genérica | `lib/plataforma/navigation.ts`, `format.ts` | `components/plataforma/` |

## Regras de dependência

1. `app` importa a interface do contexto e não contém regra de negócio.
2. `components/<contexto>` pode importar contratos e serviços de `lib/<contexto>` e de contextos dos quais depende; regras puras não devem importar React.
3. `plataforma` concentra estrutura e componentes genéricos. Um elemento específico de risco territorial pertence a `territorios`, mesmo que seja usado em várias telas.
4. `priorizacao` pode consultar `territorios`; `territorios` não depende de `priorizacao`.
5. Dados fictícios ficam em arquivos `demo-data.ts` para serem identificados e substituídos por adaptadores reais no futuro.
6. Interfaces de tipos descrevem contratos locais da UI; não são contratos de API oficial, RNDS ou banco municipal.

## Ao adicionar uma funcionalidade

Defina primeiro o contexto e o tipo da informação em `lib/<contexto>/types.ts`; implemente a regra pura e teste-a; adicione os dados de demonstração somente se a tela ainda não tiver fonte real; crie o componente em `components/<contexto>/`; por último, conecte a rota em `app`. Se dois contextos compartilharem um contrato, mova apenas o contrato comum para um módulo explícito, sem recriar um arquivo genérico que acumule todos os dados do painel.

Esta organização prepara a evolução do protótipo. A autorização por perfil ainda é demonstrativa, a decisão da priorização não persiste e o processamento de planilhas permanece no navegador. Esses limites constam no [roteiro do Marco 2](../marco2MvpSadc.md) e no [documento de requisitos](../documento_de_requisitos.md).
