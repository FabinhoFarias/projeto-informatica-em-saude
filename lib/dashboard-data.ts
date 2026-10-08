export type MunicipalityConfiguration = {
  name: string;
  state: string;
  prefeitura: string;
  district: string;
};

export const municipality: MunicipalityConfiguration = {
  name: "Recife",
  state: "PE",
  prefeitura: "Prefeitura da Cidade do Recife",
  district: "Distritos Sanitários do Recife",
} as const;

export type RiskLevel = "Baixo" | "Médio" | "Alto" | "Crítico";

export type Neighborhood = {
  id: string;
  name: string;
  city: typeof municipality.name;
  district: string;
  population: number;
  suspectedCases: number;
  forecastCases: number;
  ratePer100k: number;
  incidenceProbability: number;
  risk: RiskLevel;
  density: number;
  vectorFoci: number;
  apsVisits: number;
  apsCases: number;
  apsStatus: string;
  trigger: boolean;
};

export const neighborhoods: Neighborhood[] = [
  { id: "boa-viagem", name: "Boa Viagem", city: municipality.name, district: "Distrito Sanitário VI", population: 122922, suspectedCases: 238, forecastCases: 326, ratePer100k: 194, incidenceProbability: 76, risk: "Crítico", density: 13320, vectorFoci: 15.8, apsVisits: 642, apsCases: 168, apsStatus: "Pressão elevada", trigger: true },
  { id: "ibura", name: "Ibura", city: municipality.name, district: "Distrito Sanitário VI", population: 50312, suspectedCases: 184, forecastCases: 274, ratePer100k: 366, incidenceProbability: 84, risk: "Crítico", density: 8910, vectorFoci: 19.2, apsVisits: 518, apsCases: 143, apsStatus: "Pressão elevada", trigger: true },
  { id: "casa-amarela", name: "Casa Amarela", city: municipality.name, district: "Distrito Sanitário III", population: 29000, suspectedCases: 96, forecastCases: 142, ratePer100k: 331, incidenceProbability: 68, risk: "Alto", density: 11840, vectorFoci: 12.4, apsVisits: 386, apsCases: 102, apsStatus: "Atenção", trigger: true },
  { id: "varzea", name: "Várzea", city: municipality.name, district: "Distrito Sanitário IV", population: 70453, suspectedCases: 112, forecastCases: 176, ratePer100k: 159, incidenceProbability: 57, risk: "Alto", density: 6900, vectorFoci: 10.8, apsVisits: 421, apsCases: 96, apsStatus: "Atenção", trigger: true },
  { id: "afogados", name: "Afogados", city: municipality.name, district: "Distrito Sanitário V", population: 36983, suspectedCases: 79, forecastCases: 124, ratePer100k: 213, incidenceProbability: 53, risk: "Médio", density: 10210, vectorFoci: 8.7, apsVisits: 332, apsCases: 74, apsStatus: "Em observação", trigger: true },
  { id: "santo-amaro", name: "Santo Amaro", city: municipality.name, district: "Distrito Sanitário I", population: 27939, suspectedCases: 66, forecastCases: 101, ratePer100k: 236, incidenceProbability: 49, risk: "Médio", density: 12360, vectorFoci: 7.9, apsVisits: 296, apsCases: 68, apsStatus: "Em observação", trigger: false },
  { id: "agua-fria", name: "Água Fria", city: municipality.name, district: "Distrito Sanitário II", population: 42872, suspectedCases: 91, forecastCases: 147, ratePer100k: 212, incidenceProbability: 62, risk: "Alto", density: 15340, vectorFoci: 13.6, apsVisits: 364, apsCases: 88, apsStatus: "Atenção", trigger: true },
  { id: "madalena", name: "Madalena", city: municipality.name, district: "Distrito Sanitário IV", population: 23296, suspectedCases: 28, forecastCases: 42, ratePer100k: 120, incidenceProbability: 22, risk: "Baixo", density: 11780, vectorFoci: 3.6, apsVisits: 218, apsCases: 29, apsStatus: "Estável", trigger: false },
];

export const riskColors: Record<RiskLevel, { foreground: string; background: string }> = {
  Baixo: { foreground: "#2E7D32", background: "#E8F5E9" },
  Médio: { foreground: "#F57F17", background: "#FFFDE7" },
  Alto: { foreground: "#E65100", background: "#FFF3E0" },
  Crítico: { foreground: "#C62828", background: "#FFEBEE" },
};

export const formatNumber = (value: number) =>
  new Intl.NumberFormat("pt-BR").format(value);

export const recommendationsFor = (neighborhood: Neighborhood) => {
  if (neighborhood.risk === "Crítico") {
    return [
      `Intensificar bloqueio de vetor nas quadras prioritárias de ${neighborhood.name} nas próximas 48h.`,
      "Alocar 5 agentes suplementares para aplicação de larvicida e vistoria domiciliar.",
      "Acionar a unidade de APS local para busca ativa de casos febris.",
    ];
  }

  if (neighborhood.risk === "Alto") {
    return [
      `Programar vistoria focal em ${neighborhood.name} nas próximas 72h.`,
      "Reforçar equipes ACE em imóveis com focos recorrentes.",
      "Monitorar atendimentos febris na unidade de APS de referência.",
    ];
  }

  return [
    `Manter rotina de visitas domiciliares em ${neighborhood.name}.`,
    "Revisar focos identificados na última rodada de LIRAa/LIA.",
    "Acompanhar a tendência de notificações na próxima semana epidemiológica.",
  ];
};

export const navigationItems = [
  { href: "/", label: "Visão geral", icon: "◫" },
  { href: "/diagnostico", label: "Diagnóstico situacional", icon: "⌁" },
  { href: "/ingestao", label: "Ingestão de dados", icon: "⇧" },
  { href: "/simulacao", label: "Simulação de recursos", icon: "⤢" },
  { href: "/usuarios", label: "Gestão de usuários", icon: "◎" },
];
