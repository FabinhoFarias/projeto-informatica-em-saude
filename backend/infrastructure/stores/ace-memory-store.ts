import crypto from "node:crypto";

export type StoredRecord = Record<string, unknown> & { id: string };

const seededVisitCount = 240;
const demoAceIds = ["u-4", "u-5", "u-8", "u-10"];
const visits: StoredRecord[] = Array.from(
  { length: seededVisitCount },
  (_, index) => ({
    id: `visita-seed-${index + 1}`,
    imovelId: `property-${index + 1}`,
    aceId: demoAceIds[index % demoAceIds.length],
    cicloId: "ciclo-2026-6",
    acesso:
      index % 19 === 0 ? "RECUSA" : index % 17 === 0 ? "FECHADO" : "REALIZADO",
    statusConteudo: "CONCLUIDO",
    status: "SINCRONIZADO",
    origem: "MOCK_SEED",
    createdAt: `2026-11-${String((index % 22) + 1).padStart(2, "0")}T08:00:00-03:00`,
  }),
);
const occurrences: StoredRecord[] = [];
const attachments: StoredRecord[] = [];
const returns: StoredRecord[] = visits
  .filter((visit) => visit.acesso === "RECUSA" || visit.acesso === "FECHADO")
  .map((visit, index) => ({
    id: `retorno-seed-${index + 1}`,
    imovelId: visit.imovelId,
    aceId: visit.aceId,
    cicloId: visit.cicloId,
    motivo: visit.acesso === "RECUSA" ? "RECUSA" : "FECHADO",
    status: "PENDENTE",
    createdAt: visit.createdAt,
  }));
const assignments: StoredRecord[] = Array.from({ length: 12 }, (_, index) => ({
  id: `atribuicao-${index + 1}`,
  quarteiraoId: `quarteirao-${index + 1}`,
  aceId: demoAceIds[index % demoAceIds.length],
  cicloId: "ciclo-2026-6",
  origem: "MOCK",
  createdAt: "2026-11-01T08:00:00-03:00",
}));
const syncOperations = new Map<string, StoredRecord>();

function record(
  prefix: string,
  payload: Record<string, unknown>,
): StoredRecord {
  return { id: `${prefix}-${crypto.randomUUID()}`, ...payload };
}

export const aceMemoryStore = {
  createVisit(payload: Record<string, unknown>, userId: string) {
    const operationUuid = crypto.randomUUID();
    const item = record("visita", {
      ...payload,
      aceId: payload.aceId ?? userId,
      formulario: payload,
      statusConteudo: "CONCLUIDO",
      operacaoSync: {
        operationUuid,
        status: "RECEBIDA",
        recebidaEm: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
      status: "SINCRONIZADO",
      origem: "API_MOCK",
    });
    visits.push(item);
    return item;
  },
  visit(id: string) {
    return visits.find((item) => item.id === id) ?? null;
  },
  visitsByProperty(propertyId: string) {
    return visits.filter((item) => item.imovelId === propertyId);
  },
  visitsByAce(aceId: string) {
    return visits.filter((item) => item.aceId === aceId);
  },
  visits(filters: { aceId?: string; propertyId?: string } = {}) {
    return visits.filter(
      (item) =>
        (!filters.aceId || item.aceId === filters.aceId) &&
        (!filters.propertyId || item.imovelId === filters.propertyId),
    );
  },
  latestVisit(propertyId: string) {
    return this.visitsByProperty(propertyId).at(-1) ?? null;
  },
  createOccurrence(visitId: string, payload: Record<string, unknown>) {
    const item = record("ocorrencia", {
      visitId,
      ...payload,
      createdAt: new Date().toISOString(),
    });
    occurrences.push(item);
    return item;
  },
  occurrences(visitId?: string) {
    return visitId
      ? occurrences.filter((item) => item.visitId === visitId)
      : occurrences;
  },
  createAttachment(visitId: string, payload: Record<string, unknown>) {
    const item = record("anexo", {
      visitId,
      ...payload,
      createdAt: new Date().toISOString(),
      status: "SINCRONIZADO",
    });
    attachments.push(item);
    return item;
  },
  attachments(visitId: string) {
    return attachments.filter((item) => item.visitId === visitId);
  },
  createReturn(payload: Record<string, unknown>, userId: string) {
    const item = record("retorno", {
      ...payload,
      aceId: payload.aceId ?? userId,
      createdAt: new Date().toISOString(),
    });
    returns.push(item);
    return item;
  },
  returns(
    filters: { aceId?: string; propertyId?: string; cicloId?: string } = {},
  ) {
    return returns.filter(
      (item) =>
        (!filters.aceId || item.aceId === filters.aceId) &&
        (!filters.propertyId || item.imovelId === filters.propertyId) &&
        (!filters.cicloId || item.cicloId === filters.cicloId),
    );
  },
  upsertAssignment(payload: Record<string, unknown>) {
    const current = assignments.find(
      (item) => item.quarteiraoId === payload.quarteiraoId,
    );
    if (current)
      return Object.assign(current, payload, {
        updatedAt: new Date().toISOString(),
      });
    const item = record("atribuicao", {
      ...payload,
      createdAt: new Date().toISOString(),
    });
    assignments.push(item);
    return item;
  },
  assignments(aceId?: string) {
    return aceId
      ? assignments.filter((item) => item.aceId === aceId)
      : assignments;
  },
  synchronize(operationUuid: string, payload: Record<string, unknown>) {
    const existing = syncOperations.get(operationUuid);
    if (existing) return existing;
    const item = record("sync", {
      operationUuid,
      ...payload,
      status: "SINCRONIZADO",
      synchronizedAt: new Date().toISOString(),
    });
    syncOperations.set(operationUuid, item);
    return item;
  },
  synchronization(operationUuid: string) {
    return syncOperations.get(operationUuid) ?? null;
  },
  synchronizations() {
    return [...syncOperations.values()];
  },
  allVisits: visits,
};
