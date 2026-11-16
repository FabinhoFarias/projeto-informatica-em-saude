import { CheckCircle2 } from "lucide-react";
import { formatLaboratoryDate } from "@/components/laboratorio/date";
import { Panel } from "@/components/plataforma/dashboard-ui";
import type { LaboratorySampleMock } from "@/lib/laboratorio/demo-data";

export function SampleTimeline({ sample }: { sample: LaboratorySampleMock }) {
  return (
    <Panel
      title="Movimentação da amostra"
      description="Etapas registradas separadamente da visita de campo."
    >
      <ol className="grid gap-3 md:grid-cols-3">
        <Step
          title="Coleta em campo"
          detail={formatLaboratoryDate(sample.collectedAt)}
          complete
        />
        <Step
          title="Recebimento"
          detail={formatLaboratoryDate(sample.receivedAt)}
          complete={Boolean(sample.receivedAt)}
        />
        <Step
          title="Análise"
          detail={formatLaboratoryDate(
            sample.result?.completedAt ?? sample.analysisStartedAt,
          )}
          complete={Boolean(sample.result)}
        />
      </ol>
    </Panel>
  );
}

function Step({
  title,
  detail,
  complete,
}: {
  title: string;
  detail: string;
  complete: boolean;
}) {
  return (
    <li
      className={`border-l-4 p-3 ${complete ? "border-emerald-600 bg-emerald-50" : "border-slate-300 bg-slate-50"}`}
    >
      <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        {complete && <CheckCircle2 className="h-4 w-4 text-emerald-700" />}
        {title}
      </p>
      <p className="mt-1 text-xs text-slate-600">{detail}</p>
    </li>
  );
}
