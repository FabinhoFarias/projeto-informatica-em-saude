export type SyncStatus = "RECEBIDA" | "PENDENTE";
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

export interface FieldVisitFormMock {
  atividade: "LI" | "LI_T" | "PE" | "T" | "DF" | "PVE";
  horaEntrada: string;
  tipoVisita: "N" | "R";
  supervisor: string;
  sequenciaNumero: number;
  depositos: Record<"A1" | "A2" | "B" | "C" | "D1" | "D2" | "E", number>;
  imovelInspecionado: boolean;
  amostraInicial: number;
  amostraFinal: number;
  quantidadeTubitos: number;
  depositosEliminados: number;
  imovelTratado: boolean;
  larvicida1Tipo: string;
  larvicida1Quantidade: number;
  larvicida1Depositos: number;
  larvicida2Tipo: string;
  larvicida2Quantidade: number;
  larvicida2Depositos: number;
  perifocalTipo: string;
  perifocalCargas: number;
  observacoes: string;
}

export interface FieldVisitMock {
  id: string;
  revisaoId: string;
  jornadaId: string;
  itemPlanejamentoId: string;
  modalidadeVersaoId: string;
  autorId: string;
  dataAtividade: string;
  lancadaEm: string;
  acesso: "REALIZADO" | "FECHADO" | "RECUSA";
  statusConteudo: "CONCLUIDO";
  formulario: FieldVisitFormMock;
  posicao: {
    latitude: number;
    longitude: number;
    origem: "GPS" | "CADASTRO_DEMO";
    precisaoMetros: number;
  };
  operacaoSync: {
    id: string;
    operationUuid: string;
    deviceId: string;
    baseVersion: number;
    status: SyncStatus;
    recebidaEm: string | null;
  };
}

export interface SectorPropertyMock {
  id: string;
  imovelVersaoId: string;
  codigoLocal: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  tipo: PropertyType;
  situacaoCadastral: "ATIVO" | "EM_CONFERENCIA";
  zona: "URBANA";
  territorioId: string;
  territorioVersaoId: string;
  setor: string;
  quarteirao: string;
  lado: "NORTE" | "SUL";
  sequenciaPercurso: number;
  coordenadas: {
    latitude: number;
    longitude: number;
    origem: "CADASTRO_DEMO";
  };
  pontoMapa: { x: number; y: number };
  ultimaVisita: FieldVisitMock | null;
}

function makeVisit(
  propertyNumber: number,
  date: string,
  acesso: FieldVisitMock["acesso"],
): FieldVisitMock {
  const suffix = String(propertyNumber).padStart(12, "0");
  const dateTime = `${date}T09:${String(propertyNumber % 60).padStart(2, "0")}:00-03:00`;
  const completed = acesso === "REALIZADO";
  const collectedSamples = completed && propertyNumber % 5 === 0;
  const treated = completed && propertyNumber % 4 === 0;
  return {
    id: `00000000-0000-4000-8000-${suffix}`,
    revisaoId: `10000000-0000-4000-8000-${suffix}`,
    jornadaId: "20000000-0000-4000-8000-000000000002",
    itemPlanejamentoId: `30000000-0000-4000-8000-${suffix}`,
    modalidadeVersaoId: "40000000-0000-4000-8000-000000000001",
    autorId: "50000000-0000-4000-8000-000000000002",
    dataAtividade: date,
    lancadaEm: dateTime,
    acesso,
    statusConteudo: "CONCLUIDO",
    formulario: {
      atividade: treated ? "LI_T" : "LI",
      horaEntrada: `09:${String(propertyNumber % 60).padStart(2, "0")}`,
      tipoVisita: propertyNumber % 6 === 0 ? "R" : "N",
      supervisor: "Supervisão de Endemias",
      sequenciaNumero: propertyNumber % 3,
      depositos: {
        A1: completed ? propertyNumber % 2 : 0,
        A2: completed ? propertyNumber % 3 : 0,
        B: completed ? (propertyNumber + 1) % 4 : 0,
        C: completed ? propertyNumber % 2 : 0,
        D1: completed ? (propertyNumber % 5 === 0 ? 1 : 0) : 0,
        D2: completed ? propertyNumber % 3 : 0,
        E: completed ? (propertyNumber % 7 === 0 ? 1 : 0) : 0,
      },
      imovelInspecionado: completed,
      amostraInicial: collectedSamples ? 1000 + propertyNumber * 2 : 0,
      amostraFinal: collectedSamples ? 1001 + propertyNumber * 2 : 0,
      quantidadeTubitos: collectedSamples ? 2 : 0,
      depositosEliminados: completed ? propertyNumber % 3 : 0,
      imovelTratado: treated,
      larvicida1Tipo: treated ? "Bti" : "",
      larvicida1Quantidade: treated ? 5 + (propertyNumber % 4) : 0,
      larvicida1Depositos: treated ? 1 + (propertyNumber % 2) : 0,
      larvicida2Tipo: propertyNumber % 12 === 0 ? "Diflubenzuron" : "",
      larvicida2Quantidade: propertyNumber % 12 === 0 ? 3 : 0,
      larvicida2Depositos: propertyNumber % 12 === 0 ? 1 : 0,
      perifocalTipo: propertyNumber % 16 === 0 ? "Residual" : "",
      perifocalCargas: propertyNumber % 16 === 0 ? 1 : 0,
      observacoes:
        acesso === "RECUSA"
          ? "Morador recusou a entrada; retorno encaminhado ao supervisor."
          : acesso === "FECHADO"
            ? "Imóvel fechado no horário da visita; programar recuperação."
            : treated
              ? "Depósitos orientados e tratamento registrado durante a visita."
              : "Vistoria concluída e orientações preventivas fornecidas.",
    },
    posicao: {
      latitude: -7.935 + propertyNumber * 0.00002,
      longitude: -35.292 + propertyNumber * 0.00002,
      origem: "GPS",
      precisaoMetros: 8 + (propertyNumber % 10),
    },
    operacaoSync: {
      id: `60000000-0000-4000-8000-${suffix}`,
      operationUuid: `70000000-0000-4000-8000-${suffix}`,
      deviceId: "ACE-DEMO-02",
      baseVersion: 1,
      status: "RECEBIDA",
      recebidaEm: dateTime,
    },
  };
}

const sectorId = "80000000-0000-4000-8000-000000000002";
const sectorVersionId = "80000000-0000-4000-8000-000000000102";
const propertiesPerBlock = [12, 11, 14, 10, 13, 15, 12, 11, 14, 10];
const streets = [
  ["Rua das Palmeiras", "Travessa do Sol"],
  ["Rua do Açude", "Rua da Estação"],
  ["Rua do Campo", "Rua Boa Vista"],
  ["Travessa São José", "Rua Nova"],
  ["Rua da Matriz", "Rua da Saudade"],
  ["Rua Primeiro de Maio", "Rua do Comércio"],
  ["Rua da Mangueira", "Travessa da Linha"],
  ["Rua Joaquim Nabuco", "Rua da Alegria"],
  ["Rua Sete de Setembro", "Rua do Cruzeiro"],
  ["Rua da Aurora", "Rua da Ponte"],
] as const;
const typeSequence: PropertyType[] = [
  "RESIDENCIAL",
  "RESIDENCIAL",
  "RESIDENCIAL",
  "COMERCIAL",
  "RESIDENCIAL",
  "PREDIO",
  "RESIDENCIAL",
  "TERRENO",
  "RESIDENCIAL",
  "IGREJA",
  "RESIDENCIAL",
  "ESCOLA",
  "RESIDENCIAL",
  "UBS",
  "PONTO_ESTRATEGICO",
  "INDUSTRIAL",
  "OUTRO",
];

/** Cenário fictício com dez quarteirões; não representa endereços ou imóveis reais. */
export const sectorPropertiesDemo: SectorPropertyMock[] =
  propertiesPerBlock.flatMap((count, blockIndex) =>
    Array.from({ length: count }, (_, propertyIndex) => {
      const previous = propertiesPerBlock
        .slice(0, blockIndex)
        .reduce((sum, value) => sum + value, 0);
      const sequence = previous + propertyIndex + 1;
      const suffix = String(sequence).padStart(12, "0");
      const blockNumber = blockIndex + 1;
      const quarteirao = String(blockNumber);
      const logradouro =
        streets[blockIndex][propertyIndex < Math.ceil(count / 2) ? 0 : 1];
      const tipo =
        typeSequence[(sequence + blockIndex * 3) % typeSequence.length];
      const acesso =
        sequence % 9 === 0
          ? "RECUSA"
          : sequence % 7 === 0
            ? "FECHADO"
            : "REALIZADO";
      const visited = sequence % 3 !== 0;
      const day = String(1 + (sequence % 13)).padStart(2, "0");
      return {
        id: `00000000-0000-4000-8000-${suffix}`,
        imovelVersaoId: `00000000-0000-4000-9000-${suffix}`,
        codigoLocal: `LI-C02-Q${String(blockNumber).padStart(2, "0")}-${String(propertyIndex + 1).padStart(3, "0")}`,
        logradouro,
        numero:
          sequence % 29 === 0
            ? "s/n"
            : String(2 + propertyIndex * 4 + blockIndex),
        complemento:
          tipo === "PREDIO"
            ? `Bloco ${String.fromCharCode(65 + (propertyIndex % 3))}`
            : undefined,
        tipo,
        situacaoCadastral: sequence % 17 === 0 ? "EM_CONFERENCIA" : "ATIVO",
        zona: "URBANA",
        territorioId: sectorId,
        territorioVersaoId: sectorVersionId,
        setor: "Setor 02 · Centro",
        quarteirao,
        lado: propertyIndex < Math.ceil(count / 2) ? "NORTE" : "SUL",
        sequenciaPercurso: sequence,
        coordenadas: {
          latitude: -7.935 + blockIndex * 0.00045 + propertyIndex * 0.000025,
          longitude: -35.292 + blockIndex * 0.00035 + propertyIndex * 0.00002,
          origem: "CADASTRO_DEMO",
        },
        pontoMapa: {
          x: 10 + (blockIndex % 5) * 18 + (propertyIndex % 3) * 3,
          y: 15 + Math.floor(blockIndex / 5) * 44 + (propertyIndex % 5) * 4,
        },
        ultimaVisita: visited
          ? makeVisit(sequence, `2026-11-${day}`, acesso)
          : null,
      };
    }),
  );
