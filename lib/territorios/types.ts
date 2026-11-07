export interface MunicipalityConfiguration {
  name: string;
  state: string;
  prefeitura: string;
  district: string;
}

export type RiskLevel = "Baixo" | "Médio" | "Alto" | "Crítico";

export interface Neighborhood {
  id: string;
  name: string;
  city: string;
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
}
