export interface DemoTerritory {
  id: string;
  nome: string;
  distrito: string;
  notificacoesRecentes: number;
  notificacoesAnteriores: number;
  imoveisPendentes: number;
  focosInformados: number;
}

export interface DemoDecision {
  nivel: "Revisão prioritária" | "Acompanhar" | "Rotina";
  motivos: string[];
  sugestao: string;
}

export type ReviewStatus =
  | "Aguardando análise"
  | "Encaminhado à coordenação"
  | "Mantido em observação";
