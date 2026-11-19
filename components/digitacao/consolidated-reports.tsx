"use client";

import { useMemo, useState } from "react";
import { MetricCard, Panel } from "@/components/plataforma/dashboard-ui";
import {
  buildPeriodConsolidated,
  type ConsolidationPeriod,
} from "@/lib/digitacao/consolidated";

const fieldClass =
  "mt-1 min-h-11 w-full border border-slate-300 bg-white px-3 text-sm text-slate-900";
const references: Record<ConsolidationPeriod, string> = {
  SEMANA: "2026-11-01|2026-11-07",
  MES: "2026-11",
  CICLO: "6/2026",
  SEMANA_EPIDEMIOLOGICA: "2026-SE45",
};
const INITIAL_GENERATION = {
  id: "DOC-MOCK-20261107-001",
  generatedAt: "2026-11-07T12:00:00-03:00",
};

export function ConsolidatedReports() {
  const [period, setPeriod] = useState<ConsolidationPeriod>("SEMANA");
  const [reference, setReference] = useState(references.SEMANA);
  const [generation, setGeneration] = useState(INITIAL_GENERATION);
  const totals = useMemo(
    () => buildPeriodConsolidated({ period, reference }),
    [period, reference],
  );
  const changePeriod = (next: ConsolidationPeriod) => {
    setPeriod(next);
    setReference(references[next]);
  };

  return (
    <Panel
      title="Consolidados por período"
      description="Os totais são recalculados dos registros de origem; períodos distintos não são somados cegamente."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <label className="text-xs font-semibold text-slate-700">
          Tipo de período
          <select
            value={period}
            onChange={(event) =>
              changePeriod(event.target.value as ConsolidationPeriod)
            }
            className={fieldClass}
          >
            <option value="SEMANA">Semana</option>
            <option value="MES">Mês</option>
            <option value="CICLO">Ciclo bimestral</option>
            <option value="SEMANA_EPIDEMIOLOGICA">Semana epidemiológica</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-700">
          Referência
          <input
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            className={fieldClass}
          />
        </label>
        <div className="flex items-end">
          <button
            type="button"
            onClick={() => setGeneration(createGeneration())}
            className="min-h-11 w-full bg-vigia-green px-4 text-sm font-semibold text-white hover:brightness-90"
          >
            Gerar nova versão
          </button>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Visitas"
          value={String(totals.visits)}
          detail={`${totals.blocks} quarteirão(ões)`}
        />
        <MetricCard
          label="Inspecionados"
          value={String(totals.inspected)}
          detail={`${totals.pending} pendência(s)`}
        />
        <MetricCard
          label="Depósitos"
          value={String(totals.deposits)}
          detail="Inspecionados no período"
        />
        <MetricCard
          label="Amostras"
          value={String(totals.samples)}
          detail={`${totals.treated} imóvel(is) tratado(s)`}
        />
      </div>
      <DocumentMetadata
        generation={generation}
        period={period}
        reference={reference}
      />
    </Panel>
  );
}

function createGeneration() {
  const now = new Date();
  return {
    id: `DOC-${now.getTime().toString(36).toUpperCase()}`,
    generatedAt: now.toISOString(),
  };
}
function DocumentMetadata({
  generation,
  period,
  reference,
}: {
  generation: ReturnType<typeof createGeneration>;
  period: ConsolidationPeriod;
  reference: string;
}) {
  return (
    <section className="mt-5 border border-slate-300 bg-slate-50 p-4">
      <h3 className="text-sm font-bold text-slate-950">
        Rastreabilidade da geração
      </h3>
      <dl className="mt-3 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
        <Metadata label="Identificador" value={generation.id} />
        <Metadata label="Template" value="VIGIA-I2 · versão 1.0.0" />
        <Metadata
          label="Gerado em"
          value={new Date(generation.generatedAt).toLocaleString("pt-BR", {
            timeZone: "America/Recife",
          })}
        />
        <Metadata
          label="Parâmetros"
          value={`${period} · ${reference} · município LI`}
        />
      </dl>
    </section>
  );
}
function Metadata({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 break-words font-medium text-slate-900">{value}</dd>
    </div>
  );
}
