export type TerritoryReviewStatus = "VALIDADO" | "DIVERGENCIA" | "CONFERIR";
export interface TerritoryReviewItem {
  id: string;
  street: string;
  number: string;
  neighborhood: string;
  sector: string;
  block: number;
  status: TerritoryReviewStatus;
  issue: string;
}
export const territoryReviewDemo: TerritoryReviewItem[] = [
  {
    id: "tr-1",
    street: "Rua das Palmeiras",
    number: "2",
    neighborhood: "Centro",
    sector: "Setor 02",
    block: 1,
    status: "VALIDADO",
    issue: "",
  },
  {
    id: "tr-2",
    street: "Rua do Açude",
    number: "18",
    neighborhood: "Nova Itaenga",
    sector: "Setor 04",
    block: 3,
    status: "DIVERGENCIA",
    issue: "Número informado na ficha difere do cadastro.",
  },
  {
    id: "tr-3",
    street: "Travessa do Sol",
    number: "s/n",
    neighborhood: "Centro",
    sector: "Setor 02",
    block: 2,
    status: "CONFERIR",
    issue: "Imóvel sem número formal no cadastro.",
  },
  {
    id: "tr-4",
    street: "Rua da Estação",
    number: "44",
    neighborhood: "Vila Boa Esperança",
    sector: "Setor 06",
    block: 5,
    status: "VALIDADO",
    issue: "",
  },
];

export interface StockItem {
  id: string;
  name: string;
  unit: string;
  balance: number;
  minimum: number;
  consumed: number;
}
export const stockDemo: StockItem[] = [
  {
    id: "bti",
    name: "Larvicida biológico Bti",
    unit: "gramas",
    balance: 840,
    minimum: 500,
    consumed: 1260,
  },
  {
    id: "diflu",
    name: "Diflubenzuron",
    unit: "gramas",
    balance: 180,
    minimum: 300,
    consumed: 720,
  },
  {
    id: "tubitos",
    name: "Tubitos para coleta",
    unit: "unidades",
    balance: 92,
    minimum: 60,
    consumed: 148,
  },
  {
    id: "epi",
    name: "Luvas descartáveis",
    unit: "pares",
    balance: 24,
    minimum: 40,
    consumed: 176,
  },
];

export type SanitationStatus = "ABERTO" | "EM_TRATATIVA" | "RESOLVIDO";
export interface SanitationPoint {
  id: string;
  type: string;
  address: string;
  neighborhood: string;
  responsible: string;
  deadline: string;
  status: SanitationStatus;
  notes: string;
}
export const sanitationDemo: SanitationPoint[] = [
  {
    id: "san-1",
    type: "Água parada em área pública",
    address: "Rua do Açude, s/n",
    neighborhood: "Nova Itaenga",
    responsible: "Secretaria de Obras",
    deadline: "2026-11-20",
    status: "EM_TRATATIVA",
    notes: "Solicitada drenagem e limpeza.",
  },
  {
    id: "san-2",
    type: "Descarte irregular de resíduos",
    address: "Travessa do Sol, 80",
    neighborhood: "Centro",
    responsible: "Vigilância Ambiental",
    deadline: "2026-11-18",
    status: "ABERTO",
    notes: "Aguardando vistoria conjunta.",
  },
  {
    id: "san-3",
    type: "Terreno com acúmulo de água",
    address: "Rua da Estação, 44",
    neighborhood: "Vila Boa Esperança",
    responsible: "Proprietário notificado",
    deadline: "2026-11-12",
    status: "RESOLVIDO",
    notes: "Limpeza comprovada em visita de retorno.",
  },
];
