import { OverviewDashboard } from "@/components/vigilancia/overview-dashboard";
import type { ManagerDashboardData } from "@/components/vigilancia/manager-operations-dashboard";
import { apiServerFetch } from "@/app/api/client";

export const instant = false;

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ cicloId?: string }>;
}) {
  const query = await searchParams;
  const cicloId = query.cicloId ?? "ciclo-2026-6";
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
    cycles,
    returns,
  ] = await Promise.all([
    apiServerFetch<ManagerDashboardData["coverage"]>(
      `/v1/cobertura?cicloId=${cicloId}`,
    ),
    apiServerFetch<ManagerDashboardData["territories"]>(
      `/v1/cobertura/territorios?cicloId=${cicloId}`,
    ),
    apiServerFetch<ManagerDashboardData["aces"]>(
      `/v1/cobertura/aces?cicloId=${cicloId}`,
    ),
    apiServerFetch<ManagerDashboardData["blocks"]>("/v1/quarteiroes"),
    // O ciclo atual usa os primeiros 60 quarteirões (até 1.980 imóveis).
    // Limitar esta leitura evita transferir imóveis ainda não atribuídos ao painel.
    apiServerFetch<Array<Record<string, unknown>>>("/v1/imoveis?limit=2000"),
    apiServerFetch<ManagerDashboardData["neighborhoods"]>("/v1/territorios"),
    apiServerFetch<Record<string, unknown>>(
      `/v1/relatorios/diario?cicloId=${cicloId}`,
    ),
    apiServerFetch<Array<Record<string, unknown>>>(
      `/v1/visitas?cicloId=${cicloId}`,
    ),
    apiServerFetch<Array<Record<string, unknown>>>("/v1/sincronizacao"),
    apiServerFetch<Array<Record<string, unknown>>>("/v1/atribuicoes"),
    apiServerFetch<Array<Record<string, unknown>>>("/v1/planejamento/ciclos"),
    apiServerFetch<Array<Record<string, unknown>>>(
      `/v1/retornos?cicloId=${cicloId}`,
    ),
  ]);
  const aceHistories = Object.fromEntries(
    await Promise.all(
      aces.map(
        async (ace) =>
          [
            ace.id,
            await apiServerFetch<Record<string, unknown>>(
              `/v1/usuarios/aces/${ace.id}/historico?cicloId=${cicloId}`,
            ),
          ] as const,
      ),
    ),
  );
  const normalizedProperties = properties
    .filter((property) => property.assignedAceId)
    .map((property) => ({
      id: String(property.id ?? property.codigoLocal ?? ""),
      neighborhood: String(property.territorioId ?? ""),
      quarteirao: String(property.quarteirao ?? ""),
      lastVisitStatus: (() => {
        const visit = visits.find(
          (item) => String(item.imovelId ?? "") === String(property.id ?? ""),
        );
        return visit ? String(visit.acesso ?? "REALIZADO") : undefined;
      })(),
    }));
  const propertiesByTerritory = new Map<string, typeof normalizedProperties>();
  const statusCounts = normalizedProperties.reduce(
    (counts, property) => {
      const status = String(property.lastVisitStatus ?? "SEM_VISITA");
      if (status === "REALIZADO") counts.realizado += 1;
      else if (status === "RECUSA") counts.recusa += 1;
      else if (status === "FECHADO") counts.fechado += 1;
      else counts.semVisita += 1;
      return counts;
    },
    { realizado: 0, recusa: 0, fechado: 0, semVisita: 0 },
  );
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
      : Number((ace as { atribuidos?: number }).atribuidos ?? 0);
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
    propertiesTotal: Number(coverage.atribuidos ?? 0),
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
      received: synchronizations.length,
      pending: Number(coverage.pendentes ?? 0),
    },
    statusCounts: { ...statusCounts, retornos: returns.length },
    cycleId: cicloId,
    cycles: cycles.map((cycle) => ({
      id: String(cycle.id ?? ""),
      nome: String(cycle.nome ?? cycle.id ?? ""),
      status: String(cycle.status ?? ""),
    })),
    aceHistories,
  };
  return <OverviewDashboard managerData={apiData} />;
}
