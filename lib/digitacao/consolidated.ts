import { sectorPropertiesDemo } from "@/lib/visitas/demo-data";

export type ConsolidationPeriod =
  | "SEMANA"
  | "MES"
  | "CICLO"
  | "SEMANA_EPIDEMIOLOGICA";
export interface ConsolidatedFilters {
  period: ConsolidationPeriod;
  reference: string;
}

function epidemiologicalWeek(date: Date) {
  const utc = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  return Math.ceil(
    ((utc.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7,
  );
}

function matchesPeriod(dateValue: string, filters: ConsolidatedFilters) {
  const date = new Date(`${dateValue}T12:00:00-03:00`);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  if (filters.period === "MES") return dateValue.startsWith(filters.reference);
  if (filters.period === "CICLO") {
    const [cycle, referenceYear] = filters.reference.split("/").map(Number);
    return year === referenceYear && Math.floor((month - 1) / 2) + 1 === cycle;
  }
  if (filters.period === "SEMANA_EPIDEMIOLOGICA")
    return (
      `${year}-SE${String(epidemiologicalWeek(date)).padStart(2, "0")}` ===
      filters.reference
    );
  const [start, end] = filters.reference.split("|");
  return dateValue >= start && dateValue <= end;
}

export function buildPeriodConsolidated(filters: ConsolidatedFilters) {
  const visits = sectorPropertiesDemo.flatMap((property) =>
    property.ultimaVisita &&
    matchesPeriod(property.ultimaVisita.dataAtividade, filters)
      ? [{ property, visit: property.ultimaVisita }]
      : [],
  );
  const completed = visits.filter(({ visit }) => visit.acesso === "REALIZADO");
  return {
    visits: visits.length,
    inspected: completed.length,
    pending: visits.length - completed.length,
    deposits: visits.reduce(
      (total, { visit }) =>
        total +
        Object.values(visit.formulario.depositos).reduce(
          (sum, value) => sum + value,
          0,
        ),
      0,
    ),
    samples: visits.reduce(
      (total, { visit }) => total + visit.formulario.quantidadeTubitos,
      0,
    ),
    treated: visits.filter(({ visit }) => visit.formulario.imovelTratado)
      .length,
    blocks: new Set(visits.map(({ property }) => property.quarteirao)).size,
  };
}
