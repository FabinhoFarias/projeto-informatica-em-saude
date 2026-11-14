"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import { PageHeading } from "@/components/plataforma/dashboard-ui";
import { MapViewport } from "@/components/operacao/map-viewport";
import { importAgentLocationCsv } from "@/lib/operacao/import-locations";
import {
  aggregateHotspots,
  demoLocationEvents,
  latestAgentPositions,
  positionInDemoMap,
  type AgentLocationEvent,
  type HotspotCell,
  type LocationKind,
} from "@/lib/operacao/hotspots";

const sampleCsv = `agente_id,latitude,longitude,data_hora,tipo\nACE-01,-8.075,-34.932,2026-11-07T08:30:00,posicao\nACE-01,-8.080,-34.924,2026-11-07T10:12:00,foco\nACE-02,-8.085,-34.919,2026-11-07T10:28:00,foco\n`;

function downloadSample() {
  const url = URL.createObjectURL(
    new Blob([sampleCsv], { type: "text/csv;charset=utf-8" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "localizacoes_exemplo.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-600">{detail}</p>
    </div>
  );
}

function SchematicMap({
  cells,
  agents,
  selected,
  onSelect,
  showAgents,
  layer,
}: {
  cells: HotspotCell[];
  agents: AgentLocationEvent[];
  selected: string | null;
  onSelect: (id: string) => void;
  showAgents: boolean;
  layer: LocationKind;
}) {
  const maxCount = Math.max(1, ...cells.map((cell) => cell.count));
  return (
    <MapViewport label="Mapa demonstrativo dos hotspots de campo">
      <svg
        viewBox="0 0 800 500"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <rect width="800" height="500" fill="#e5eee9" />
        <path d="M0 0H150L132 145 170 260 155 500H0Z" fill="#a5d2d1" />
        <path
          d="M44 0Q82 130 75 260T100 500"
          fill="none"
          stroke="#82babc"
          strokeWidth="38"
        />
        <path
          d="M250 0L220 500 M460 0L420 500 M650 0L610 500 M0 85L800 125 M0 245L800 265 M0 408L800 390"
          fill="none"
          stroke="#fff"
          strokeOpacity=".65"
          strokeWidth="15"
        />
        <path
          d="M290 0L270 500 M530 0L510 500 M0 160L800 192 M0 332L800 300"
          fill="none"
          stroke="#bdd2c6"
          strokeWidth="3"
          strokeDasharray="4 6"
        />
        <path
          d="M108 110Q220 70 340 128T540 115Q660 65 800 88 M132 360Q250 330 350 378T620 365"
          fill="none"
          stroke="#6eaf8c"
          strokeOpacity=".22"
          strokeWidth="36"
        />
        <g
          fontFamily="Arial, sans-serif"
          fontSize="12"
          fill="#5d7771"
          fontWeight="700"
          letterSpacing="2"
        >
          <text x="240" y="70">
            SETOR NORTE
          </text>
          <text x="500" y="225">
            SETOR LESTE
          </text>
          <text x="205" y="415">
            SETOR SUL
          </text>
        </g>
      </svg>
      <div className="absolute left-2 top-2 z-20 max-w-[calc(100%-1rem)] border border-white/70 bg-white/90 px-2 py-1.5 text-[11px] font-semibold text-slate-800 shadow-sm sm:left-4 sm:top-4 sm:px-3 sm:py-2 sm:text-xs">
        Mapa esquemático · Lagoa de Itaenga
      </div>
      {cells.map((cell) => {
        const size = 62 + 64 * Math.sqrt(cell.count / maxCount);
        const isSelected = selected === cell.id;
        return (
          <button
            key={cell.id}
            type="button"
            onClick={() => onSelect(cell.id)}
            aria-pressed={isSelected}
            aria-label={`Célula ${cell.column + 1}, ${cell.row + 1}: ${cell.count} ${layer === "posicao" ? "posições de agentes" : "focos registrados"}`}
            className={`absolute z-10 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-xs font-bold transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${isSelected ? "ring-2 ring-slate-900 ring-offset-2" : ""}`}
            style={{
              left: `${cell.x * 100}%`,
              top: `${cell.y * 100}%`,
              width: size,
              height: size,
              color: layer === "foco" ? "#732f19" : "#124b42",
              background:
                layer === "foco"
                  ? "radial-gradient(circle,rgba(248,140,80,.65) 0%,rgba(248,140,80,.28) 46%,rgba(248,140,80,.02) 72%)"
                  : "radial-gradient(circle,rgba(47,176,135,.6) 0%,rgba(47,176,135,.24) 46%,rgba(47,176,135,.02) 72%)",
            }}
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-white/85 shadow-sm">
              {cell.count}
            </span>
          </button>
        );
      })}
      {showAgents &&
        agents.map((agent) => {
          const point = positionInDemoMap(agent);
          if (!point) return null;
          return (
            <span
              key={agent.agentId}
              title={`Posição mais recente de ${agent.agentId}`}
              aria-label={`Posição mais recente de ${agent.agentId}`}
              className="absolute z-20 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-slate-900 shadow-md"
              style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
            />
          );
        })}
      <div className="absolute bottom-2 left-2 right-2 z-20 flex flex-wrap gap-x-3 gap-y-1 border border-white/70 bg-white/90 px-2 py-1.5 text-[10px] font-medium text-slate-700 shadow-sm sm:bottom-4 sm:left-4 sm:right-auto sm:px-3 sm:py-2 sm:text-[11px]">
        <span className="flex items-center gap-1.5">
          <i
            className={`h-2.5 w-2.5 rounded-full ${layer === "foco" ? "bg-orange-500" : "bg-emerald-500"}`}
          />
          {layer === "foco" ? "Focos informados" : "Atividade de agentes"}
        </span>
        {showAgents && (
          <span className="flex items-center gap-1.5">
            <i className="h-2.5 w-2.5 rounded-full bg-slate-900" />
            Última posição
          </span>
        )}
      </div>
    </MapViewport>
  );
}

export function HotspotWorkspace() {
  const [events, setEvents] =
    useState<AgentLocationEvent[]>(demoLocationEvents);
  const [source, setSource] = useState<"demo" | "csv">("demo");
  const [layer, setLayer] = useState<LocationKind>("posicao");
  const [showAgents, setShowAgents] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const cells = useMemo(
    () => aggregateHotspots(events, layer),
    [events, layer],
  );
  const agents = useMemo(() => latestAgentPositions(events), [events]);
  const selectedCell = cells.find((cell) => cell.id === selected) ?? cells[0];
  const totalFocus = events.filter((event) => event.kind === "foco").length;

  const importFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setMessage(
        "Arquivo acima de 2 MB. Use uma amostra menor nesta demonstração.",
      );
      return;
    }
    try {
      const result = importAgentLocationCsv(await file.text());
      setEvents(result.events);
      setSource("csv");
      setSelected(null);
      setMessage(
        `${result.events.length} registros válidos carregados no navegador; ${result.ignored} ignorados.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível ler o arquivo.",
      );
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className="min-w-0">
      <PageHeading
        eyebrow="Operação territorial · mapa de atividade"
        title="Hotspots de campo"
        description="Explore onde as posições dos agentes se concentram e compare com os focos informados. Cada camada representa uma medida diferente."
      />
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Registros no mapa"
          value={String(events.length)}
          detail={
            source === "demo"
              ? "Amostra inteiramente fictícia"
              : "CSV processado somente neste navegador"
          }
        />
        <Metric
          label="Agentes no recorte"
          value={String(agents.length)}
          detail="Identificadores pseudônimos"
        />
        <Metric
          label="Focos informados"
          value={String(totalFocus)}
          detail="Eventos classificados como foco"
        />
        <Metric
          label="Células com atividade"
          value={String(cells.length)}
          detail={`Camada: ${layer === "posicao" ? "posições" : "focos"}`}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_310px]">
        <section
          aria-label="Mapa e camadas de hotspots"
          className="min-w-0 overflow-hidden border border-slate-200 bg-white"
        >
          <div className="flex flex-col items-stretch gap-3 border-b border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
            <div>
              <h2 className="font-bold text-slate-950">
                Concentração por célula
              </h2>
              <p className="mt-1 text-xs text-slate-600">
                Grade 8 × 6 no recorte demonstrativo. Clique numa área para
                conferir a contagem.
              </p>
            </div>
            <div
              role="group"
              aria-label="Escolher camada do mapa"
              className="grid grid-cols-2 border border-slate-200 p-1 text-xs font-semibold sm:flex"
            >
              <button
                type="button"
                aria-pressed={layer === "posicao"}
                onClick={() => {
                  setLayer("posicao");
                  setSelected(null);
                }}
                className={`min-h-9 px-3 ${layer === "posicao" ? "bg-emerald-800 text-white" : "text-slate-700 hover:bg-slate-100"}`}
              >
                Atividade ACE
              </button>
              <button
                type="button"
                aria-pressed={layer === "foco"}
                onClick={() => {
                  setLayer("foco");
                  setSelected(null);
                }}
                className={`min-h-9 px-3 ${layer === "foco" ? "bg-orange-700 text-white" : "text-slate-700 hover:bg-slate-100"}`}
              >
                Focos
              </button>
            </div>
          </div>
          <SchematicMap
            cells={cells}
            agents={agents}
            selected={selectedCell?.id ?? null}
            onSelect={setSelected}
            showAgents={showAgents}
            layer={layer}
          />
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm text-slate-700">
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={showAgents}
                onChange={(event) => setShowAgents(event.target.checked)}
                className="h-4 w-4 accent-emerald-800"
              />
              Exibir última posição dos agentes
            </label>
            <span role="status">
              {selectedCell
                ? `Área selecionada: ${selectedCell.count} ${layer === "posicao" ? "posições" : "focos"}`
                : "Nenhum ponto nesta camada"}
            </span>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="border border-slate-200 bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">
              Leitura correta
            </p>
            <h2 className="mt-2 text-lg font-bold text-slate-950">
              O que este hotspot mostra?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              A camada de atividade conta posições registradas por agentes. Ela
              mostra concentração de trabalho,{" "}
              <strong>não risco epidemiológico</strong>. A camada de focos conta
              eventos informados como foco. Mais registros podem refletir maior
              cobertura, não maior infestação.
            </p>
          </section>
          <section className="border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-bold text-slate-950">
              Usar um CSV autorizado
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Teste o cálculo com até 5.000 registros. O arquivo fica somente
              neste navegador; não é salvo ou enviado ao servidor.
            </p>
            <label className="mt-4 flex min-h-11 cursor-pointer items-center justify-center border border-slate-300 px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50">
              Selecionar CSV
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={importFile}
                className="sr-only"
              />
            </label>
            <button
              type="button"
              onClick={downloadSample}
              className="mt-3 w-full text-left text-xs font-semibold text-emerald-800 underline underline-offset-2"
            >
              Baixar modelo de CSV
            </button>
            <p className="mt-3 text-[11px] leading-5 text-slate-500">
              Campos: agente_id, latitude, longitude, data_hora e tipo (posicao
              ou foco). Use códigos em vez de nomes. Coordenadas fora do recorte
              são ignoradas.
            </p>
            {message && (
              <p
                role="status"
                className="mt-3 border-l-2 border-emerald-700 bg-emerald-50 p-2 text-xs leading-5 text-emerald-950"
              >
                {message}
              </p>
            )}
            {source === "csv" && (
              <button
                type="button"
                onClick={() => {
                  setEvents(demoLocationEvents);
                  setSource("demo");
                  setSelected(null);
                  setMessage("");
                }}
                className="mt-3 text-xs font-semibold text-slate-700 underline underline-offset-2"
              >
                Voltar aos dados fictícios
              </button>
            )}
          </section>
          <section className="border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-bold text-slate-950">
              Para uso municipal
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              A operação real exigirá consentimento e política de acesso às
              posições, mapa geográfico validado, eventos de visita com data e
              revisão da vigilância. Este mapa é esquemático e não exibe ruas ou
              limites oficiais.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
