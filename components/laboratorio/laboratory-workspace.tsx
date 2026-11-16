"use client";

import { useMemo, useState, type FormEvent } from "react";
import { AnalysisForm } from "@/components/laboratorio/analysis-form";
import {
  SampleQueue,
  type SampleFilter,
} from "@/components/laboratorio/sample-queue";
import { SampleSummary } from "@/components/laboratorio/sample-summary";
import { SampleTimeline } from "@/components/laboratorio/sample-timeline";
import { MetricCard, PageHeading } from "@/components/plataforma/dashboard-ui";
import {
  laboratorySamplesDemo,
  type LaboratoryPhase,
  type LaboratorySampleMock,
  type LaboratorySpecies,
} from "@/lib/laboratorio/demo-data";

const LABORATORY_USER = "João Silva · ACE Laboratorista";
const finishedStatuses = ["CONCLUIDA", "INCONCLUSIVA"];

export function LaboratoryWorkspace() {
  const [samples, setSamples] = useState<LaboratorySampleMock[]>(() =>
    structuredClone(laboratorySamplesDemo),
  );
  const [selectedId, setSelectedId] = useState(samples[0]?.id ?? "");
  const [filter, setFilter] = useState<SampleFilter>("PENDENTES");
  const selected =
    samples.find((sample) => sample.id === selectedId) ?? samples[0];

  const visibleSamples = useMemo(
    () =>
      samples.filter((sample) => {
        const finished = finishedStatuses.includes(sample.status);
        if (filter === "CONCLUIDAS") return finished;
        if (filter === "PENDENTES") return !finished;
        return true;
      }),
    [filter, samples],
  );

  const updateSelected = (
    change: (sample: LaboratorySampleMock) => LaboratorySampleMock,
  ) =>
    setSamples((current) =>
      current.map((sample) =>
        sample.id === selectedId ? change(sample) : sample,
      ),
    );

  const receiveSample = () =>
    updateSelected((sample) => ({
      ...sample,
      status: "RECEBIDA",
      receivedAt: new Date().toISOString(),
      receivedBy: LABORATORY_USER,
    }));

  const startAnalysis = () =>
    updateSelected((sample) => ({
      ...sample,
      status: "EM_ANALISE",
      analysisStartedAt: new Date().toISOString(),
    }));

  const saveResult = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const conclusion = String(data.get("conclusion")) as
      | "POSITIVO"
      | "NEGATIVO"
      | "INCONCLUSIVO";

    updateSelected((sample) => ({
      ...sample,
      status: conclusion === "INCONCLUSIVO" ? "INCONCLUSIVA" : "CONCLUIDA",
      result: {
        species: String(data.get("species")) as LaboratorySpecies,
        phase: String(data.get("phase")) as LaboratoryPhase,
        specimenCount: Number(data.get("specimenCount")),
        method: String(data.get("method")),
        conclusion,
        notes: String(data.get("notes")),
        analyzedBy: LABORATORY_USER,
        completedAt: new Date().toISOString(),
      },
    }));
  };

  if (!selected) return null;

  const pending = samples.filter(
    (sample) => !finishedStatuses.includes(sample.status),
  ).length;
  const awaiting = samples.filter(
    (sample) => sample.status === "COLETADA",
  ).length;
  const positive = samples.filter(
    (sample) => sample.result?.conclusion === "POSITIVO",
  ).length;

  return (
    <div className="mx-auto max-w-[1600px]">
      <PageHeading
        eyebrow="Levantamento de índices"
        title="Laboratório entomológico"
        description="Receba as coletas dos ACEs, registre a análise e mantenha cada resultado rastreável até a visita e o imóvel de origem. Dados fictícios para demonstração."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Amostras"
          value={String(samples.length)}
          detail="Coletas vinculadas a imóveis"
        />
        <MetricCard
          label="A receber"
          value={String(awaiting)}
          detail="Ainda sob responsabilidade do campo"
        />
        <MetricCard
          label="Pendentes"
          value={String(pending)}
          detail="Recebidas ou em análise"
        />
        <MetricCard
          label="Positivas"
          value={String(positive)}
          detail="Confirmação laboratorial registrada"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(20rem,0.85fr)_minmax(0,1.5fr)]">
        <SampleQueue
          samples={visibleSamples}
          selectedId={selected.id}
          filter={filter}
          onFilterChange={setFilter}
          onSelect={setSelectedId}
        />
        <div className="space-y-5">
          <SampleSummary
            sample={selected}
            onReceive={receiveSample}
            onStartAnalysis={startAnalysis}
          />
          <SampleTimeline sample={selected} />
          {(selected.status === "EM_ANALISE" || selected.result) && (
            <AnalysisForm
              key={`${selected.id}-${selected.result?.completedAt ?? "new"}`}
              sample={selected}
              onSubmit={saveResult}
            />
          )}
        </div>
      </div>
    </div>
  );
}
