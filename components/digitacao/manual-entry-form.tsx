"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Panel } from "@/components/plataforma/dashboard-ui";
import { FieldHelp } from "@/components/plataforma/field-help";

export interface ManualEntry {
  id: string;
  paperFormNumber: string;
  propertyId: string;
  agent: string;
  activityDate: string;
  access: string;
  deposits: number;
  tubes: number;
  sampleStart: number;
  sampleEnd: number;
  treated: boolean;
  notes: string;
  source: "PAPEL";
  transcribedAt: string;
  transcribedBy: string;
}

const fieldClass =
  "mt-1 min-h-11 w-full border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-600";

export function ManualEntryForm({
  onSave,
  properties = [],
}: {
  onSave: (entry: ManualEntry) => void;
  properties?: unknown[];
}) {
  const [saved, setSaved] = useState(false);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const deposits = ["A1", "A2", "B", "C", "D1", "D2", "E"].reduce(
      (total, category) => total + Number(data.get(`deposit_${category}`)),
      0,
    );
    onSave({
      id: `paper-${Date.now()}`,
      paperFormNumber: String(data.get("paperFormNumber")),
      propertyId: String(data.get("propertyId")),
      agent: String(data.get("agent")),
      activityDate: String(data.get("activityDate")),
      access: String(data.get("access")),
      deposits,
      tubes: Number(data.get("tubes")),
      sampleStart: Number(data.get("sampleStart")),
      sampleEnd: Number(data.get("sampleEnd")),
      treated: data.get("treated") === "SIM",
      notes: String(data.get("notes")),
      source: "PAPEL",
      transcribedAt: new Date().toISOString(),
      transcribedBy: "Ana Beatriz · Digitadora",
    });
    setSaved(true);
    form.reset();
  };

  return (
    <Panel
      title="Digitar ficha preenchida em papel"
      description="A transcrição preserva a origem física e não se apresenta como registro feito pelo ACE no aplicativo."
    >
      <form
        onSubmit={submit}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <Field label="Número da ficha de papel">
          <input
            required
            name="paperFormNumber"
            placeholder="Ex.: F-2026-0042"
            className={fieldClass}
          />
        </Field>
        <Field label="ACE responsável pela ficha">
          <input
            required
            name="agent"
            defaultValue="José Antônio da Silva"
            className={fieldClass}
          />
        </Field>
        <Field label="Data da atividade">
          <input
            required
            name="activityDate"
            type="date"
            defaultValue="2026-11-06"
            className={fieldClass}
          />
        </Field>
        <Field label="Imóvel">
          <select required name="propertyId" className={fieldClass}>
            {properties.slice(0, 30).map((rawProperty) => {
              const property = rawProperty as Record<string, unknown>;
              return (
                <option key={String(property.id)} value={String(property.id)}>
                  Qd. {String(property.quarteirao ?? "")} ·{" "}
                  {String(property.logradouro ?? property.endereco ?? "")},{" "}
                  {String(property.numero ?? "")}
                </option>
              );
            })}
          </select>
        </Field>
        <Field label="Resultado do acesso">
          <select name="access" className={fieldClass}>
            <option value="REALIZADO">Realizado</option>
            <option value="FECHADO">Fechado</option>
            <option value="RECUSA">Recusa</option>
          </select>
        </Field>
        <Field label="Origem do registro">
          <input
            readOnly
            value="Papel · transcrição assistida"
            className={`${fieldClass} bg-slate-100 font-semibold`}
          />
        </Field>
        <fieldset className="border border-slate-200 p-4 sm:col-span-2 lg:col-span-3">
          <legend className="px-2 text-sm font-bold text-slate-900">
            Depósitos inspecionados
          </legend>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
            {["A1", "A2", "B", "C", "D1", "D2", "E"].map((category) => (
              <Field key={category} label={category}>
                <input
                  name={`deposit_${category}`}
                  type="number"
                  min="0"
                  defaultValue="0"
                  className={fieldClass}
                />
              </Field>
            ))}
          </div>
        </fieldset>
        <fieldset className="grid gap-4 border border-slate-200 p-4 sm:col-span-2 sm:grid-cols-2 lg:col-span-3 lg:grid-cols-4">
          <legend className="px-2 text-sm font-bold text-slate-900">
            Amostra e tratamento
          </legend>
          <Field label="Nº da amostra inicial">
            <input
              name="sampleStart"
              type="number"
              min="0"
              defaultValue="0"
              className={fieldClass}
            />
          </Field>
          <Field label="Nº da amostra final">
            <input
              name="sampleEnd"
              type="number"
              min="0"
              defaultValue="0"
              className={fieldClass}
            />
          </Field>
          <Field label="Quantidade de tubitos">
            <input
              name="tubes"
              type="number"
              min="0"
              defaultValue="0"
              className={fieldClass}
            />
          </Field>
          <Field label="Imóvel tratado">
            <select name="treated" defaultValue="NAO" className={fieldClass}>
              <option value="NAO">Não</option>
              <option value="SIM">Sim</option>
            </select>
          </Field>
        </fieldset>
        <label className="text-xs font-semibold text-slate-700 sm:col-span-2 lg:col-span-3">
          <FieldHelp label="Observações transcritas da ficha" />
          <textarea name="notes" rows={3} className={`${fieldClass} py-2`} />
        </label>
        <label className="flex items-start gap-3 border border-amber-300 bg-amber-50 p-3 text-xs leading-5 text-amber-950 sm:col-span-2 lg:col-span-3">
          <input required type="checkbox" className="mt-1" />
          <span>
            Confirmo que conferi a ficha física e que os dados correspondem ao
            documento entregue pelo ACE.
          </span>
        </label>
        <div className="flex justify-center sm:col-span-2 lg:col-span-3">
          <button
            type="submit"
            className="min-h-11 bg-vigia-green px-6 text-sm font-semibold text-white hover:brightness-90"
          >
            Salvar transcrição da ficha
          </button>
        </div>
        {saved && (
          <p
            role="status"
            className="text-center text-sm font-semibold text-emerald-800 sm:col-span-2 lg:col-span-3"
          >
            Ficha transcrita com origem PAPEL e trilha de responsabilidade.
          </p>
        )}
      </form>
    </Panel>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="text-xs font-semibold text-slate-700">
      <FieldHelp label={label} />
      {children}
    </label>
  );
}
