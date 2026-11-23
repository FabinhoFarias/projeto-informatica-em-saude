import { mockSamples } from "./mock-data/laboratory";
import { mockStock } from "./mock-data/stock";
import {
  mockCycles,
  mockTerritories,
} from "./mock-data/territories";
import { mockUsers } from "./mock-data/users";

/** Agregador de compatibilidade; os mocks ficam separados por domínio. */
export const mockApiData = {
  usuarios: mockUsers,
  territorios: mockTerritories,
  ciclos: mockCycles,
  cobertura: {
    cicloId: "ciclo-2026-6",
    atribuidos: 996,
    visitados: 582,
    pendentes: 414,
    percentual: 58,
  },
  amostras: mockSamples,
  estoque: mockStock,
};
