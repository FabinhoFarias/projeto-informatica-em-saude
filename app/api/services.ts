import { apiServerFetch } from "@/app/api/client";

/** Acesso server-side aos recursos da API. Componentes não importam este módulo. */
export const apiServices = {
  dashboard: () => apiServerFetch("/v1/cobertura"),
  coverageByAce: () => apiServerFetch("/v1/cobertura/aces"),
  coverageByTerritory: () => apiServerFetch("/v1/cobertura/territorios"),
  users: () => apiServerFetch("/v1/usuarios"),
  user: (id: string) => apiServerFetch(`/v1/usuarios/${id}`),
  aces: () => apiServerFetch("/v1/usuarios/aces"),
  permissions: () => apiServerFetch("/v1/permissoes"),
  municipalConfiguration: () => apiServerFetch("/v1/configuracao-municipal"),
  territories: () => apiServerFetch("/v1/territorios"),
  blocks: () => apiServerFetch("/v1/quarteiroes"),
  assignments: () => apiServerFetch("/v1/atribuicoes"),
  createAssignment: (body: unknown) =>
    apiServerFetch(
      "/v1/atribuicoes",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
      "GESTOR",
    ),
  properties: (query = "") => apiServerFetch(`/v1/imoveis${query}`),
  visit: (id: string) => apiServerFetch(`/v1/visitas/${id}`),
  visits: (query = "") => apiServerFetch(`/v1/visitas${query}`),
  propertyVisits: (id: string) => apiServerFetch(`/v1/imoveis/${id}/visitas`),
  propertyReturns: (id: string) => apiServerFetch(`/v1/imoveis/${id}/retornos`),
  visitOccurrences: (id: string) =>
    apiServerFetch(`/v1/visitas/${id}/ocorrencias`),
  visitAttachments: (id: string) =>
    apiServerFetch(`/v1/visitas/${id}/anexos`),
  returns: (query = "") => apiServerFetch(`/v1/retornos${query}`),
  synchronizations: () => apiServerFetch("/v1/sincronizacao"),
  synchronization: (id: string) =>
    apiServerFetch(`/v1/sincronizacao/${id}`),
  manualForms: () => apiServerFetch("/v1/fichas-manuais"),
  aceHistory: (id: string) => apiServerFetch(`/v1/usuarios/aces/${id}/historico`),
  aceProperties: (id: string) => apiServerFetch(`/v1/usuarios/aces/${id}/imoveis`),
  samples: () => apiServerFetch("/v1/amostras"),
  sample: (id: string) => apiServerFetch(`/v1/amostras/${id}`),
  stock: () => apiServerFetch("/v1/estoque"),
  stockMovements: () => apiServerFetch("/v1/estoque/movimentacoes"),
  stockConsumption: () => apiServerFetch("/v1/estoque/consumo"),
  dailyReport: () => apiServerFetch("/v1/relatorios/diario"),
  weeklyReport: () => apiServerFetch("/v1/relatorios/semanal"),
  cycleReport: () => apiServerFetch("/v1/relatorios/ciclo"),
  cycles: () => apiServerFetch("/v1/planejamento/ciclos"),
  cycleActions: (id: string) =>
    apiServerFetch(`/v1/planejamento/ciclos/${id}/acoes`),
  maps: () => apiServerFetch("/v1/mapas"),
  aceMap: () => apiServerFetch("/v1/mapas/aces"),
  hotspots: () => apiServerFetch("/v1/hotspots"),
  sanitation: () => apiServerFetch("/v1/saneamento"),
  prioritization: () => apiServerFetch("/v1/priorizacao"),
  diagnosis: () => apiServerFetch("/v1/diagnostico"),
  ingestion: () => apiServerFetch("/v1/ingestao"),
  createOccurrence: (visitId: string, body: unknown) =>
    apiServerFetch(
      `/v1/visitas/${visitId}/ocorrencias`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
      "AGENTE_CAMPO",
    ),
  createAttachment: (visitId: string, body: unknown) =>
    apiServerFetch(
      `/v1/visitas/${visitId}/anexos`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
      "AGENTE_CAMPO",
    ),
  createReturn: (body: unknown) =>
    apiServerFetch(
      "/v1/retornos",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
      "AGENTE_CAMPO",
    ),
  synchronize: (body: unknown) =>
    apiServerFetch(
      "/v1/sincronizacao",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
      "AGENTE_CAMPO",
    ),
};
