import assert from "node:assert/strict";
import test from "node:test";
import {
  aggregateHotspots,
  latestAgentPositions,
  positionInDemoMap,
} from "../lib/operacao/hotspots.ts";

const event = (
  agentId,
  latitude,
  longitude,
  kind = "posicao",
  timestamp = "2026-11-07T10:00:00",
) => ({ agentId, latitude, longitude, kind, timestamp });

test("separa atividade de agentes e focos na mesma área", () => {
  const records = [
    event("ACE-01", -8.08, -34.92),
    event("ACE-02", -8.081, -34.921),
    event("ACE-01", -8.08, -34.92, "foco"),
  ];
  assert.equal(aggregateHotspots(records, "posicao")[0].count, 2);
  assert.equal(aggregateHotspots(records, "foco")[0].count, 1);
});

test("ignora pontos fora do recorte e preserva o último ponto de cada agente", () => {
  const records = [
    event("ACE-01", -8.08, -34.92, "posicao", "2026-11-07T09:00:00"),
    event("ACE-01", -8.09, -34.93, "posicao", "2026-11-07T10:00:00"),
    event("ACE-02", -20, -50),
  ];
  assert.equal(positionInDemoMap(records[2]), null);
  assert.equal(
    aggregateHotspots(records, "posicao").reduce(
      (sum, cell) => sum + cell.count,
      0,
    ),
    2,
  );
  assert.equal(latestAgentPositions(records).length, 1);
  assert.equal(latestAgentPositions(records)[0].latitude, -8.09);
});
