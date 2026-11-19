import { Panel } from "@/components/plataforma/dashboard-ui";
import { SampleStatusBadge } from "@/components/laboratorio/status-badge";
import type { LaboratorySampleMock } from "@/lib/laboratorio/demo-data";
import { municipalClientsDemo } from "@/lib/administracao/demo-data";

export type SampleFilter = "PENDENTES" | "CONCLUIDAS" | "TODAS";

const filters: Array<{ id: SampleFilter; label: string }> = [
  { id: "PENDENTES", label: "Pendentes" },
  { id: "CONCLUIDAS", label: "Concluídas" },
  { id: "TODAS", label: "Todas" },
];

export function SampleQueue({
  samples,
  selectedId,
  filter,
  onFilterChange,
  onSelect,
}: {
  samples: LaboratorySampleMock[];
  selectedId: string;
  filter: SampleFilter;
  onFilterChange: (filter: SampleFilter) => void;
  onSelect: (id: string) => void;
}) {
  const primaryColor =
    municipalClientsDemo.find((client) => client.id === "lagoa-de-itaenga")
      ?.branding.primaryColor ?? "#006b4f";
  return (
    <Panel
      title="Fila de amostras"
      description="Selecione uma coleta para conferir e processar."
    >
      <div
        className="-mx-5 -mt-5 mb-4 h-1"
        style={{ backgroundColor: primaryColor }}
      />
      <div className="mb-4 grid grid-cols-3 border border-slate-300 bg-slate-50 p-1">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onFilterChange(item.id)}
            style={
              filter === item.id ? { backgroundColor: primaryColor } : undefined
            }
            className={`min-h-9 px-2 text-xs font-semibold ${filter === item.id ? "text-white" : "text-slate-600 hover:bg-white"}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="max-h-[42rem] space-y-2 overflow-y-auto pr-1">
        {samples.map((sample) => (
          <button
            key={sample.id}
            type="button"
            onClick={() => onSelect(sample.id)}
            style={
              selectedId === sample.id
                ? { borderColor: primaryColor }
                : undefined
            }
            className={`w-full border p-3 text-left transition ${selectedId === sample.id ? "bg-emerald-50" : "border-slate-200 bg-white hover:border-slate-400"}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <strong className="text-sm text-slate-950">{sample.code}</strong>
              <SampleStatusBadge status={sample.status} />
            </div>
            <p className="mt-2 text-xs text-slate-600">
              Qd. {sample.property.block} · {sample.property.street},{" "}
              {sample.property.number}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {sample.tubeCount} tubito(s) · depósito {sample.sourceDeposit}
            </p>
          </button>
        ))}
      </div>
    </Panel>
  );
}
