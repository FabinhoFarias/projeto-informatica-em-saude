export const municipalModuleCatalog = [
  {
    id: "painel",
    label: "Visão geral",
    route: "/painel",
    description: "Indicadores, alertas, produção e visão executiva municipal.",
  },
  {
    id: "campo",
    label: "Operação de campo",
    route: "/visitas",
    description: "Imóveis, visitas, retornos e produção dos ACEs.",
  },
  {
    id: "digitacao",
    label: "Digitação e relatórios",
    route: "/digitacao-relatorios",
    description: "Transcrição de fichas em papel e consolidados por período.",
  },
  {
    id: "mapas",
    label: "Mapas operacionais",
    route: "/mapas",
    description: "Camadas territoriais, imóveis e posições informadas.",
  },
  {
    id: "hotspots",
    label: "Hotspots",
    route: "/hotspots",
    description: "Concentração espacial de ocorrências e pontos prioritários.",
  },
  {
    id: "laboratorio",
    label: "Laboratório",
    route: "/laboratorio",
    description: "Amostras, recebimento e resultados entomológicos.",
  },
  {
    id: "priorizacao",
    label: "Priorização territorial",
    route: "/priorizacao-territorial",
    description: "Risco territorial e recomendações operacionais.",
  },
  {
    id: "diagnostico",
    label: "Diagnóstico situacional",
    route: "/diagnostico",
    description: "Indicadores, séries e análise da situação municipal.",
  },
  {
    id: "ingestao",
    label: "Ingestão de dados",
    route: "/ingestao",
    description: "Planilhas e fontes municipais autorizadas.",
  },
  {
    id: "simulacao",
    label: "Simulação e projeto piloto",
    route: "/simulacao",
    description: "Cenários, capacidade e planejamento de intervenção.",
  },
  {
    id: "usuarios",
    label: "Gestão de usuários",
    route: "/usuarios",
    description: "Perfis, vínculos, papéis e acesso dos profissionais.",
  },
] as const;

export type MunicipalModuleId = (typeof municipalModuleCatalog)[number]["id"];

export interface MunicipalUnitMock {
  id: string;
  name: string;
  type: "SECRETARIA" | "VIGILANCIA" | "LABORATORIO" | "DISTRITO";
  active: boolean;
}

export interface MunicipalClientMock {
  id: string;
  name: string;
  ibgeCode: string;
  state: string;
  status: "PILOTO" | "ATIVO";
  units: MunicipalUnitMock[];
  modules: Record<MunicipalModuleId, boolean>;
  branding: {
    shortName: string;
    primaryColor: string;
    secondaryColor: string;
    logoLabel: string;
  };
  parameters: {
    cycleDays: number;
    strategicInspectionDays: number;
    defaultZone: string;
    epidemiologicalWeekStart: string;
  };
  catalogs: { name: string; version: string; items: number }[];
  territoryCount: number;
}

export const municipalClientsDemo: MunicipalClientMock[] = [
  {
    id: "lagoa-de-itaenga",
    name: "Prefeitura de Lagoa de Itaenga",
    ibgeCode: "2608503",
    state: "PE",
    status: "PILOTO",
    units: [
      {
        id: "li-sms",
        name: "Secretaria Municipal de Saúde",
        type: "SECRETARIA",
        active: true,
      },
      {
        id: "li-va",
        name: "Vigilância Ambiental",
        type: "VIGILANCIA",
        active: true,
      },
      {
        id: "li-lab",
        name: "Laboratório municipal",
        type: "LABORATORIO",
        active: false,
      },
    ],
    modules: {
      painel: true,
      campo: true,
      digitacao: true,
      mapas: true,
      hotspots: true,
      laboratorio: true,
      priorizacao: true,
      diagnostico: true,
      ingestao: true,
      simulacao: true,
      usuarios: true,
    },
    branding: {
      shortName: "Lagoa de Itaenga",
      primaryColor: "#006b4f",
      secondaryColor: "#dbeafe",
      logoLabel: "Brasão municipal",
    },
    parameters: {
      cycleDays: 60,
      strategicInspectionDays: 15,
      defaultZone: "Urbana",
      epidemiologicalWeekStart: "Domingo",
    },
    catalogs: [
      { name: "Tipos de imóvel", version: "2026.1", items: 10 },
      { name: "Depósitos Aedes", version: "2026.1", items: 7 },
      { name: "Atividades antivetoriais", version: "2026.1", items: 6 },
    ],
    territoryCount: 10,
  },
  {
    id: "recife",
    name: "Prefeitura do Recife",
    ibgeCode: "2611606",
    state: "PE",
    status: "ATIVO",
    units: [
      {
        id: "rec-sesau",
        name: "Secretaria de Saúde do Recife",
        type: "SECRETARIA",
        active: true,
      },
      {
        id: "rec-vsa",
        name: "Vigilância em Saúde Ambiental",
        type: "VIGILANCIA",
        active: true,
      },
      {
        id: "rec-ds6",
        name: "Distrito Sanitário VI",
        type: "DISTRITO",
        active: true,
      },
      {
        id: "rec-lab",
        name: "Laboratório de Entomologia",
        type: "LABORATORIO",
        active: true,
      },
    ],
    modules: {
      painel: true,
      campo: true,
      digitacao: true,
      mapas: true,
      hotspots: true,
      laboratorio: true,
      priorizacao: true,
      diagnostico: true,
      ingestao: true,
      simulacao: true,
      usuarios: true,
    },
    branding: {
      shortName: "Recife",
      primaryColor: "#0057b8",
      secondaryColor: "#facc15",
      logoLabel: "Marca da Prefeitura do Recife",
    },
    parameters: {
      cycleDays: 60,
      strategicInspectionDays: 14,
      defaultZone: "Urbana",
      epidemiologicalWeekStart: "Domingo",
    },
    catalogs: [
      { name: "Tipos de imóvel", version: "2026.2", items: 12 },
      { name: "Depósitos Aedes", version: "2026.1", items: 7 },
      { name: "Distritos sanitários", version: "2026.3", items: 8 },
    ],
    territoryCount: 94,
  },
];
