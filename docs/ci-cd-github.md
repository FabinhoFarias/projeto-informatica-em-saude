# CI/CD no GitHub

O workflow `.github/workflows/ci-cd.yml` controla a qualidade, o build e a
entrega contínua do VIGIA+.

## Quando o pipeline é executado

- Em todo pull request direcionado à `main`;
- Em todo push para a `main`;
- Manualmente pela aba **Actions** do GitHub.

Execuções antigas da mesma branch são canceladas quando um commit mais novo é
enviado.

## Barreiras de qualidade

O job **Qualidade do código** executa, nesta ordem:

1. `npm ci` para instalar exatamente as versões do `package-lock.json`;
2. `npm run format:check`;
3. `npm run lint:check`;
4. `npm run typecheck`;
5. `npm run test:unit`.

O job **Build de produção** só começa depois da aprovação de todas essas
verificações e executa `npm run build` com Node.js 22.

## Ativação do deploy automático

A entrega só é avaliada após um push aprovado na `main`. Para conectá-la a um
provedor que ofereça deploy hook:

1. No repositório do GitHub, acesse **Settings > Environments**;
2. Crie o ambiente `production`;
3. Em **Environment secrets**, crie `DEPLOY_HOOK_URL`;
4. Cole a URL secreta fornecida pelo provedor de hospedagem.

Sem esse segredo, o pipeline valida e compila o sistema normalmente, informa
que o deploy ainda não foi conectado e termina com sucesso. A URL nunca é
gravada no código nem exibida nos logs.

## Proteção recomendada da `main`

Em **Settings > Branches > Add branch protection rule**, selecione `main` e
habilite:

- Require a pull request before merging;
- Require status checks to pass before merging;
- Require branches to be up to date before merging;
- Selecione `Qualidade do código` e `Build de produção` como verificações
  obrigatórias;
- Do not allow bypassing the above settings, caso a política da equipe permita.

Essa configuração impede que código com formatação, lint, tipos, testes ou
build inválidos entre na branch principal.
