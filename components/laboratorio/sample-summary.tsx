import Link from "next/link";
import type { ReactNode } from "react";
import { Beaker, Clock3, FlaskConical, Home } from "lucide-react";
import { formatLaboratoryDate } from "@/components/laboratorio/date";
import { SampleStatusBadge } from "@/components/laboratorio/status-badge";
import { Panel } from "@/components/plataforma/dashboard-ui";
import type { LaboratorySampleMock } from "@/lib/laboratorio/demo-data";

export function SampleSummary({
  sample,
  onReceive,
  onStartAnalysis,
}: {
  sample: LaboratorySampleMock;
  onReceive: () => void;
  onStartAnalysis: () => void;
}) {
  return (
    <Panel
      title={`Amostra ${sample.code}`}
      description="Identificação e cadeia de custódia da coleta."
      action={<SampleStatusBadge status={sample.status} />}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Info
          icon={<Home />}
          label="Imóvel"
          value={`${sample.property.street}, ${sample.property.number}`}
        />
        <Info
          icon={<Beaker />}
          label="Coleta"
          value={`${sample.tubeCount} tubito(s) · ${sample.sourceDeposit}`}
        />
        <Info
          icon={<Clock3 />}
          label="Coletada em"
          value={formatLaboratoryDate(sample.collectedAt)}
        />
        <Info
          icon={<FlaskConical />}
          label="Coletor"
          value={sample.collectedBy}
        />
      </div>
      <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-200 pt-4">
        <Link
          href={`/visitas/${sample.property.id}`}
          className="inline-flex min-h-10 items-center border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Abrir imóvel de origem
        </Link>
        {sample.status === "COLETADA" && (
          <ActionButton onClick={onReceive}>Confirmar recebimento</ActionButton>
        )}
        {sample.status === "RECEBIDA" && (
          <ActionButton onClick={onStartAnalysis}>Iniciar análise</ActionButton>
        )}
      </div>
    </Panel>
  );
}

function Info({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="border border-slate-200 bg-slate-50 p-3">
      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>
        {label}
      </span>
      <p className="mt-2 text-sm font-semibold leading-5 text-slate-900">
        {value}
      </p>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-10 bg-vigia-green px-4 text-sm font-semibold text-white hover:brightness-90"
    >
      {children}
    </button>
  );
}
