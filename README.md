This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


## Scripts de integração

Os atalhos estão no `package.json`. `dev` usa `dotenv-cli` para carregar `.env.local`; `lint` usa ESLint porque `next lint` foi removido no Next.js instalado.

O build atual continua em `npm run build`. A cadeia com Prisma e atualização de progresso está em `npm run build:integrations` até existirem o schema, a dependência Prisma e `scripts/update-progress.js`. O `postinstall` só executa `prisma generate` quando `prisma/schema.prisma` existe.

Python/Uvicorn, Streamlit, Prisma, configuração financeira e testes da aplicação possuem atalhos preparados; seus módulos, arquivos e dependências ainda precisam ser implementados. Não executar os comandos de migração/push de banco antes de configurar o destino correto. Os atalhos Git só executam quando chamados explicitamente.

## Fonte única de requisitos

Consulte [docs/documento_de_requisitos.md](docs/documento_de_requisitos.md) para todo o escopo por papéis, campos, fluxos, regras, fontes do e-Visit@ e critérios de aceite. Os antigos arquivos de análise e especificação apenas redirecionam para esse documento.


## Progresso dos requisitos

Cada RF/RNF em `docs/documento_de_requisitos.md` tem um campo `Status` e uma justificativa em `Evidência e lacunas`. Após revisão manual, execute:

```bash
npm run progress
```

A barra e os totais são atualizados no próprio documento. Apenas requisitos com status Implementado entram no numerador; referências repetidas, legenda e exemplos de código não são contados. O comando não consulta o serviço da imagem nem avalia automaticamente o código. Para verificar o cálculo: `node --test scripts/update-progress.test.js`.
