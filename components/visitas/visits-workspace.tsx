"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { PageHeading } from "@/components/plataforma/dashboard-ui";
import {
  sectorPropertiesDemo,
  type SectorPropertyMock,
} from "@/lib/visitas/demo-data";

type Outcome = "VISITADO" | "PENDENCIA" | "NAO_VISITADO";
type Grouping = "quarteirao" | "rua";

function cycleKey(date: Date) {
  return `${date.getFullYear()}-${Math.floor(date.getMonth() / 2) + 1}`;
}

function cycleOptions() {
  const now = new Date();
  return Array.from({ length: 6 }, (_, offset) => {
    const firstMonth = Math.floor(now.getMonth() / 2) * 2 - offset * 2;
    const firstDay = new Date(now.getFullYear(), firstMonth, 1);
    const secondMonth = new Date(
      firstDay.getFullYear(),
      firstDay.getMonth() + 1,
      1,
    );
    const month = (date: Date) =>
      date.toLocaleDateString("pt-BR", { month: "long" });
    return {
      key: cycleKey(firstDay),
      label: `${month(firstDay)}–${month(secondMonth)} / ${firstDay.getFullYear()}`,
    };
  });
}

function visitInCycle(property: SectorPropertyMock, cycle: string) {
  const visit = property.ultimaVisita;
  if (!visit || cycleKey(new Date(`${visit.dataAtividade}T12:00:00`)) !== cycle)
    return null;
  return visit;
}

function outcome(property: SectorPropertyMock, cycle: string): Outcome {
  const visit = visitInCycle(property, cycle);
  if (!visit) return "NAO_VISITADO";
  return visit.acesso === "REALIZADO" ? "VISITADO" : "PENDENCIA";
}

const outcomeLabels: Record<Outcome, string> = {
  VISITADO: "Visitado no ciclo",
  PENDENCIA: "Recusa ou imóvel fechado",
  NAO_VISITADO: "Não visitado no ciclo",
};

const outcomeStyles: Record<Outcome, string> = {
  VISITADO:
    "border-emerald-600 bg-emerald-100 text-emerald-950 hover:bg-emerald-200",
  PENDENCIA: "border-amber-500 bg-amber-100 text-amber-950 hover:bg-amber-200",
  NAO_VISITADO:
    "border-color-border bg-white text-slate-900 hover:border-red-300 hover:bg-slate-50",
};

const outcomePriority: Record<Outcome, number> = {
  NAO_VISITADO: 0,
  PENDENCIA: 1,
  VISITADO: 2,
};

function propertyType(type: SectorPropertyMock["tipo"]) {
  const labels: Record<SectorPropertyMock["tipo"], string> = {
    RESIDENCIAL: "Residência",
    PREDIO: "Prédio",
    COMERCIAL: "Comércio",
    TERRENO: "Terreno baldio",
    ESCOLA: "Escola",
    UBS: "Unidade de saúde",
    IGREJA: "Igreja",
    INDUSTRIAL: "Indústria",
    PONTO_ESTRATEGICO: "Ponto estratégico",
    OUTRO: "Outro",
  };
  return labels[type];
}

function loadSessionOutcomes(cycle: string) {
  const loaded: Record<string, Outcome> = {};
  if (typeof window === "undefined") return loaded;
  for (const property of sectorPropertiesDemo) {
    const key = `vigia:visita:${property.id}:${cycle}`;
    const raw = sessionStorage.getItem(key);
    if (!raw) continue;
    try {
      const access = JSON.parse(raw).acesso;
      loaded[property.id] = access === "REALIZADO" ? "VISITADO" : "PENDENCIA";
    } catch {
      sessionStorage.removeItem(key);
    }
  }
  return loaded;
}

export function VisitsWorkspace() {
  const cycles = useMemo(() => cycleOptions(), []);
  const [cycle, setCycle] = useState(cycles[0].key);
  const [grouping, setGrouping] = useState<Grouping>("quarteirao");
  const [search, setSearch] = useState("");
  const [sessionOutcomes, setSessionOutcomes] = useState<
    Record<string, Outcome>
  >(() => loadSessionOutcomes(cycles[0].key));

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return sectorPropertiesDemo
      .filter((property) =>
        [
          property.codigoLocal,
          property.logradouro,
          property.numero,
          property.quarteirao,
          property.complemento ?? "",
        ].some((value) => value.toLocaleLowerCase("pt-BR").includes(term)),
      )
      .sort((a, b) => a.sequenciaPercurso - b.sequenciaPercurso);
  }, [search]);

  const groups = useMemo(() => {
    const grouped = new Map<string, SectorPropertyMock[]>();
    for (const property of filtered) {
      const key =
        grouping === "quarteirao" ? property.quarteirao : property.logradouro;
      grouped.set(key, [...(grouped.get(key) ?? []), property]);
    }
    for (const properties of grouped.values()) {
      properties.sort((a, b) => {
        const stateA = sessionOutcomes[a.id] ?? outcome(a, cycle);
        const stateB = sessionOutcomes[b.id] ?? outcome(b, cycle);
        return (
          outcomePriority[stateA] - outcomePriority[stateB] ||
          a.sequenciaPercurso - b.sequenciaPercurso
        );
      });
    }
    return [...grouped];
  }, [cycle, filtered, grouping, sessionOutcomes]);

  const counts = sectorPropertiesDemo.reduce<Record<Outcome, number>>(
    (result, property) => {
      result[sessionOutcomes[property.id] ?? outcome(property, cycle)]++;
      return result;
    },
    { VISITADO: 0, PENDENCIA: 0, NAO_VISITADO: 0 },
  );

  return (
    <div>
      <PageHeading
        eyebrow="Operação de campo · ACE"
        title="Imóveis do meu setor"
        description="Organize por quarteirão ou rua e acompanhe a situação de cada imóvel no ciclo de dois meses."
      />
      <section className="border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-48 flex-1 text-xs font-semibold text-slate-700">
            Ciclo bimestral
            <select
              value={cycle}
              onChange={(event) => {
                const nextCycle = event.target.value;
                setCycle(nextCycle);
                setSessionOutcomes(loadSessionOutcomes(nextCycle));
              }}
              className="mt-1 h-11 w-full border border-slate-300 bg-white px-3 text-sm font-normal"
            >
              {cycles.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <fieldset className="text-xs font-semibold text-slate-700">
            <legend className="mb-1">Organizar por</legend>
            <div className="flex border border-slate-300 p-1">
              <button
                type="button"
                aria-pressed={grouping === "quarteirao"}
                onClick={() => setGrouping("quarteirao")}
                className={`min-h-9 px-3 text-sm ${grouping === "quarteirao" ? "bg-emerald-800 text-white" : "text-slate-700"}`}
              >
                Quarteirão
              </button>
              <button
                type="button"
                aria-pressed={grouping === "rua"}
                onClick={() => setGrouping("rua")}
                className={`min-h-9 px-3 text-sm ${grouping === "rua" ? "bg-emerald-800 text-white" : "text-slate-700"}`}
              >
                Rua
              </button>
            </div>
          </fieldset>
          <label className="relative min-w-56 flex-[2]">
            <span className="sr-only">Buscar imóvel</span>
            <Search
              className="absolute left-3 top-3.5 h-4 w-4 text-slate-500"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar rua, número ou quarteirão"
              className="h-11 w-full border border-slate-300 bg-white pl-9 pr-3 text-sm"
            />
          </label>
        </div>
        <div
          aria-label="Legenda e totais do ciclo"
          className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-200 pt-4 text-sm"
        >
          <span className="text-emerald-900">
            ● Visitados: {counts.VISITADO}
          </span>
          <span className="text-amber-800">
            ● Recusa ou fechado: {counts.PENDENCIA}
          </span>
          <span className="text-red-800">
            ● Não visitados: {counts.NAO_VISITADO}
          </span>
        </div>
      </section>
      <div className="mt-4 space-y-4">
        {groups.map(([key, items]) => (
          <section
            key={key}
            className="border border-slate-200 bg-white p-3 sm:p-5"
          >
            <h2 className="text-base font-bold text-slate-950">
              {grouping === "quarteirao" ? `Quarteirão ${key}` : key}
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              {items.length} imóveis ·{" "}
              {grouping === "quarteirao"
                ? [
                    ...new Set(items.map((property) => property.logradouro)),
                  ].join(" · ")
                : [
                    ...new Set(items.map((property) => property.quarteirao)),
                  ].join(" · ")}
            </p>
            <div className="mt-4 grid grid-cols-4 gap-2 md:flex md:flex-wrap">
              {items.map((property) => {
                const state =
                  sessionOutcomes[property.id] ?? outcome(property, cycle);
                const visit = visitInCycle(property, cycle);
                const deposits = visit
                  ? Object.values(visit.formulario.depositos).reduce(
                      (total, value) => total + value,
                      0,
                    )
                  : 0;
                return (
                  <Link
                    key={property.id}
                    href={`/visitas/${property.id}?ciclo=${cycle}`}
                    aria-label={`${propertyType(property.tipo)}, número ${property.numero}, ${outcomeLabels[state]}`}
                    className={`relative flex aspect-square min-w-0 flex-col rounded-lg border-2 p-1.5 text-left shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 md:h-28 md:w-28 md:p-2 ${outcomeStyles[state]}`}
                  >
                    <span className="flex min-w-0 items-start justify-between gap-1">
                      <span className="min-w-0 truncate text-[clamp(0.55rem,2.6vw,0.75rem)] font-medium leading-tight md:text-xs">
                        {propertyType(property.tipo)}
                      </span>
                      {state === "NAO_VISITADO" ? (
                        <span
                          className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-red-500 shadow-sm ring-1 ring-white md:ring-2"
                          aria-hidden="true"
                        />
                      ) : (
                        <span className="shrink-0 whitespace-nowrap text-[8px] font-bold md:text-[9px]">
                          {deposits} dep.
                        </span>
                      )}
                    </span>
                    <strong className="absolute left-1/2 top-1/2 block -translate-x-1/2 -translate-y-1/2 text-xl leading-none md:text-2xl">
                      {property.numero}
                    </strong>
                    <span className="mt-auto block w-full truncate text-[8px] leading-tight sm:text-[9px] md:text-[10px]">
                      {grouping === "quarteirao"
                        ? property.logradouro
                        : property.quarteirao}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
        {groups.length === 0 && (
          <p className="border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
            Nenhum imóvel encontrado.
          </p>
        )}
      </div>
      <p className="mt-4 text-xs text-slate-600">
        Dados fictícios. As alterações ficam apenas nesta sessão; o histórico
        disponível contém a última visita de cada imóvel.
      </p>
    </div>
  );
}
