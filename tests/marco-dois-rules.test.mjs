import assert from "node:assert/strict";
import test from "node:test";
import { evaluateDemoTerritory } from "../lib/priorizacao/rules.ts";

const territory = (overrides = {}) => ({
  id: "territorio-teste",
  nome: "Território de teste",
  distrito: "Área Urbana",
  notificacoesRecentes: 10,
  notificacoesAnteriores: 10,
  imoveisPendentes: 5,
  focosInformados: 1,
  ...overrides,
});

const demoTerritories = [
  territory({ notificacoesRecentes: 15, focosInformados: 5 }),
  territory({ imoveisPendentes: 30 }),
  territory({ notificacoesRecentes: 14 }),
  territory(),
];

test("a regra didática só prioriza aumento combinado com foco ou pendência", () => {
  assert.equal(
    evaluateDemoTerritory(demoTerritories[0]).nivel,
    "Revisão prioritária",
  );
  assert.equal(evaluateDemoTerritory(demoTerritories[1]).nivel, "Acompanhar");
  assert.equal(evaluateDemoTerritory(demoTerritories[3]).nivel, "Rotina");
  assert.equal(
    evaluateDemoTerritory({ ...demoTerritories[0], notificacoesAnteriores: 0 })
      .nivel,
    "Acompanhar",
  );
});
