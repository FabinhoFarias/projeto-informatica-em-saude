import { CalendarClock } from "lucide-react";
import type { SectorPropertyMock } from "@/lib/visitas/demo-data";
import { addDays, formatDateBr, OperationalSection } from "./shared";

export function StrategicPointPanel({
  property,
}: {
  property: SectorPropertyMock;
}) {
  if (property.tipo !== "PONTO_ESTRATEGICO") return null;
  const lastDate = property.ultimaVisita?.dataAtividade ?? "2026-11-06";
  return (
    <OperationalSection
      title="Agenda do ponto estratégico"
      description="Inspeção e tratamento possuem controles separados."
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Última inspeção
          </p>
          <p className="mt-2 text-sm font-bold text-slate-900">
            {formatDateBr(lastDate)}
          </p>
          <p className="mt-1 text-xs text-slate-600">Vistoria quinzenal</p>
        </div>
        <div className="border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Próxima inspeção
          </p>
          <p className="mt-2 text-sm font-bold text-slate-900">
            {formatDateBr(addDays(lastDate, 15))}
          </p>
          <p className="mt-1 text-xs text-slate-600">Agenda demonstrativa</p>
        </div>
        <div className="border border-amber-300 bg-amber-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
            Tratamento
          </p>
          <p className="mt-2 text-sm font-bold text-amber-950">
            Avaliação pendente
          </p>
          <p className="mt-1 text-xs text-amber-800">
            Não implica aplicação automática
          </p>
        </div>
      </div>
      <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
        <CalendarClock className="h-4 w-4" aria-hidden="true" />
        Periodicidade fictícia sujeita à configuração municipal.
      </p>
    </OperationalSection>
  );
}
