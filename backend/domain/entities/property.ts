export type PropertyType =
  | "RESIDENCIAL"
  | "PREDIO"
  | "COMERCIAL"
  | "TERRENO"
  | "ESCOLA"
  | "UBS"
  | "IGREJA"
  | "INDUSTRIAL"
  | "PONTO_ESTRATEGICO"
  | "OUTRO";

export interface Property {
  id: string;
  number: string;
  street: string;
  neighborhood: string;
  sector: string;
  block: number;
  type: PropertyType;
  assignedAceId: string | null;
}
