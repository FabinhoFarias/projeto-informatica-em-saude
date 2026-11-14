/** Mockup independente para demonstração da Prefeitura do Recife. */
import type { UserAccount } from "@/lib/identidade/types";
import type {
  MunicipalityConfiguration,
  Neighborhood,
} from "@/lib/territorios/types";
import type { CasaTerritorialDemo } from "@/lib/territorios/casas-demo";
import type { DemoTerritory } from "@/lib/priorizacao/types";

export const recifeMunicipality: MunicipalityConfiguration = {
  name: "Recife",
  state: "PE",
  prefeitura: "Prefeitura do Recife",
  district: "Distritos Sanitários do Recife",
};

const territorySeed = [
  ["boa-viagem", "Boa Viagem", "Distrito Sanitário VI"],
  ["ibura", "Ibura", "Distrito Sanitário VI"],
  ["casa-amarela", "Casa Amarela", "Distrito Sanitário III"],
  ["varzea", "Várzea", "Distrito Sanitário IV"],
  ["afogados", "Afogados", "Distrito Sanitário V"],
  ["santo-amaro", "Santo Amaro", "Distrito Sanitário I"],
  ["agua-fria", "Água Fria", "Distrito Sanitário II"],
  ["madalena", "Madalena", "Distrito Sanitário IV"],
] as const;

export const recifeNeighborhoods: Neighborhood[] = territorySeed.map(
  ([id, name, district], index) => ({
    id,
    name,
    city: recifeMunicipality.name,
    district,
    population: 23000 + index * 12500,
    suspectedCases: 42 + index * 19,
    forecastCases: 61 + index * 24,
    ratePer100k: 120 + index * 33,
    incidenceProbability: 35 + index * 7,
    risk: index < 2 ? "Crítico" : index < 5 ? "Alto" : "Médio",
    density: 6900 + index * 860,
    vectorFoci: 5.2 + index * 1.7,
    apsVisits: 240 + index * 54,
    apsCases: 38 + index * 13,
    apsStatus: index < 4 ? "Atenção" : "Em observação",
    trigger: index < 5,
  }),
);

export const recifeTerritories = territorySeed.map(([id, name, district]) => ({
  id,
  name,
  zone: "Urbana" as const,
  district,
}));

export const recifeHouses: CasaTerritorialDemo[] = recifeTerritories.flatMap(
  (territory, territoryIndex) =>
    Array.from({ length: 5 }, (_, houseIndex) => ({
      id: `${territory.id}-casa-${houseIndex + 1}`,
      territorioId: territory.id,
      codigo: `CASA-${territory.id.toUpperCase()}-${String(houseIndex + 1).padStart(3, "0")}`,
      setor: `Setor ${String((territoryIndex % 8) + 1).padStart(2, "0")}`,
      situacao:
        houseIndex === 0
          ? "Revisão"
          : houseIndex % 2 === 0
            ? "Visitado"
            : "Aguardando visita",
      foco: houseIndex === 0 && territoryIndex % 2 === 0,
    })),
);

export const recifeUsers: UserAccount[] = [
  {
    id: "recife-u1",
    name: "Mariana Santos",
    email: "mariana.santos@saude.recife.pe.gov.br",
    cpf: "12345678901",
    role: "ADMIN",
    territory: "Secretaria Municipal de Saúde",
    municipality: "Recife",
    mfa: true,
    status: "Ativo",
    lastAccess: "07/10/2026, 09:14",
  },
  {
    id: "recife-u2",
    name: "João Pedro Alves",
    email: "joao.alves@saude.recife.pe.gov.br",
    cpf: "45678901234",
    role: "AGENTE_CAMPO",
    territory: "Ibura · Microárea 04",
    municipality: "Recife",
    mfa: true,
    status: "Ativo",
    lastAccess: "07/10/2026, 07:48",
    lastSync: "07/10/2026, 07:48",
  },
  {
    id: "recife-u3",
    name: "Ana Cláudia Melo",
    email: "ana.melo@saude.recife.pe.gov.br",
    cpf: "56789012345",
    role: "AGENTE_CAMPO",
    territory: "Água Fria · Microárea 02",
    municipality: "Recife",
    mfa: false,
    status: "Ativo",
    lastAccess: "05/10/2026, 17:05",
    lastSync: "06/10/2026, 18:16",
  },
];

export const recifePrioritization: DemoTerritory[] = recifeNeighborhoods
  .slice(0, 4)
  .map((territory) => ({
    id: territory.id,
    nome: territory.name,
    distrito: territory.district,
    notificacoesRecentes: territory.suspectedCases,
    notificacoesAnteriores: territory.suspectedCases - 11,
    imoveisPendentes: 24 + (territory.apsVisits % 20),
    focosInformados: Math.round(territory.vectorFoci),
  }));

export const recifeMockup = {
  id: "recife",
  municipality: recifeMunicipality,
  territories: recifeTerritories,
  neighborhoods: recifeNeighborhoods,
  houses: recifeHouses,
  users: recifeUsers,
  prioritization: recifePrioritization,
  ingestion: {
    headers: [
      "Data do atendimento",
      "Bairro informado",
      "Classificação",
      "Unidade de saúde",
    ],
    rows: [
      ["2026-09-28", "Ibura", "Suspeita de dengue", "USF Ibura"],
      ["2026-09-28", "Água Fria", "Síndrome febril", "USF Água Fria"],
      ["2026-09-29", "Boa Viagem", "Suspeita de dengue", "USF Boa Viagem"],
    ],
  },
  metadata: {
    label: "Recife · demonstração acadêmica",
    ibgeCode: "2611606",
    realData: false,
  },
} as const;

export type RecifeMockup = typeof recifeMockup;
