import { neighborhoods } from "@/lib/territorios/demo-data";
import type { DemoTerritory } from "./types";

export const demoTerritories: DemoTerritory[] = neighborhoods.slice(0, 8).map((territory) => ({
  id: territory.id,
  nome: territory.name,
  distrito: territory.district,
  notificacoesRecentes: territory.suspectedCases,
  notificacoesAnteriores: Math.max(1, territory.suspectedCases - 6),
  imoveisPendentes: 8 + (territory.apsVisits % 35),
  focosInformados: Math.round(territory.vectorFoci),
}));
