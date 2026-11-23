import { OverviewDashboard } from "@/components/vigilancia/overview-dashboard";
import {
  ManagerOperationsDashboard,
  type ManagerDashboardData,
} from "@/components/vigilancia/manager-operations-dashboard";
import { apiServerFetch } from "@/app/api/client";

export const instant = false;

export default async function OverviewPage() {
  const [
    coverage,
    territories,
    aces,
    blocks,
    properties,
    neighborhoods,
    dailyReport,
    visits,
    synchronizations,
    assignments,
  ] = await Promise.all([
    apiServerFetch<ManagerDashboardData["coverage"]>("/v1/cobertura"),
    apiServerFetch<ManagerDashboardData["territories"]>(
      "/v1/cobertura/territorios",
    ),
    apiServerFetch<ManagerDashboardData["aces"]>("/v1/cobertura/aces"),
    apiServerFetch<ManagerDashboardData["blocks"]>("/v1/quarteiroes"),
    apiServerFetch<Array<Record<string, unknown>>>("/v1/imoveis"),
    apiServerFetch<ManagerDashboardData["neighborhoods"]>("/v1/territorios"),
    apiServerFetch<Record<string, unknown>>("/v1/relatorios/diario"),
    apiServerFetch<Array<Record<string, unknown>>>("/v1/visitas"),
    apiServerFetch<Array<Record<string, unknown>>>("/v1/sincronizacao"),
    apiServerFetch<Array<Record<string, unknown>>>("/v1/atribuicoes"),
  ]);
  const normalizedProperties = properties
    .filter((property) => property.assignedAceId)
    .map((property) => ({
      id: String(property.id ?? property.codigoLocal ?? ""),
      neighborhood: String(property.territorioId ?? ""),
      quarteirao: String(property.quarteirao ?? ""),
      lastVisitStatus: property.ultimaVisita ? "VISITADO" : undefined,
    }));
  const propertiesByTerritory = new Map<string, typeof normalizedProperties>();
  normalizedProperties.forEach((property) => {
    const key = property.neighborhood.toLocaleLowerCase("pt-BR");
    const current = propertiesByTerritory.get(key) ?? [];
    current.push(property);
    propertiesByTerritory.set(key, current);
  });
  const territoryRows = territories.map((territory) => {
    const territoryName = String(
      territory.name ?? (territory as { nome?: string }).nome ?? territory.id,
    );
    const territoryProperties =
      propertiesByTerritory.get(territoryName.toLocaleLowerCase("pt-BR")) ?? [];
    return {
      ...territory,
      name: String(
        territory.name ?? (territory as { nome?: string }).nome ?? territory.id,
      ),
      district: String(territory.district ?? "Área Urbana"),
      properties: territoryProperties.length,
      visited: territoryProperties.filter(
        (property) => property.lastVisitStatus,
      ).length,
    };
  });
  const aceRows = aces.map((ace) => {
    const assignedBlocks = new Set(
      assignments
        .filter(
          (assignment) =>
            String(assignment.aceId ?? assignment.usuarioId ?? "") === ace.id,
        )
        .map((assignment) =>
          String(assignment.quarteirao ?? assignment.block ?? ""),
        ),
    );
    const assigned = assignedBlocks.size
      ? normalizedProperties.filter((property) =>
          assignedBlocks.has(String(property.quarteirao)),
        ).length
      : Math.round(
          (coverage.atribuidos ?? properties.length) / Math.max(1, aces.length),
        );
    const visitedByAce = visits.filter(
      (visit) => String(visit.aceId ?? visit.autorId ?? "") === ace.id,
    ).length;
    const assignedFromApi = Number(
      (ace as { atribuidos?: number }).atribuidos ?? assigned,
    );
    const visitedFromApi = Number(
      (ace as { visitados?: number }).visitados ?? visitedByAce,
    );
    return {
      ...ace,
      assigned: assignedFromApi,
      visited: visitedFromApi,
      pending: Math.max(0, assignedFromApi - visitedFromApi),
      cobertura: assignedFromApi
        ? Math.round((visitedFromApi / assignedFromApi) * 100)
        : ace.cobertura,
    };
  });
  const apiData: ManagerDashboardData = {
    coverage,
    territories: territoryRows,
    aces: aceRows,
    blocks,
    propertiesTotal: coverage.atribuidos ?? properties.length,
    municipality: {
      name: "Lagoa de Itaenga",
      state: "PE",
      prefeitura: "Prefeitura de Lagoa de Itaenga",
    },
    neighborhoods,
    properties: normalizedProperties,
    dailyReport: {
      dates: dailyReport.data ? [String(dailyReport.data)] : [],
      latest: {
        visitas: Number(dailyReport.visitas ?? 0),
        retornos: Number(dailyReport.retornos ?? 0),
        amostras: Number(dailyReport.amostras ?? 0),
      },
    },
    fieldSummary: {
      assigned: normalizedProperties.length,
      received: synchronizations.length || visits.length,
      pending: Math.max(0, normalizedProperties.length - visits.length),
    },
  };
  return <OverviewDashboard managerData={apiData} />;
}
