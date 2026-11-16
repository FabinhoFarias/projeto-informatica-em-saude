export interface NavigationItem {
  href: string;
  label: string;
  icon: string;
  /** `pc` aparece apenas no desktop; `todos` aparece em PC, tablet e celular. */
  display: "pc" | "todos";
}

export const navigationItems: NavigationItem[] = [
  { href: "/painel", label: "Visão geral", icon: "◫", display: "todos" },
  {
    href: "/visitas",
    label: "Imóveis do setor",
    icon: "✓",
    display: "todos",
  },
  {
    href: "/laboratorio",
    label: "Laboratório",
    icon: "⌬",
    display: "todos",
  },
  {
    href: "/digitacao-relatorios",
    label: "Digitação e relatórios",
    icon: "▤",
    display: "todos",
  },
  { href: "/mapas", label: "Mapas", icon: "◉", display: "todos" },
  {
    href: "/priorizacao-territorial",
    label: "Priorização territorial",
    icon: "◇",
    display: "todos",
  },
  {
    href: "/diagnostico",
    label: "Diagnóstico situacional",
    icon: "⌁",
    display: "todos",
  },
  { href: "/ingestao", label: "Ingestão de dados", icon: "⇧", display: "pc" },
  { href: "/simulacao", label: "Projeto PILOTO", icon: "⤢", display: "pc" },
  { href: "/usuarios", label: "Gestão de usuários", icon: "◎", display: "pc" },
  {
    href: "/configuracao-municipal",
    label: "Configuração municipal",
    icon: "⚙",
    display: "pc",
  },
];
