export type LocationKind = "posicao" | "foco";

export interface AgentLocationEvent {
  agentId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  kind: LocationKind;
}

export interface HotspotCell {
  id: string;
  column: number;
  row: number;
  count: number;
  x: number;
  y: number;
}

// Recorte apenas demonstrativo para projetar coordenadas de Lagoa de Itaenga na visualização esquemática.
export const DEMO_BOUNDS = {
  minLat: -8.16,
  maxLat: -7.97,
  minLon: -35.02,
  maxLon: -34.83,
} as const;
export const GRID = { columns: 8, rows: 6 } as const;

export function positionInDemoMap(
  event: Pick<AgentLocationEvent, "latitude" | "longitude">,
) {
  const x =
    (event.longitude - DEMO_BOUNDS.minLon) /
    (DEMO_BOUNDS.maxLon - DEMO_BOUNDS.minLon);
  const y =
    1 -
    (event.latitude - DEMO_BOUNDS.minLat) /
      (DEMO_BOUNDS.maxLat - DEMO_BOUNDS.minLat);
  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    x < 0 ||
    x > 1 ||
    y < 0 ||
    y > 1
  )
    return null;
  return { x, y };
}

export function aggregateHotspots(
  events: AgentLocationEvent[],
  kind: LocationKind,
): HotspotCell[] {
  const cells = new Map<string, HotspotCell>();
  for (const event of events) {
    if (event.kind !== kind) continue;
    const position = positionInDemoMap(event);
    if (!position) continue;
    const column = Math.min(
      GRID.columns - 1,
      Math.floor(position.x * GRID.columns),
    );
    const row = Math.min(GRID.rows - 1, Math.floor(position.y * GRID.rows));
    const id = `${column}-${row}`;
    const cell = cells.get(id) ?? {
      id,
      column,
      row,
      count: 0,
      x: (column + 0.5) / GRID.columns,
      y: (row + 0.5) / GRID.rows,
    };
    cell.count += 1;
    cells.set(id, cell);
  }
  return [...cells.values()].sort(
    (a, b) => b.count - a.count || a.id.localeCompare(b.id),
  );
}

export function latestAgentPositions(
  events: AgentLocationEvent[],
): AgentLocationEvent[] {
  const latest = new Map<string, AgentLocationEvent>();
  for (const event of events) {
    if (event.kind !== "posicao" || !positionInDemoMap(event)) continue;
    const previous = latest.get(event.agentId);
    if (!previous || event.timestamp > previous.timestamp)
      latest.set(event.agentId, event);
  }
  return [...latest.values()];
}

export const demoLocationEvents: AgentLocationEvent[] = [
  {
    agentId: "ACE-01",
    latitude: -8.075,
    longitude: -34.932,
    timestamp: "2026-11-07T08:30:00",
    kind: "posicao",
  },
  {
    agentId: "ACE-01",
    latitude: -8.081,
    longitude: -34.925,
    timestamp: "2026-11-07T09:15:00",
    kind: "posicao",
  },
  {
    agentId: "ACE-01",
    latitude: -8.078,
    longitude: -34.922,
    timestamp: "2026-11-07T10:10:00",
    kind: "posicao",
  },
  {
    agentId: "ACE-02",
    latitude: -8.087,
    longitude: -34.923,
    timestamp: "2026-11-07T08:40:00",
    kind: "posicao",
  },
  {
    agentId: "ACE-02",
    latitude: -8.083,
    longitude: -34.917,
    timestamp: "2026-11-07T10:05:00",
    kind: "posicao",
  },
  {
    agentId: "ACE-03",
    latitude: -8.116,
    longitude: -34.944,
    timestamp: "2026-11-07T08:50:00",
    kind: "posicao",
  },
  {
    agentId: "ACE-03",
    latitude: -8.119,
    longitude: -34.936,
    timestamp: "2026-11-07T10:15:00",
    kind: "posicao",
  },
  {
    agentId: "ACE-04",
    latitude: -8.045,
    longitude: -34.906,
    timestamp: "2026-11-07T09:05:00",
    kind: "posicao",
  },
  {
    agentId: "ACE-04",
    latitude: -8.048,
    longitude: -34.898,
    timestamp: "2026-11-07T10:20:00",
    kind: "posicao",
  },
  {
    agentId: "ACE-05",
    latitude: -8.052,
    longitude: -34.897,
    timestamp: "2026-11-07T09:00:00",
    kind: "posicao",
  },
  {
    agentId: "ACE-05",
    latitude: -8.056,
    longitude: -34.892,
    timestamp: "2026-11-07T10:35:00",
    kind: "posicao",
  },
  {
    agentId: "ACE-06",
    latitude: -8.116,
    longitude: -34.942,
    timestamp: "2026-11-07T09:45:00",
    kind: "posicao",
  },
  {
    agentId: "ACE-06",
    latitude: -8.112,
    longitude: -34.935,
    timestamp: "2026-11-07T10:45:00",
    kind: "posicao",
  },
  {
    agentId: "ACE-01",
    latitude: -8.08,
    longitude: -34.924,
    timestamp: "2026-11-07T10:12:00",
    kind: "foco",
  },
  {
    agentId: "ACE-02",
    latitude: -8.085,
    longitude: -34.919,
    timestamp: "2026-11-07T10:28:00",
    kind: "foco",
  },
  {
    agentId: "ACE-03",
    latitude: -8.117,
    longitude: -34.937,
    timestamp: "2026-11-07T10:48:00",
    kind: "foco",
  },
  {
    agentId: "ACE-06",
    latitude: -8.113,
    longitude: -34.939,
    timestamp: "2026-11-07T10:51:00",
    kind: "foco",
  },
  {
    agentId: "ACE-04",
    latitude: -8.049,
    longitude: -34.899,
    timestamp: "2026-11-07T11:02:00",
    kind: "foco",
  },
];
