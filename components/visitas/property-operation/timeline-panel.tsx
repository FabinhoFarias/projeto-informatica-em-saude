import { RefreshCw } from "lucide-react";
import { useState } from "react";
import type { SectorPropertyMock } from "@/lib/visitas/demo-data";
import {
  addDays,
  formatDateBr,
  initialTimeline,
  OperationalSection,
} from "./shared";
import type { TimelineItem } from "./types";

const toneStyle: Record<TimelineItem["tone"], string> = {
  neutral: "border-slate-300 bg-slate-100",
  warning: "border-amber-400 bg-amber-100",
  success: "border-emerald-500 bg-emerald-100",
};

export function TimelinePanel({ property }: { property: SectorPropertyMock }) {
  const [timeline, setTimeline] = useState(() => initialTimeline(property));
  const completed = timeline.some((item) => item.title === "Retorno realizado");
  function completeReturn() {
    if (completed) return;
    const baseDate = property.ultimaVisita?.dataAtividade ?? "2026-11-06";
    setTimeline((current) => [
      ...current,
      {
        id: `retorno-${property.id}`,
        date: addDays(baseDate, 3),
        title: "Retorno realizado",
        description:
          "Nova tentativa fictícia concluída e vinculada ao histórico do imóvel.",
        tone: "success",
      },
    ]);
  }
  return (
    <OperationalSection
      title="Histórico e recuperação"
      description="Tentativas permanecem separadas para não apagar recusas ou imóveis fechados."
    >
      <ol className="space-y-3">
        {timeline.map((item) => (
          <li key={item.id} className="grid grid-cols-[auto_1fr] gap-3">
            <span
              className={`mt-1 h-3 w-3 rounded-full border ${toneStyle[item.tone]}`}
              aria-hidden="true"
            />
            <div className="border-b border-slate-100 pb-3 last:border-0">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-bold text-slate-900">{item.title}</p>
                <time className="text-xs text-slate-500">
                  {formatDateBr(item.date)}
                </time>
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                {item.description}
              </p>
            </div>
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={completeReturn}
        disabled={completed}
        className="mt-4 inline-flex min-h-10 items-center gap-2 border border-emerald-800 px-4 text-sm font-semibold text-emerald-900 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"
      >
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        {completed ? "Retorno registrado" : "Simular retorno realizado"}
      </button>
    </OperationalSection>
  );
}
