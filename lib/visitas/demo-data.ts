export type SyncStatus = "RECEBIDA" | "PENDENTE";

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
  tipo: "RESIDENCIAL" | "COMERCIAL" | "TERRENO";
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
  syncStatus: SyncStatus,
): FieldVisitMock {
  const dateTime = `${date}T09:1${propertyNumber}:00-03:00`;
  const visitNumber = String(propertyNumber).padStart(12, "0");

  return {
    id: `00000000-0000-4000-8000-${visitNumber}`,
    revisaoId: `10000000-0000-4000-8000-${visitNumber}`,
    jornadaId: "20000000-0000-4000-8000-000000000002",
    itemPlanejamentoId: `30000000-0000-4000-8000-${visitNumber}`,
    modalidadeVersaoId: "40000000-0000-4000-8000-000000000001",
    autorId: "50000000-0000-4000-8000-000000000002",
    dataAtividade: date,
    lancadaEm: dateTime,
    acesso: "REALIZADO",
    statusConteudo: "CONCLUIDO",
    posicao: {
      latitude: -7.935 + propertyNumber * 0.0002,
      longitude: -35.292 + propertyNumber * 0.0002,
      origem: "GPS",
      precisaoMetros: 8 + propertyNumber,
    },
    operacaoSync: {
      id: `60000000-0000-4000-8000-${visitNumber}`,
      operationUuid: `70000000-0000-4000-8000-${visitNumber}`,
      deviceId: "ACE-DEMO-02",
      baseVersion: 1,
      status: syncStatus,
      recebidaEm: syncStatus === "RECEBIDA" ? dateTime : null,
    },
  };
}

const sectorId = "80000000-0000-4000-8000-000000000002";
const sectorVersionId = "80000000-0000-4000-8000-000000000102";

/** Endereços e coordenadas fictícios; não representam imóveis reais. */
export const sectorPropertiesDemo: SectorPropertyMock[] = [
  {
    id: "00000000-0000-4000-8000-000000000101",
    imovelVersaoId: "00000000-0000-4000-8000-000000000201",
    codigoLocal: "LI-C02-Q01-001",
    logradouro: "Rua das Palmeiras",
    numero: "12",
    tipo: "RESIDENCIAL",
    situacaoCadastral: "ATIVO",
    zona: "URBANA",
    territorioId: sectorId,
    territorioVersaoId: sectorVersionId,
    setor: "Setor 02 · Centro",
    quarteirao: "Q01",
    lado: "NORTE",
    sequenciaPercurso: 1,
    coordenadas: {
      latitude: -7.9348,
      longitude: -35.2918,
      origem: "CADASTRO_DEMO",
    },
    pontoMapa: { x: 18, y: 25 },
    ultimaVisita: makeVisit(1, "2026-11-09", "RECEBIDA"),
  },
  {
    id: "00000000-0000-4000-8000-000000000102",
    imovelVersaoId: "00000000-0000-4000-8000-000000000202",
    codigoLocal: "LI-C02-Q01-002",
    logradouro: "Rua das Palmeiras",
    numero: "18",
    complemento: "Casa B",
    tipo: "RESIDENCIAL",
    situacaoCadastral: "ATIVO",
    zona: "URBANA",
    territorioId: sectorId,
    territorioVersaoId: sectorVersionId,
    setor: "Setor 02 · Centro",
    quarteirao: "Q01",
    lado: "NORTE",
    sequenciaPercurso: 2,
    coordenadas: {
      latitude: -7.9346,
      longitude: -35.2916,
      origem: "CADASTRO_DEMO",
    },
    pontoMapa: { x: 31, y: 20 },
    ultimaVisita: null,
  },
  {
    id: "00000000-0000-4000-8000-000000000103",
    imovelVersaoId: "00000000-0000-4000-8000-000000000203",
    codigoLocal: "LI-C02-Q01-003",
    logradouro: "Rua das Palmeiras",
    numero: "24",
    tipo: "COMERCIAL",
    situacaoCadastral: "ATIVO",
    zona: "URBANA",
    territorioId: sectorId,
    territorioVersaoId: sectorVersionId,
    setor: "Setor 02 · Centro",
    quarteirao: "Q01",
    lado: "SUL",
    sequenciaPercurso: 3,
    coordenadas: {
      latitude: -7.9344,
      longitude: -35.2914,
      origem: "CADASTRO_DEMO",
    },
    pontoMapa: { x: 44, y: 29 },
    ultimaVisita: null,
  },
  {
    id: "00000000-0000-4000-8000-000000000104",
    imovelVersaoId: "00000000-0000-4000-8000-000000000204",
    codigoLocal: "LI-C02-Q01-004",
    logradouro: "Travessa do Sol",
    numero: "s/n",
    complemento: "Portão azul",
    tipo: "RESIDENCIAL",
    situacaoCadastral: "EM_CONFERENCIA",
    zona: "URBANA",
    territorioId: sectorId,
    territorioVersaoId: sectorVersionId,
    setor: "Setor 02 · Centro",
    quarteirao: "Q01",
    lado: "SUL",
    sequenciaPercurso: 4,
    coordenadas: {
      latitude: -7.9342,
      longitude: -35.2912,
      origem: "CADASTRO_DEMO",
    },
    pontoMapa: { x: 58, y: 24 },
    ultimaVisita: makeVisit(4, "2026-11-10", "PENDENTE"),
  },
  {
    id: "00000000-0000-4000-8000-000000000105",
    imovelVersaoId: "00000000-0000-4000-8000-000000000205",
    codigoLocal: "LI-C02-Q02-001",
    logradouro: "Rua do Açude",
    numero: "5",
    tipo: "RESIDENCIAL",
    situacaoCadastral: "ATIVO",
    zona: "URBANA",
    territorioId: sectorId,
    territorioVersaoId: sectorVersionId,
    setor: "Setor 02 · Centro",
    quarteirao: "Q02",
    lado: "NORTE",
    sequenciaPercurso: 5,
    coordenadas: {
      latitude: -7.934,
      longitude: -35.291,
      origem: "CADASTRO_DEMO",
    },
    pontoMapa: { x: 72, y: 31 },
    ultimaVisita: makeVisit(5, "2026-11-08", "RECEBIDA"),
  },
  {
    id: "00000000-0000-4000-8000-000000000106",
    imovelVersaoId: "00000000-0000-4000-8000-000000000206",
    codigoLocal: "LI-C02-Q02-002",
    logradouro: "Rua do Açude",
    numero: "11",
    tipo: "TERRENO",
    situacaoCadastral: "ATIVO",
    zona: "URBANA",
    territorioId: sectorId,
    territorioVersaoId: sectorVersionId,
    setor: "Setor 02 · Centro",
    quarteirao: "Q02",
    lado: "SUL",
    sequenciaPercurso: 6,
    coordenadas: {
      latitude: -7.9338,
      longitude: -35.2908,
      origem: "CADASTRO_DEMO",
    },
    pontoMapa: { x: 83, y: 39 },
    ultimaVisita: null,
  },
  {
    id: "00000000-0000-4000-8000-000000000107",
    imovelVersaoId: "00000000-0000-4000-8000-000000000207",
    codigoLocal: "LI-C02-Q02-003",
    logradouro: "Rua da Estação",
    numero: "s/n",
    complemento: "Unidade 2",
    tipo: "RESIDENCIAL",
    situacaoCadastral: "ATIVO",
    zona: "URBANA",
    territorioId: sectorId,
    territorioVersaoId: sectorVersionId,
    setor: "Setor 02 · Centro",
    quarteirao: "Q02",
    lado: "NORTE",
    sequenciaPercurso: 7,
    coordenadas: {
      latitude: -7.9336,
      longitude: -35.2906,
      origem: "CADASTRO_DEMO",
    },
    pontoMapa: { x: 68, y: 58 },
    ultimaVisita: null,
  },
  {
    id: "00000000-0000-4000-8000-000000000108",
    imovelVersaoId: "00000000-0000-4000-8000-000000000208",
    codigoLocal: "LI-C02-Q02-004",
    logradouro: "Rua da Estação",
    numero: "22",
    tipo: "RESIDENCIAL",
    situacaoCadastral: "ATIVO",
    zona: "URBANA",
    territorioId: sectorId,
    territorioVersaoId: sectorVersionId,
    setor: "Setor 02 · Centro",
    quarteirao: "Q02",
    lado: "SUL",
    sequenciaPercurso: 8,
    coordenadas: {
      latitude: -7.9334,
      longitude: -35.2904,
      origem: "CADASTRO_DEMO",
    },
    pontoMapa: { x: 50, y: 70 },
    ultimaVisita: makeVisit(8, "2026-11-07", "RECEBIDA"),
  },
];
