import { AlertTriangle } from "lucide-react";
import { useState, type FormEvent } from "react";
import { OperationalSection } from "./shared";
import type { OccurrenceItem } from "./types";

export function OccurrencePanel() {
  const [occurrences, setOccurrences] = useState<OccurrenceItem[]>([]);
  const [notice, setNotice] = useState("");
  function addOccurrence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const description = String(data.get("occurrenceDescription") ?? "").trim();
    if (!description) {
      setNotice("Descreva o risco observado.");
      return;
    }
    setOccurrences((current) => [
      ...current,
      {
        id: `occurrence-${Date.now()}`,
        category: String(data.get("occurrenceCategory")),
        severity: String(data.get("occurrenceSeverity")),
        description,
        status: "REGISTRADA",
      },
    ]);
    form.reset();
    setNotice("Ocorrência fictícia adicionada à ficha.");
  }
  return (
    <OperationalSection
      title="Ocorrências e riscos observados"
      description="Registre problemas que precisam de acompanhamento além da inspeção do imóvel."
    >
      <form onSubmit={addOccurrence} className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold text-slate-700">
          Categoria
          <select
            name="occurrenceCategory"
            className="mt-1 h-10 w-full border border-slate-300 bg-white px-3 text-sm font-normal outline-none focus:border-emerald-700"
          >
            <option>Água parada</option>
            <option>Acúmulo de lixo</option>
            <option>Terreno sem manutenção</option>
            <option>Problema de saneamento</option>
            <option>Outro risco ambiental</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-700">
          Prioridade observada
          <select
            name="occurrenceSeverity"
            className="mt-1 h-10 w-full border border-slate-300 bg-white px-3 text-sm font-normal outline-none focus:border-emerald-700"
          >
            <option>Rotina</option>
            <option>Atenção</option>
            <option>Urgente</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-700 sm:col-span-2">
          Descrição
          <textarea
            name="occurrenceDescription"
            rows={3}
            className="mt-1 w-full border border-slate-300 bg-white p-3 text-sm font-normal outline-none focus:border-emerald-700"
            placeholder="Descreva o que foi observado sem incluir dados pessoais desnecessários."
          />
        </label>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <button
            type="submit"
            className="min-h-10 bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-900"
          >
            Adicionar ocorrência
          </button>
          <p role="status" className="text-xs font-medium text-emerald-800">
            {notice}
          </p>
        </div>
      </form>
      {occurrences.length > 0 && (
        <ul className="mt-4 space-y-2 border-t border-slate-200 pt-4">
          {occurrences.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-2 border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-start sm:justify-between"
            >
              <div>
                <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <AlertTriangle
                    className="h-4 w-4 text-amber-700"
                    aria-hidden="true"
                  />
                  {item.category}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  {item.description}
                </p>
              </div>
              <span className="shrink-0 bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-700">
                {item.severity} · {item.status.toLocaleLowerCase("pt-BR")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </OperationalSection>
  );
}
