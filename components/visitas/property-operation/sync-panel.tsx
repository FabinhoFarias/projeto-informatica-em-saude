import {
  CheckCircle2,
  Clock3,
  ShieldAlert,
  Upload,
  Wifi,
  WifiOff,
  XCircle,
} from "lucide-react";
import { OperationalSection } from "./shared";
import type { DemoSyncStatus } from "./types";

const presentation: Record<
  DemoSyncStatus,
  { label: string; description: string; style: string; icon: typeof Wifi }
> = {
  PENDENTE: {
    label: "Pendente",
    description: "Registro salvo no aparelho e aguardando conexão.",
    style: "border-amber-300 bg-amber-50 text-amber-900",
    icon: Clock3,
  },
  ENVIANDO: {
    label: "Enviando",
    description: "Transmissão fictícia em andamento.",
    style: "border-blue-300 bg-blue-50 text-blue-900",
    icon: Upload,
  },
  SINCRONIZADO: {
    label: "Sincronizado",
    description: "Registro fictício recebido sem pendências.",
    style: "border-emerald-300 bg-emerald-50 text-emerald-900",
    icon: CheckCircle2,
  },
  REJEITADO: {
    label: "Rejeitado",
    description: "O envio exige correção antes de uma nova tentativa.",
    style: "border-red-300 bg-red-50 text-red-900",
    icon: XCircle,
  },
  CONFLITO: {
    label: "Conflito",
    description: "Existe outra versão fictícia aguardando conferência.",
    style: "border-violet-300 bg-violet-50 text-violet-900",
    icon: ShieldAlert,
  },
};

export function SyncPanel({
  status,
  onStatusChange,
}: {
  status: DemoSyncStatus;
  onStatusChange: (status: DemoSyncStatus) => void;
}) {
  const current = presentation[status];
  const Icon = current.icon;
  return (
    <OperationalSection
      title="Sincronização da ficha"
      description="Simulação dos estados que o aplicativo deverá tratar quando funcionar offline."
    >
      <div className={`flex items-start gap-3 border p-3 ${current.style}`}>
        <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div>
          <p className="text-sm font-bold">{current.label}</p>
          <p className="mt-1 text-xs leading-5">{current.description}</p>
        </div>
      </div>
      <label className="mt-4 block text-xs font-semibold text-slate-700">
        Simular estado da transmissão
        <select
          value={status}
          onChange={(event) =>
            onStatusChange(event.target.value as DemoSyncStatus)
          }
          className="mt-1 h-10 w-full border border-slate-300 bg-white px-3 text-sm font-normal outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
        >
          {Object.entries(presentation).map(([value, item]) => (
            <option key={value} value={value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
        {status === "PENDENTE" ? (
          <WifiOff className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Wifi className="h-4 w-4" aria-hidden="true" />
        )}
        Demonstração local; nenhum dado é transmitido.
      </p>
    </OperationalSection>
  );
}
