import { sectorPropertiesDemo } from "@/lib/visitas/demo-data";

export type LaboratorySampleStatus =
  | "COLETADA"
  | "RECEBIDA"
  | "EM_ANALISE"
  | "CONCLUIDA"
  | "INCONCLUSIVA";

export type LaboratorySpecies =
  | "AEDES_AEGYPTI"
  | "AEDES_ALBOPICTUS"
  | "OUTRA"
  | "NAO_IDENTIFICADA";

export type LaboratoryPhase = "LARVA" | "PUPA" | "ADULTO" | "EXUVIA";

export interface LaboratoryResultMock {
  species: LaboratorySpecies;
  phase: LaboratoryPhase;
  specimenCount: number;
  method: string;
  conclusion: "POSITIVO" | "NEGATIVO" | "INCONCLUSIVO";
  notes: string;
  analyzedBy: string;
  completedAt: string;
}

export interface LaboratorySampleMock {
  id: string;
  code: string;
  status: LaboratorySampleStatus;
  property: {
    id: string;
    localCode: string;
    street: string;
    number: string;
    block: string;
    sector: string;
  };
  visitId: string;
  collectedBy: string;
  collectedAt: string;
  tubeCount: number;
  sourceDeposit: string;
  receivedAt: string | null;
  receivedBy: string | null;
  analysisStartedAt: string | null;
  result: LaboratoryResultMock | null;
}

const samples = sectorPropertiesDemo.filter(
  (property) => (property.ultimaVisita?.formulario.quantidadeTubitos ?? 0) > 0,
);

const states: LaboratorySampleStatus[] = [
  "COLETADA",
  "RECEBIDA",
  "EM_ANALISE",
  "CONCLUIDA",
  "CONCLUIDA",
  "INCONCLUSIVA",
];

/** Dados fictícios para demonstrar rastreabilidade entre coleta, imóvel e laboratório. */
export const laboratorySamplesDemo: LaboratorySampleMock[] = samples
  .slice(0, 12)
  .map((property, index) => {
    const visit = property.ultimaVisita!;
    const status = states[index % states.length];
    const received = status !== "COLETADA";
    const analyzed = ["EM_ANALISE", "CONCLUIDA", "INCONCLUSIVA"].includes(
      status,
    );
    const finished = ["CONCLUIDA", "INCONCLUSIVA"].includes(status);
    const firstDeposit = Object.entries(visit.formulario.depositos).find(
      ([, count]) => count > 0,
    )?.[0];

    return {
      id: `sample-${index + 1}`,
      code: `LI-2026-${String(visit.formulario.amostraInicial).padStart(5, "0")}`,
      status,
      property: {
        id: property.id,
        localCode: property.codigoLocal,
        street: property.logradouro,
        number: property.numero,
        block: property.quarteirao,
        sector: property.setor,
      },
      visitId: visit.id,
      collectedBy: "Mariana Santos",
      collectedAt: visit.lancadaEm,
      tubeCount: visit.formulario.quantidadeTubitos,
      sourceDeposit: firstDeposit ?? "Não informado",
      receivedAt: received ? visit.lancadaEm.replace("09:", "13:") : null,
      receivedBy: received ? "João Silva · ACE Laboratorista" : null,
      analysisStartedAt: analyzed
        ? visit.lancadaEm.replace("09:", "14:")
        : null,
      result: finished
        ? {
            species: index % 2 === 0 ? "AEDES_AEGYPTI" : "NAO_IDENTIFICADA",
            phase: index % 3 === 0 ? "PUPA" : "LARVA",
            specimenCount: status === "INCONCLUSIVA" ? 0 : 2 + (index % 5),
            method: "Identificação morfológica",
            conclusion: status === "INCONCLUSIVA" ? "INCONCLUSIVO" : "POSITIVO",
            notes:
              status === "INCONCLUSIVA"
                ? "Material insuficiente para identificação segura."
                : "Características morfológicas compatíveis com a espécie registrada.",
            analyzedBy: "João Silva · ACE Laboratorista",
            completedAt: visit.lancadaEm.replace("09:", "16:"),
          }
        : null,
    };
  });
