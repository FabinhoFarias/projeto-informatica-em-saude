# Modelo consolidado do banco — Denguinhos

**Revisão:** 27/10/2026. Base: [requisitos v2.2](../../documento_de_requisitos.md), diagramas e dicionário em `DER/`.

O arquivo único para revisar o banco é [modelo_completo.puml](modelo_completo.puml). Ele reúne **79 entidades**, seus atributos, chaves identificadas, referências e relacionamentos em notação de Chen. As entidades repetidas como `[ref]` nas visões por domínio aparecem uma única vez.

[Abrir visualizador com busca e zoom](modelo_completo.html) · [Ampliar o diagrama completo em SVG](modelo_completo.svg) · [Consultar visões menores por domínio](DER/README.md)

O HTML permite buscar entidades, ampliar e arrastar o desenho sem depender de servidor. O SVG é panorâmico: use zoom para consultar os atributos. Retângulos representam entidades, losangos representam relacionamentos e elipses representam atributos; chaves identificadas são sublinhadas. Cada limite `(mínimo,máximo)` exprime a participação da entidade na associação. `N` nas fontes e `n` no SVG significam muitos.

## Como esse arquivo orienta o banco

- O cliente/prefeitura é a raiz do isolamento (`cliente_id`); secretaria/departamento/setor é unidade organizacional, e município é referência geográfica.
- Todas as definições do dicionário foram incorporadas, incluindo versões, identidade offline, entidades associativas, moradores, laboratório, documentos, modelos e entregas de predições.
- Relacionamentos entre módulos foram resolvidos, sem criar tabelas distintas para as referências. FKs explícitas não desenhadas nas visões modulares foram acrescentadas ao consolidado.
- As declarações e comentários do arquivo preservam PK/FK, opcionalidade identificada, origem dos atributos, regras de unicidade e restrições transversais do esboço.
- Tipos não definidos na origem aparecem como `A_DEFINIR`, em vez de receberem arbitrariamente texto, número ou data. Esse marcador é uma pendência de modelagem e não um tipo PostgreSQL.

**Nível de prontidão:** este é o modelo lógico consolidado para produzir o schema físico. Não é DDL executável nem um banco já criado. Antes de gerar migrations, resolver tipos pendentes, nulabilidade, domínios de valores, índices, FKs compostas por cliente, políticas RLS e regras que exigem validação transacional. Também detalhar tabelas de suporte citadas nos requisitos, mas ainda não definidas nos esboços (por exemplo, auditoria e jobs). O arquivo consolida as entidades atualmente documentadas; não declara essas lacunas implementadas.

Nenhum requisito passa a Implementado pela existência do diagrama. A lista de requisitos e sua avaliação continuam no documento principal.

## Revisão e reprodução

O `.puml` é autocontido para revisar entidades, atributos e relacionamentos: não usa `!include` para buscar fragmentos. Após a consolidação inicial, alterações no arquivo devem ser revisadas antes de qualquer regeneração a partir dos esboços.

O script de consolidação recusa substituir o arquivo existente por padrão:

```bash
python3 docs/arquitetura/banco/consolidar_modelo.py
```

Para regenerar deliberadamente depois de conciliar alterações com `DER/`, usar `--force`. Isso substitui a revisão consolidada pelos dados dos esboços; não executar automaticamente no build.

O SVG é exportado do consolidado com o mesmo renderizador local usado nas visões menores (`@viz-js/viz`):

```bash
node docs/arquitetura/banco/renderizar_modelo_completo.mjs /private/tmp/denguinhos-der-render/node_modules/@viz-js/viz/dist/viz.js
```

A pasta temporária do renderizador é uma dependência de exportação, não do banco ou da aplicação. A prévia nativa PlantUML de `@startchen` requer versão compatível e Java Runtime. O arquivo completo é maior que os recortes; preferir SVG local para evitar limite de cabeçalho de um servidor remoto.
