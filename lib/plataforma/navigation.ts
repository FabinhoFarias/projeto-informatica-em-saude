export interface NavigationItem {
  href: string;
  label: string;
  icon: string;
}

export const navigationItems: NavigationItem[] = [
  { href: "/painel", label: "Visão geral", icon: "◫" },
  { href: "/visitas", label: "Meu setor · visitas", icon: "✓" },
  { href: "/hotspots", label: "Mapa de hotspots", icon: "◉" },
  {
    href: "/priorizacao-territorial",
    label: "Priorização territorial",
    icon: "◇",
  },
  { href: "/diagnostico", label: "Diagnóstico situacional", icon: "⌁" },
  { href: "/ingestao", label: "Ingestão de dados", icon: "⇧" },
  { href: "/simulacao", label: "Simulação de recursos", icon: "⤢" },
  { href: "/usuarios", label: "Gestão de usuários", icon: "◎" },
];
