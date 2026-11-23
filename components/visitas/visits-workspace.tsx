"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Church,
  Factory,
  House,
  Hospital,
  MapPinHouse,
  Search,
  School,
  Store,
  TreePine,
  Warehouse,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageHeading } from "@/components/plataforma/dashboard-ui";
import type { SectorPropertyMock } from "@/lib/visitas/demo-data";

type Outcome = "VISITADO" | "RECUSA" | "FECHADO" | "NAO_VISITADO";
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
  if (visit.acesso === "REALIZADO") return "VISITADO";
  return visit.acesso === "RECUSA" ? "RECUSA" : "FECHADO";
}

const outcomeLabels: Record<Outcome, string> = {
  VISITADO: "Visitado no ciclo",
  RECUSA: "Entrada recusada",
  FECHADO: "Ninguém em casa ou imóvel fechado",
  NAO_VISITADO: "Não visitado no ciclo",
};

const outcomeStyles: Record<Outcome, string> = {
  VISITADO:
    "border-emerald-600 bg-emerald-100 text-emerald-950 hover:bg-emerald-200",
  RECUSA: "border-orange-500 bg-orange-100 text-orange-950 hover:bg-orange-200",
  FECHADO: "border-amber-500 bg-amber-100 text-amber-950 hover:bg-amber-200",
  NAO_VISITADO:
    "border-color-border bg-white text-slate-900 hover:border-red-300 hover:bg-slate-50",
};

const outcomePriority: Record<Outcome, number> = {
  NAO_VISITADO: 0,
  RECUSA: 1,
  FECHADO: 2,
  VISITADO: 3,
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

function propertyTypeIcon(type: SectorPropertyMock["tipo"]): LucideIcon {
  const icons: Record<SectorPropertyMock["tipo"], LucideIcon> = {
    RESIDENCIAL: House,
    PREDIO: Building2,
    COMERCIAL: Store,
    TERRENO: TreePine,
    ESCOLA: School,
    UBS: Hospital,
    IGREJA: Church,
    INDUSTRIAL: Factory,
    PONTO_ESTRATEGICO: MapPinHouse,
    OUTRO: Warehouse,
  };
  return icons[type];
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

export function VisitsWorkspace({
  title = "Imóveis do meu setor",
  description = "Organize por quarteirão ou rua e acompanhe a situação de cada imóvel no ciclo de dois meses.",
  eyebrow = "Operação de campo · ACE",
  properties: initialProperties = [],
  currentPage = 1,
  totalPages = 1,
}: {
  title?: string;
  description?: string;
  eyebrow?: string;
  properties?: SectorPropertyMock[];
  currentPage?: number;
  totalPages?: number;
} = {}) {
  const cycles = useMemo(() => cycleOptions(), []);
  const properties = initialProperties;
  const [cycle, setCycle] = useState(cycles[0].key);
  const [grouping, setGrouping] = useState<Grouping>("quarteirao");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = normalizeSearch(search);
    return properties
      .filter((property) => {
        const propertyNumber = normalizeSearch(property.numero);
        const street = normalizeSearch(property.logradouro);
        const block = normalizeSearch(property.quarteirao);
        const numericSearch = /^\d+$/.test(term);

        if (numericSearch) {
          return (
            propertyNumber === term ||
            street.includes(term) ||
            block.includes(term)
          );
        }

        return street.includes(term) || block.includes(term);
      })
      .sort((a, b) => a.sequenciaPercurso - b.sequenciaPercurso);
  }, [properties, search]);

  const groups = useMemo(() => {
    const grouped = new Map<string, SectorPropertyMock[]>();
    for (const property of filtered) {
      const key =
        grouping === "quarteirao" ? property.quarteirao : property.logradouro;
      grouped.set(key, [...(grouped.get(key) ?? []), property]);
    }
    for (const properties of grouped.values()) {
      properties.sort((a, b) => {
        const stateA = outcome(a, cycle);
        const stateB = outcome(b, cycle);
        return (
          outcomePriority[stateA] - outcomePriority[stateB] ||
          a.sequenciaPercurso - b.sequenciaPercurso
        );
      });
    }
    return [...grouped];
  }, [cycle, filtered, grouping]);

  const counts = properties.reduce<Record<Outcome, number>>(
    (result, property) => {
      result[outcome(property, cycle)]++;
      return result;
    },
    { VISITADO: 0, RECUSA: 0, FECHADO: 0, NAO_VISITADO: 0 },
  );

  return (
    <div>
      <PageHeading eyebrow={eyebrow} title={title} description={description} />
      <section className="border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-48 flex-1 text-xs font-semibold text-slate-700">
            Ciclo bimestral
            <select
              value={cycle}
              onChange={(event) => {
                const nextCycle = event.target.value;
                setCycle(nextCycle);
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
          <span className="text-orange-800">● Recusas: {counts.RECUSA}</span>
          <span className="text-amber-800">
            ● Ninguém em casa/fechados: {counts.FECHADO}
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
            <div
              className={`mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6 ${
                grouping === "quarteirao" ? "lg:grid-cols-10" : "lg:grid-cols-8"
              }`}
            >
              {items.map((property) => {
                const state =
                  outcome(property, cycle);
                const visit = visitInCycle(property, cycle);
                const deposits = visit
                  ? Object.values(visit.formulario.depositos).reduce(
                      (total, value) => total + value,
                      0,
                    )
                  : 0;
                const PropertyIcon = propertyTypeIcon(property.tipo);
                return (
                  <Link
                    key={property.id}
                    href={`/visitas/${property.id}?ciclo=${cycle}`}
                    aria-label={`${propertyType(property.tipo)}, número ${property.numero}, ${outcomeLabels[state]}`}
                    className={`relative flex aspect-square min-w-0 flex-col rounded-lg border-2 p-1.5 text-left shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 md:p-2 ${outcomeStyles[state]}`}
                  >
                    <span className="flex min-w-0 items-start justify-between gap-1">
                      <span className="flex min-w-0 items-center gap-1 truncate text-[clamp(0.55rem,2.6vw,0.75rem)] font-medium leading-tight md:text-xs">
                        <PropertyIcon
                          className="h-3.5 w-3.5 shrink-0 md:h-4 md:w-4"
                          strokeWidth={2}
                          aria-hidden="true"
                        />
                        <span className="truncate">
                          {propertyType(property.tipo)}
                        </span>
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
      {totalPages > 1 && (
        <nav
          aria-label="Paginação dos imóveis"
          className="mt-4 flex flex-wrap items-center justify-center gap-3 border border-slate-200 bg-white p-4"
        >
          {currentPage > 1 && (
            <Link
              href={`/visitas?page=${currentPage - 1}`}
              className="border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Página anterior
            </Link>
          )}
          <span className="text-sm font-semibold text-slate-700">
            Página {currentPage} de {totalPages}
          </span>
          {currentPage < totalPages && (
            <Link
              href={`/visitas?page=${currentPage + 1}`}
              className="border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Próxima página
            </Link>
          )}
        </nav>
      )}
      <p className="mt-4 text-xs text-slate-600">
        Dados fictícios fornecidos pela API. O histórico disponível contém a
        última visita de cada imóvel.
      </p>
    </div>
  );
}
