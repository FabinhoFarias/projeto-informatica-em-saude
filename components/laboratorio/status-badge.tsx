import type { LaboratorySampleStatus } from "@/lib/laboratorio/demo-data";

const statusPresentation: Record<
  LaboratorySampleStatus,
  { label: string; className: string }
> = {
  COLETADA: {
    label: "Aguardando recebimento",
    className: "bg-amber-100 text-amber-900",
  },
  RECEBIDA: { label: "Recebida", className: "bg-blue-100 text-blue-900" },
  EM_ANALISE: {
    label: "Em análise",
    className: "bg-violet-100 text-violet-900",
  },
  CONCLUIDA: {
    label: "Concluída",
    className: "bg-emerald-100 text-emerald-900",
  },
  INCONCLUSIVA: {
    label: "Inconclusiva",
    className: "bg-slate-200 text-slate-800",
  },
};

export function SampleStatusBadge({
  status,
}: {
  status: LaboratorySampleStatus;
}) {
  const presentation = statusPresentation[status];
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${presentation.className}`}
    >
      {presentation.label}
    </span>
  );
}
