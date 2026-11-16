import type { FormEvent, ReactNode } from "react";
import { Panel } from "@/components/plataforma/dashboard-ui";
import type { LaboratorySampleMock } from "@/lib/laboratorio/demo-data";

const controlClass =
  "min-h-11 w-full border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-600";

export function AnalysisForm({
  sample,
  onSubmit,
}: {
  sample: LaboratorySampleMock;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const result = sample.result;
  return (
    <Panel
      title="Resultado da análise"
      description="O resultado laboratorial não é inferido pela observação visual do ACE."
    >
      <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Espécie">
          <select
            name="species"
            defaultValue={result?.species ?? "AEDES_AEGYPTI"}
            className={controlClass}
          >
            <option value="AEDES_AEGYPTI">Aedes aegypti</option>
            <option value="AEDES_ALBOPICTUS">Aedes albopictus</option>
            <option value="OUTRA">Outra</option>
            <option value="NAO_IDENTIFICADA">Não identificada</option>
          </select>
        </Field>
        <Field label="Fase">
          <select
            name="phase"
            defaultValue={result?.phase ?? "LARVA"}
            className={controlClass}
          >
            <option value="LARVA">Larva</option>
            <option value="PUPA">Pupa</option>
            <option value="ADULTO">Adulto</option>
            <option value="EXUVIA">Exúvia</option>
          </select>
        </Field>
        <Field label="Número de exemplares">
          <input
            name="specimenCount"
            type="number"
            min="0"
            defaultValue={result?.specimenCount ?? 0}
            className={controlClass}
          />
        </Field>
        <Field label="Método">
          <input
            name="method"
            defaultValue={result?.method ?? "Identificação morfológica"}
            className={controlClass}
          />
        </Field>
        <Field label="Conclusão">
          <select
            name="conclusion"
            defaultValue={result?.conclusion ?? "POSITIVO"}
            className={controlClass}
          >
            <option value="POSITIVO">Positivo</option>
            <option value="NEGATIVO">Negativo</option>
            <option value="INCONCLUSIVO">Inconclusivo</option>
          </select>
        </Field>
        <Field label="Observações" wide>
          <textarea
            name="notes"
            rows={3}
            defaultValue={result?.notes ?? ""}
            className={`${controlClass} py-2`}
          />
        </Field>
        <div className="flex justify-center sm:col-span-2">
          <button
            type="submit"
            className="min-h-11 bg-vigia-green px-6 text-sm font-semibold text-white hover:brightness-90"
          >
            {result ? "Atualizar resultado" : "Concluir análise"}
          </button>
        </div>
      </form>
    </Panel>
  );
}

function Field({
  label,
  children,
  wide = false,
}: {
  label: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={wide ? "sm:col-span-2" : ""}>
      <span className="mb-1.5 block text-xs font-semibold text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}
