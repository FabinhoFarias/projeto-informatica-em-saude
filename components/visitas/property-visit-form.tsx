"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import type { SectorPropertyMock } from "@/lib/visitas/demo-data";

const fieldClass =
  "mt-1 h-10 w-full border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100";
const smallFieldClass =
  "mt-1 block h-10 w-full border border-slate-300 bg-white px-2 text-center text-sm outline-none focus:border-emerald-700";
const propertyTypeLabels: Record<SectorPropertyMock["tipo"], string> = {
  RESIDENCIAL: "Residência",
  PREDIO: "Prédio",
  COMERCIAL: "Comércio",
  TERRENO: "Terreno baldio",
  ESCOLA: "Escola",
  UBS: "Unidade de saúde",
  IGREJA: "Igreja",
  INDUSTRIAL: "Indústria",
  PONTO_ESTRATEGICO: "Ponto estratégico",
  OUTRO: "Outro",
};

function formatDateBr(isoDate: string) {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

function dateBrToIso(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  const dayNumber = Number(day);
  const monthNumber = Number(month);
  if (monthNumber < 1 || monthNumber > 12 || dayNumber < 1 || dayNumber > 31)
    return null;
  return `${year}-${month}-${day}`;
}

function todayInRecifeIso() {
  const parts = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Recife",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${value.year}-${value.month}-${value.day}`;
}

function visitMatchesCycle(date: string, cycle: string) {
  const [year, month] = date.split("-").map(Number);
  return `${year}-${Math.floor((month - 1) / 2) + 1}` === cycle;
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  type?: string;
}) {
  return (
    <label className="text-xs font-semibold text-slate-700">
      {label}
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? (type === "number" ? 0 : undefined)}
        className={fieldClass}
      />
    </label>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-200 px-4 py-3 sm:px-5">
        <h2 className="text-base font-bold text-slate-950">{title}</h2>
        {description && (
          <p className="mt-1 text-xs leading-5 text-slate-600">{description}</p>
        )}
      </header>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

export function PropertyVisitForm({
  property,
  cycle,
}: {
  property: SectorPropertyMock;
  cycle: string;
}) {
  const existingVisit =
    property.ultimaVisita &&
    visitMatchesCycle(property.ultimaVisita.dataAtividade, cycle)
      ? property.ultimaVisita
      : null;
  const existingForm = existingVisit?.formulario;
  const inspectedDeposits = existingForm
    ? Object.values(existingForm.depositos).reduce(
        (total, value) => total + value,
        0,
      )
    : 0;
  const [message, setMessage] = useState("");
  const [liInspected, setLiInspected] = useState(() => {
    if (typeof window === "undefined") return true;
    const raw = sessionStorage.getItem(`vigia:visita:${property.id}:${cycle}`);
    if (!raw) return existingForm?.imovelInspecionado ?? true;
    try {
      const saved = JSON.parse(raw);
      if (saved.versaoFormulario !== "2")
        return existingForm?.imovelInspecionado ?? true;
      return saved.imovelInspecionado !== "N";
    } catch {
      return true;
    }
  });
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(`vigia:visita:${property.id}:${cycle}`);
    if (!raw || !formRef.current) return;
    try {
      const saved = JSON.parse(raw) as Record<string, string>;
      if (saved.versaoFormulario !== "2") {
        sessionStorage.removeItem(`vigia:visita:${property.id}:${cycle}`);
        return;
      }
      for (const [name, value] of Object.entries(saved)) {
        const field = formRef.current.elements.namedItem(name);
        if (
          field instanceof HTMLInputElement ||
          field instanceof HTMLSelectElement ||
          field instanceof HTMLTextAreaElement
        )
          field.value = value;
      }
    } catch {
      sessionStorage.removeItem(`vigia:visita:${property.id}:${cycle}`);
    }
  }, [cycle, property.id]);

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const dateBr = String(formData.get("dataAtividadeBr") ?? "");
    const dateIso = dateBrToIso(dateBr);
    if (!dateIso) {
      setMessage("Informe a data no formato dd/mm/aaaa.");
      return;
    }
    formData.set("dataAtividade", dateIso);
    formData.set("versaoFormulario", "2");
    const data = Object.fromEntries(formData);
    sessionStorage.setItem(
      `vigia:visita:${property.id}:${cycle}`,
      JSON.stringify(data),
    );
    setMessage(
      "Ficha registrada nesta demonstração e mantida nesta sessão do navegador.",
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/visitas"
            className="text-sm font-semibold text-emerald-800 hover:underline"
          >
            ← Voltar aos imóveis
          </Link>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-emerald-800">
            {property.codigoLocal} · Ciclo {cycle}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950">
            {property.logradouro}, {property.numero}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {propertyTypeLabels[property.tipo]} · Quarteirão{" "}
            {property.quarteirao} · {property.setor} ·{" "}
            {property.complemento || "Sem complemento"}
          </p>
        </div>
        <span className="border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
          {existingVisit
            ? `${inspectedDeposits} depósitos inspecionados nesta visita`
            : "Nova ficha de campo"}
        </span>
      </div>
      <form ref={formRef} onSubmit={save} className="space-y-4">
        <Section
          title="Atividade e situação da visita"
          description="Identifique a atividade executada e o resultado do acesso ao imóvel."
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs font-semibold text-slate-700">
              Atividade
              <select
                name="atividade"
                className={fieldClass}
                defaultValue={existingForm?.atividade ?? "LI_T"}
              >
                <option value="LI">LI — Levantamento de índice</option>
                <option value="LI_T">LI + tratamento</option>
                <option value="PE">Ponto estratégico</option>
                <option value="T">Tratamento</option>
                <option value="DF">Delimitação de foco</option>
                <option value="PVE">Pesquisa vetorial especial</option>
              </select>
            </label>
            <Field
              label="Data da atividade (dd/mm/aaaa)"
              name="dataAtividadeBr"
              defaultValue={formatDateBr(
                existingVisit?.dataAtividade ?? todayInRecifeIso(),
              )}
            />
            <Field
              label="Hora de entrada"
              name="horaEntrada"
              type="time"
              defaultValue={existingForm?.horaEntrada}
            />
            <label className="text-xs font-semibold text-slate-700">
              Acesso ao imóvel
              <select
                name="acesso"
                className={fieldClass}
                defaultValue={existingVisit?.acesso ?? "REALIZADO"}
              >
                <option value="REALIZADO">Visita realizada</option>
                <option value="RECUSA">Recusa</option>
                <option value="FECHADO">Ninguém em casa / fechado</option>
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-700">
              Tipo da visita
              <select
                name="tipoVisita"
                className={fieldClass}
                defaultValue={existingForm?.tipoVisita ?? "N"}
              >
                <option value="N">N — Normal</option>
                <option value="R">R — Recuperação</option>
              </select>
            </label>
            <Field
              label="Supervisor"
              name="supervisor"
              defaultValue={existingForm?.supervisor}
            />
          </div>
        </Section>
        <Section title="Identificação do imóvel">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Field
              label="Nº do quarteirão"
              name="quarteirao"
              type="number"
              defaultValue={property.quarteirao}
            />
            <Field
              label="Sequência do quarteirão"
              name="sequenciaQuarteirao"
              type="number"
              defaultValue={property.sequenciaPercurso}
            />
            <Field label="Lado" name="lado" defaultValue={property.lado} />
            <Field
              label="Nome do logradouro"
              name="logradouro"
              defaultValue={property.logradouro}
            />
            <Field
              label="Número"
              name="numero"
              defaultValue={property.numero}
            />
            <Field
              label="Sequência do número"
              name="sequenciaNumero"
              type="number"
              defaultValue={existingForm?.sequenciaNumero}
            />
            <Field
              label="Complemento"
              name="complemento"
              defaultValue={property.complemento}
            />
          </div>
        </Section>
        <Section
          title="Depósitos inspecionados"
          description="Informe a quantidade encontrada em cada categoria e marque se o imóvel integrou o levantamento de índice."
        >
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
            {["A1", "A2", "B", "C", "D1", "D2", "E"].map((type) => (
              <label
                key={type}
                className="flex flex-col text-center text-xs font-semibold text-slate-700"
              >
                <span className="flex h-4 items-center justify-center">
                  {type}
                </span>
                <input
                  name={`deposito_${type}`}
                  type="number"
                  min="0"
                  defaultValue={
                    existingForm?.depositos[
                      type as keyof typeof existingForm.depositos
                    ] ?? 0
                  }
                  className={smallFieldClass}
                />
              </label>
            ))}
            <div className="flex flex-col text-xs font-semibold text-slate-700">
              <span className="flex h-4 items-center justify-center text-center">
                Imóvel LI
              </span>
              <input
                type="hidden"
                name="imovelInspecionado"
                value={liInspected ? "S" : "N"}
              />
              <div className="mt-1 flex h-10 border border-slate-300 bg-white p-1">
                <button
                  type="button"
                  aria-pressed={liInspected}
                  onClick={() => setLiInspected(true)}
                  className={`flex-1 px-2 text-sm font-semibold ${liInspected ? "bg-emerald-800 text-white" : "text-slate-700 hover:bg-slate-100"}`}
                >
                  Sim
                </button>
                <button
                  type="button"
                  aria-pressed={!liInspected}
                  onClick={() => setLiInspected(false)}
                  className={`flex-1 px-2 text-sm font-semibold ${!liInspected ? "bg-emerald-800 text-white" : "text-slate-700 hover:bg-slate-100"}`}
                >
                  Não
                </button>
              </div>
            </div>
          </div>
        </Section>
        <Section title="Coleta de amostra">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field
              label="Nº da amostra inicial"
              name="amostraInicial"
              type="number"
              defaultValue={existingForm?.amostraInicial}
            />
            <Field
              label="Nº da amostra final"
              name="amostraFinal"
              type="number"
              defaultValue={existingForm?.amostraFinal}
            />
            <Field
              label="Quantidade de tubitos"
              name="quantidadeTubitos"
              type="number"
              defaultValue={existingForm?.quantidadeTubitos}
            />
          </div>
        </Section>
        <Section title="Tratamentos realizados">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field
              label="Depósitos eliminados"
              name="depositosEliminados"
              type="number"
              defaultValue={existingForm?.depositosEliminados}
            />
            <label className="text-xs font-semibold text-slate-700">
              Imóvel tratado
              <select
                name="imovelTratado"
                className={fieldClass}
                defaultValue={existingForm?.imovelTratado ? "S" : "N"}
              >
                <option value="N">Não</option>
                <option value="S">Sim</option>
              </select>
            </label>
            <Field
              label="Larvicida 1 — tipo"
              name="larvicida1Tipo"
              defaultValue={existingForm?.larvicida1Tipo}
            />
            <Field
              label="Larvicida 1 — quantidade (g)"
              name="larvicida1Quantidade"
              type="number"
              defaultValue={existingForm?.larvicida1Quantidade}
            />
            <Field
              label="Larvicida 1 — depósitos tratados"
              name="larvicida1Depositos"
              type="number"
              defaultValue={existingForm?.larvicida1Depositos}
            />
            <Field
              label="Larvicida 2 — tipo"
              name="larvicida2Tipo"
              defaultValue={existingForm?.larvicida2Tipo}
            />
            <Field
              label="Larvicida 2 — quantidade (g)"
              name="larvicida2Quantidade"
              type="number"
              defaultValue={existingForm?.larvicida2Quantidade}
            />
            <Field
              label="Larvicida 2 — depósitos tratados"
              name="larvicida2Depositos"
              type="number"
              defaultValue={existingForm?.larvicida2Depositos}
            />
            <Field
              label="Perifocal — tipo"
              name="perifocalTipo"
              defaultValue={existingForm?.perifocalTipo}
            />
            <Field
              label="Perifocal — quantidade de cargas"
              name="perifocalCargas"
              type="number"
              defaultValue={existingForm?.perifocalCargas}
            />
          </div>
        </Section>
        <Section title="Observações">
          <label className="text-xs font-semibold text-slate-700">
            Anotações da visita
            <textarea
              name="observacoes"
              rows={4}
              defaultValue={existingForm?.observacoes}
              className="mt-1 w-full border border-slate-300 bg-white p-3 text-sm outline-none focus:border-emerald-700"
            />
          </label>
        </Section>
        <div className="flex flex-col items-center justify-center gap-3 border border-slate-200 bg-white p-4 text-center shadow-sm">
          <p role="status" className="text-sm font-semibold text-emerald-800">
            {message}
          </p>
          <button
            type="submit"
            className="min-h-11 bg-emerald-800 px-5 text-sm font-semibold text-white hover:bg-emerald-900"
          >
            Salvar ficha da visita
          </button>
        </div>
      </form>
    </div>
  );
}
