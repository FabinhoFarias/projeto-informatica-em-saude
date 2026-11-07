import { parseCsv } from "@/lib/ingestao/processor";
import {
  positionInDemoMap,
  type AgentLocationEvent,
  type LocationKind,
} from "./hotspots";

export interface LocationImportResult {
  events: AgentLocationEvent[];
  ignored: number;
}

export function importAgentLocationCsv(content: string): LocationImportResult {
  const rows = parseCsv(content);
  if (rows.length < 2)
    throw new Error("O CSV precisa de cabeçalho e ao menos um registro.");
  const headers = rows[0].map((value) => value.trim().toLowerCase());
  const required = ["agente_id", "latitude", "longitude", "data_hora", "tipo"];
  const indices = required.map((name) => headers.indexOf(name));
  if (indices.some((index) => index < 0))
    throw new Error(`Colunas necessárias: ${required.join(", ")}.`);
  if (rows.length > 5001)
    throw new Error(
      "Use no máximo 5.000 registros por arquivo nesta demonstração.",
    );

  const events: AgentLocationEvent[] = [];
  let ignored = 0;
  for (const row of rows.slice(1)) {
    const [agentId, latText, lonText, timestamp, kindText] = indices.map(
      (index) => row[index]?.trim() ?? "",
    );
    const latitude = Number(latText.replace(",", "."));
    const longitude = Number(lonText.replace(",", "."));
    const kind = kindText.toLowerCase() as LocationKind;
    const event = { agentId, latitude, longitude, timestamp, kind };
    if (
      !agentId ||
      !latText ||
      !lonText ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      !Number.isFinite(Date.parse(timestamp)) ||
      !["posicao", "foco"].includes(kind) ||
      !positionInDemoMap(event)
    ) {
      ignored += 1;
      continue;
    }
    events.push(event);
  }
  if (!events.length)
    throw new Error("Nenhum registro válido no recorte demonstrativo do mapa.");
  return { events, ignored };
}
