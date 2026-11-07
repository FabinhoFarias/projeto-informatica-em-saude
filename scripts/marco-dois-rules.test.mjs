import assert from "node:assert/strict";
import test from "node:test";
import { demoTerritories, evaluateDemoTerritory } from "../lib/marco-dois-rules.ts";

test("a regra didática só prioriza aumento combinado com foco ou pendência", () => {
  assert.equal(evaluateDemoTerritory(demoTerritories[0]).nivel, "Revisão prioritária");
  assert.equal(evaluateDemoTerritory(demoTerritories[1]).nivel, "Acompanhar");
  assert.equal(evaluateDemoTerritory(demoTerritories[3]).nivel, "Rotina");
  assert.equal(evaluateDemoTerritory({ ...demoTerritories[0], notificacoesAnteriores: 0 }).nivel, "Acompanhar");
});
