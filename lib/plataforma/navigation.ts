export interface NavigationItem {
  href: string;
  label: string;
  icon: string;
  /** `pc` aparece apenas no desktop; `todos` aparece em PC, tablet e celular. */
  display: "pc" | "todos";
}

export const navigationItems: NavigationItem[] = [
  {
    href: "/painel",
    label: "Visão geral",
    icon: "dashboard",
    display: "todos",
  },
  {
    href: "/visitas",
    label: "Imóveis do setor",
    icon: "visitas",
    display: "todos",
  },
  {
    href: "/laboratorio",
    label: "Laboratório",
    icon: "laboratorio",
    display: "todos",
  },
  {
    href: "/digitacao-relatorios",
    label: "Digitação e relatórios",
    icon: "digitacao",
    display: "todos",
  },
  {
    href: "/territorio-conferencia",
    label: "Conferência territorial",
    icon: "territorio",
    display: "pc",
  },
  {
    href: "/estoque",
    label: "Estoque e insumos",
    icon: "estoque",
    display: "pc",
  },
  {
    href: "/saneamento",
    label: "Saneamento e ocorrências",
    icon: "saneamento",
    display: "pc",
  },
  { href: "/mapas", label: "Mapas", icon: "mapas", display: "todos" },
  {
    href: "/priorizacao-territorial",
    label: "Priorização territorial",
    icon: "priorizacao",
    display: "todos",
  },
  {
    href: "/diagnostico",
    label: "Diagnóstico situacional",
    icon: "diagnostico",
    display: "todos",
  },
  {
    href: "/ingestao",
    label: "Ingestão de dados",
    icon: "ingestao",
    display: "pc",
  },
  {
    href: "/simulacao",
    label: "Projeto PILOTO",
    icon: "simulacao",
    display: "pc",
  },
  {
    href: "/usuarios",
    label: "Gestão de usuários",
    icon: "usuarios",
    display: "pc",
  },
  {
    href: "/configuracao-municipal",
    label: "Configuração municipal",
    icon: "configuracao",
    display: "pc",
  },
];
