# Design de interface — referência Donruan adaptada para ACEs

Guia portátil para reproduzir a linguagem visual da plataforma em outra aplicação. Extraído por análise estática dos estilos, layouts e componentes do front em 07/11/2026, sem iniciar servidor ou realizar validação visual no navegador.

A paleta foi adaptada para tons de verde a pedido do usuário, considerando o uso por ACEs. As cores deste guia são as propostas para a aplicação de destino; as medidas e os comportamentos **observados** descrevem o código existente. As **convenções recomendadas** consolidam suas variações para facilitar uma implementação consistente. Medidas em px consideram `1rem = 16px` e a escala padrão do Tailwind; o guia também pode ser implementado com CSS puro.

## 1. Identidade visual

- Interface clara, com fundo verde muito suave e superfícies brancas.
- Hierarquia construída com espaçamento, títulos escuros e cards delimitados por bordas finas.
- Cantos arredondados moderados em controles e mais amplos em painéis.
- Sombras discretas na interface principal; sombras fortes em elementos flutuantes.
- Verde nas ações frequentes, com identidade institucional personalizável.
- Ícones de traço, geralmente acompanhados de texto.
- Conteúdo organizado em grades e blocos compactos, com pouca decoração.

Não há um tema escuro global definido nas fontes examinadas. Superfícies escuras locais aparecem em sobreposições.

## 2. Cores

### Paleta verde adaptada para ACEs

Esta paleta substitui as cores da referência original para orientar a nova aplicação. Os nomes abaixo são semânticos; não representam os tokens originais do Donruan.

| Token            | Valor     | Papel visual                             |
| ---------------- | --------- | ---------------------------------------- |
| `surface`        | `#FFFFFF` | Cards, campos e superfícies              |
| `canvas`         | `#F7FAF8` | Fundo do shell, header e sidebar         |
| `heading`        | `#14532D` | Títulos e navegação, verde escuro        |
| `text`           | `#253D30` | Corpo, texto de apoio forte e labels     |
| `muted`          | `#52665A` | Texto secundário e metadados             |
| `subtle`         | `#ECFDF5` | Fundos de destaque e hover secundário    |
| `border`         | `#A8BFAF` | Controles e divisões estruturais         |
| `border-soft`    | `#DCE7DF` | Bordas suaves de cards e separadores     |
| `brand`          | `#15803D` | Identidade e navegação selecionada       |
| `action-primary` | `#15803D` | Ação primária, verde 700                 |
| `action-hover`   | `#166534` | Hover da ação, verde 800                 |
| `action-pressed` | `#14532D` | Ação pressionada, verde 900              |
| `focus`          | `#15803D` | Borda e indicador de foco                |
| `success`        | `#166534` | Texto de sucesso sobre fundo `#F0FDF4`   |
| `warning`        | `#92400E` | Texto de pendência sobre fundo `#FFFBEB` |
| `danger`         | `#B91C1C` | Erro/destruição; fundo tonal `#FEF2F2`   |
| `info`           | `#115E59` | Informação; fundo tonal `#F0FDFA`        |

### Ações e estados

- Ação primária: `green-700` (`#15803D`), hover `green-800` (`#166534`), pressed `green-900` (`#14532D`), sempre com texto branco.
- Ação secundária: fundo branco, texto verde escuro, borda padrão e hover `#ECFDF5`.
- Erro/destruição: vermelho, preservado para comunicar risco e falhas.
- Sucesso: fundo verde claro e texto verde escuro, acompanhado de ícone e mensagem para diferenciá-lo das ações da marca.
- Pendência/atenção: âmbar, com fundo claro e texto escuro.
- Informação: verde azulado, com fundo claro e texto escuro.

Os valores hexadecimais da tabela são a referência para implementação. As classes Tailwind indicam a família de cor; se for necessária correspondência exata entre versões, configurar os tokens com esses valores.

### Marca por instituição

Adotar `#15803D` como fallback da marca, inclusive no login e na navegação ativa. A marca pode ser personalizada por instituição, mantendo `brand`, `action-primary`, `action-hover` e `action-pressed` como tokens separados.

A identidade padrão e as ações usam verde. Se a instituição personalizar a marca, definir explicitamente se as ações também devem herdá-la. Manter contraste legível no texto dos botões e distinguir status por texto/ícone, pois o verde também representa a identidade visual.

## 3. Tipografia

O tema declara `Inter, sans-serif`, e diversos componentes usam `font-inter`. O layout raiz carrega Geist e Geist Mono como variáveis, mas não as aplica como família global por uma classe `font-sans`. Não assumir que a fonte Inter está sendo efetivamente carregada só por existir no tema.

**Convenção recomendada para reproduzir a intenção:** carregar Inter explicitamente e definir `font-family: "Inter", system-ui, sans-serif` no corpo. Reservar uma fonte monoespaçada para conteúdo que necessite dela.

| Uso                          | Tamanho observado                  | Peso                     |
| ---------------------------- | ---------------------------------- | ------------------------ |
| Boas-vindas no login         | 30px (`text-3xl`)                  | 700                      |
| Título do header             | 16px → 20px em `sm` → 24px em `md` | 700                      |
| Títulos de cards/dashboard   | 20px (`text-xl`)                   | 700                      |
| Títulos menores              | 18px (`text-lg`)                   | 700                      |
| Texto de formulário e corpo  | 14–16px                            | 400–600                  |
| Botões e labels compactos    | 14px                               | 500–600                  |
| Navegação lateral            | 15px                               | normal; 700 quando ativa |
| Metadados e badges           | 11–12px                            | 600–700                  |
| Números/legendas de gráficos | 9–10px em alguns componentes       | 700                      |

Use entrelinha normal para corpo, compacta (`leading-tight`) para títulos curtos e mais aberta (`leading-relaxed`) para mensagens explicativas. Textos longos em cards usam truncamento ou limite de linhas. Os tamanhos de 9–10px são exceções observadas; prefira ao menos 12px nas legendas da aplicação de destino quando houver espaço.

## 4. Margens e espaçamentos

A escala predominante se apoia em múltiplos de 4px, com intermediários de 2px.

| Valor | Tailwind | Aplicação                                       |
| ----- | -------- | ----------------------------------------------- |
| 4px   | `1`      | Label/campo, microespaçamento                   |
| 6px   | `1.5`    | Padding de botão de ícone compacto              |
| 8px   | `2`      | Ícone/texto, ações relacionadas, badges         |
| 10px  | `2.5`    | Intervalo de itens na sidebar e cards compactos |
| 12px  | `3`      | Padding de cards compactos e grupos de campos   |
| 16px  | `4`      | Espaço entre cards e seções do dashboard        |
| 20px  | `5`      | Padding intermediário                           |
| 24px  | `6`      | Margem interna da página e cards amplos         |
| 32px  | `8`      | Padding amplo em modal                          |
| 40px  | `10`     | Respiro inferior de navegação                   |

### Receitas de espaçamento

- **Página interna:** `padding: 24px` em todos os lados, aplicado pelo shell inclusive no mobile.
- **Dashboard:** `gap: 16px` entre blocos e entre colunas.
- **Card amplo:** `padding: 24px`; conteúdo separado por 12–24px.
- **Card compacto:** `padding: 12px`; intervalos de 8–12px.
- **Formulário:** 12px entre campos na grade; 4px entre label e campo.
- **Botão:** padding horizontal de 16–24px e vertical de 8–12px; gap de 8px.
- **Header:** padding horizontal de 12px no mobile e 24px a partir de `sm`.

Evite somar outro `padding: 24px` no wrapper de cada página quando o shell já fornecer esse espaço. Alinhe títulos, filtros e grades pela mesma borda esquerda.

## 5. Estrutura de layout

### Shell autenticado observado

| Elemento                   | Dimensão/comportamento                             |
| -------------------------- | -------------------------------------------------- |
| Shell                      | `100vh`, flex horizontal, overflow externo oculto  |
| Sidebar desktop recolhida  | 80px                                               |
| Sidebar desktop expandida  | 260px, expansão por hover                          |
| Sidebar mobile             | 280px, fora da tela quando fechada                 |
| Compensação do conteúdo    | Margem esquerda de 80px ou 260px a partir de `md`  |
| Header                     | `8.62vh`, mínimo 60px, máximo 100px                |
| Conteúdo                   | Flexível, `min-width: 0`, rolagem vertical própria |
| Margem interna do conteúdo | 24px                                               |

O dashboard ocupa a largura disponível, sem limite global de largura. Grupos passam de uma coluna para três a partir de `md`. Formulários usam grades de uma ou duas colunas. Listagens compactas de usuários e redações também usam quatro cards por linha em desktop, com largura `calc(25% - 7.5px)`; essa fórmula pressupõe intervalos de 10px em uma linha de quatro cards.

**Convenção recomendada:** implementar listagens novas com CSS Grid para preservar os intervalos sem cálculos manuais. Manter a densidade de acordo com o conteúdo e permitir que os cards cresçam em altura.

### Responsividade

Referência da escala padrão usada pelos prefixos: `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px e `2xl` 1536px. Os arquivos analisados não redefinem esses breakpoints.

- Abaixo de `md`, a sidebar fica sobreposta, com backdrop preto a 40%.
- O botão de menu tem ícone de 24px, padding de 8px e posição a 16px do topo e da esquerda.
- O título do header reserva 48px à esquerda para o menu no mobile.
- Grades começam em uma coluna; expandem conforme o componente.
- Usar `min-width: 0`, quebra de linha e truncamento para evitar que títulos e gráficos alarguem a tela.

## 6. Arredondamentos, bordas e sombras

| Raio            | Classe         | Uso observado/convenção                 |
| --------------- | -------------- | --------------------------------------- |
| 6px             | `rounded-md`   | Badges e controles pequenos             |
| 8px             | `rounded-lg`   | Inputs, botões e itens da sidebar       |
| 12px            | `rounded-xl`   | Selects, ações e cards menores          |
| 16px            | `rounded-2xl`  | Cards de dashboard e questões           |
| 24px            | `rounded-3xl`  | Modal e estados vazios amplos           |
| Circular/pílula | `rounded-full` | Avatares, indicadores e botões de ícone |

Há valores pontuais de **9.638px** em cards de alunos/redações e **6.5px** em suas ações. São particularidades existentes. Para a nova aplicação, a recomendação é consolidá-los em **12px para cards compactos** e **8px para controles**.

- Bordas geralmente têm **1px**, com `#A8BFAF` ou `#DCE7DF`.
- Cards usam `shadow-sm`; a borda continua sendo sua principal delimitação.
- Dropdowns usam sombras maiores, como `shadow-xl`.
- Modais e toasts usam `shadow-2xl`.
- Evitar sombras intensas em todos os cards simultaneamente.

## 7. Componentes

### Card padrão

Superfície branca, borda suave de 1px, raio de 16px, padding de 24px e sombra leve. Cabeçalho flex com título de 20px/700 à esquerda e ação de ícone à direita. Espaço de 16–24px entre cabeçalho e conteúdo. Card compacto: padding de 12–16px e raio de 12px.

### Botões

- Primário: verde, texto branco, 14px/600, raio de 8–12px e ícone de 18–20px.
- Secundário: branco, borda neutra, texto escuro; hover com fundo verde suave.
- Destrutivo: texto/borda vermelhos ou preenchimento vermelho conforme a importância.
- Desabilitado: opacidade de 40–70%, cursor indisponível e bloqueio da ação.
- Loading: spinner junto do texto, com estado desabilitado.
- Login: botão de largura total e altura de 56px.

Não há altura única nos demais botões; resulta de padding e entrelinha. **Recomendação:** usar mínimo de 40px nos controles comuns e 44–48px nos alvos de toque.

### Inputs e selects

Inputs recorrentes: largura total, fundo branco, borda de 1px `#A8BFAF`, raio de 8px, padding horizontal de 16px e vertical de 8px; login usa 12px verticais. Labels de 14px/600 nos formulários administrativos.

Para o select, preservar as medidas do `.select-control` original e aplicar a paleta verde:

- Raio: 12px; borda: `#DCE7DF`; fundo: branco.
- Padding: 10px no eixo vertical, 12px à esquerda e 40px à direita.
- Fonte: 14px/600, cor `#253D30`.
- Seta: 18px, posicionada a 12px da direita.
- Sombra: `0 1px 2px rgb(0 0 0 / 5%)`.
- Hover: borda `#16A34A` e fundo `#F7FAF8`.
- Foco: borda `#15803D` e halo de 4px verde a 15%.
- Desabilitado: opacidade de 60% e cursor indisponível.
- Variante grande: padding vertical de 17px.

A variante neutra do select reduz o destaque de foco. Para novos componentes, preservar um indicador de foco claramente visível também nessa variante.

### Navegação lateral

Itens com fundo branco, borda neutra, raio de 8px, padding vertical de 10px e gap de 12px entre ícone e texto. Quando expandidos, padding horizontal de 16px. Ícones de 24px e traço de 1.75px, alojados em área de 28px. Intervalo vertical entre itens: 10px.

Item ativo: cor institucional de fundo, texto branco, peso 700 e sombra leve. Usar `#15803D` como fallback da cor ativa quando não houver branding institucional.

### Badges e avatares

Badges têm fonte de 11–12px, peso 600–700, fundo tonal e cantos de 6px ou formato de pílula. Para status positivos, usar fundo `#F0FDF4` e texto `#166534`; para pendências, fundo `#FFFBEB` e texto `#92400E`. Preservar o raio de 16px dos indicadores de redação.

Avatares circulares: 44px em cards compactos e 112px no card de identidade, com imagem `object-fit: cover` ou iniciais centralizadas.

### Modais, feedback e estados vazios

O modal de sessão usa superfície branca, raio de 24px, padding de 24px/32px e sombra forte; largura máxima de 420px, margem lateral total de 32px e limite de altura com rolagem interna. Backdrop verde escuro `#052E16` a 60% com desfoque suave.

Toasts administrativos: fundo branco, padding de 16px, raio de 12px, borda esquerda de 4px por status, ícone e mensagem. No original ficam à direita a 24px, perto de `10vh` do topo, com largura mínima de 300px. **Recomendação:** limitar a largura à viewport menos 32px em telas pequenas.

Estados vazios usam conteúdo centralizado, texto secundário, espaço vertical amplo e, em algumas listagens, borda tracejada com raio de 24px.

### Gráficos

Gráficos ficam dentro dos mesmos cards brancos. Títulos de 20px, grades discretas ou tracejadas e rótulos secundários. Na distribuição de notas, a área do gráfico varia de 224px para 256px a partir de `sm`. Usar verdes `#14532D`, `#15803D` e `#4ADE80` como sequência principal, com verde azulado `#0F766E` e âmbar `#D97706` para séries de outra categoria. Manter legendas legíveis e acompanhar indicadores de cor com texto; tons claros devem ficar em preenchimentos, com rótulos escuros.

## 8. Ícones e movimento

- Biblioteca observada: Lucide React. Em outros frameworks, usar o conjunto equivalente Lucide.
- Tamanhos: 16px em ações auxiliares, 18–20px em botões e 24px na navegação.
- Transições de cor/foco: cerca de 200ms.
- Sidebar, expansão e transformações de interface: 300ms, geralmente `ease-in-out`.
- Troca de logos: 500ms, combinando opacidade, escala e desfoque.
- Feedback pontual inclui spinner e redução de escala ao pressionar alguns botões.

Classes como `animate-in` e `fade-in` aparecem no código, mas sua presença no markup não garante que a animação esteja configurada. Ao portar, implementar os keyframes ou instalar/configurar o suporte necessário. **Recomendação:** respeitar `prefers-reduced-motion`.

## 9. Tokens CSS para iniciar outra aplicação

O bloco abaixo é uma **consolidação recomendada**, com nomes semânticos novos. Não é uma cópia literal da configuração original. A família Inter precisa ser carregada pela aplicação de destino.

```css
:root {
  --font-ui: "Inter", system-ui, sans-serif;
  --color-brand: #15803d;
  --color-canvas: #f7faf8;
  --color-surface: #ffffff;
  --color-heading: #14532d;
  --color-text: #253d30;
  --color-muted: #52665a;
  --color-border: #a8bfaf;
  --color-border-soft: #dce7df;
  --color-focus: #15803d;
  --color-subtle: #ecfdf5;
  --color-action-primary: #15803d;
  --color-action-hover: #166534;
  --color-action-pressed: #14532d;
  --color-success: #166534;
  --color-success-surface: #f0fdf4;
  --color-warning: #92400e;
  --color-warning-surface: #fffbeb;
  --color-danger: #b91c1c;
  --color-danger-surface: #fef2f2;
  --color-info: #115e59;
  --color-info-surface: #f0fdfa;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;

  --radius-small: 6px;
  --radius-control: 8px;
  --radius-card-compact: 12px;
  --radius-card: 16px;
  --radius-modal: 24px;
  --radius-pill: 9999px;

  --page-padding: 24px;
  --grid-gap: 16px;
  --sidebar-collapsed: 80px;
  --sidebar-expanded: 260px;
  --sidebar-mobile: 280px;
  --header-height: clamp(60px, 8.62vh, 100px);
  --shadow-soft: 0 1px 2px rgb(0 0 0 / 5%);
  --focus-ring: 0 0 0 4px rgb(21 128 61 / 15%);
  --motion-fast: 200ms;
  --motion-layout: 300ms;
}

body {
  margin: 0;
  font-family: var(--font-ui);
  color: var(--color-text);
  background: var(--color-canvas);
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

.page-content {
  padding: var(--page-padding);
  min-width: 0;
}
.page-stack {
  display: flex;
  flex-direction: column;
  gap: var(--grid-gap);
}
.card {
  min-width: 0;
  padding: var(--space-6);
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-soft);
}
.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--grid-gap);
}
@media (min-width: 768px) {
  .dashboard-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
```

## 10. Regras para implementar telas novas

1. Usar fundo `#F7FAF8`, superfícies brancas e títulos em verde escuro.
2. Manter 24px de margem interna da página e 16px entre blocos principais.
3. Aplicar 24px de padding em cards amplos e 12–16px em cards compactos.
4. Consolidar raios em 8px para controles, 12px para cards compactos, 16px para painéis e 24px para modais.
5. Priorizar bordas finas e sombras leves na área de conteúdo.
6. Usar títulos de card de 20px/700, texto de 14–16px e metadados de 12px.
7. Definir uma ação primária visualmente dominante por contexto, com estados de hover, foco, loading e disabled.
8. Fazer as grades colapsarem no mobile e a navegação lateral virar um painel sobreposto.
9. Carregar a fonte explicitamente e garantir foco visível, contraste e identificação textual de status.
10. Manter esses tokens centralizados; usar exceções de medida apenas quando o conteúdo justificar.

## 11. Fontes da extração

Os caminhos abaixo são referências ao repositório Donruan; o restante deste documento é autocontido e pode ser copiado para outro projeto. As fontes justificam a estrutura e as medidas; a paleta verde é uma adaptação posterior, não uma descrição das cores presentes nesses arquivos.

- `app/globals.css`: tema ativo em CSS, cores e select global.
- `app/layout.tsx`: configuração real das fontes e viewport.
- `components/AppShell.tsx`: margens, rolagem e compensação da sidebar.
- `components/Header.tsx` e `components/Sidebar.tsx`: dimensões, navegação e responsividade.
- `app/(content)/dashboard/page.tsx`: grades e espaçamento de seções.
- `components/perfil/PerfilResumo.tsx`, `PerfilIdentidade.tsx` e `DistribuicaoNotas.tsx`: cards, tipografia, avatares e gráficos.
- `components/ui/cardAluno.tsx` e `components/redacao/cardRedacao.tsx`: cards compactos e medidas particulares.
- `components/usuarios/DadosBasicosFields.tsx` e `FeedbackToast.tsx`: formulários e feedback.
- `components/questoes/CardQuestao.tsx`: alternativas, ações e estados.
- `components/auth/LoginForm.tsx` e `SessionExpiredModal.tsx`: autenticação e modal.
- `app/(content)/usuarios/page.tsx`: ações primárias, dropdown e estado vazio.

O projeto usa Tailwind 4 com `@theme` em `app/globals.css`. O `tailwind.config.js` contém mapeamentos anteriores e aponta para `src/`, enquanto os componentes analisados estão em `app/` e `components/`. Para reproduzir o design, priorizar o CSS global e os componentes reais; não copiar esse arquivo de configuração isoladamente.
