"use client";
import { useState } from "react";
import {
  MetricCard,
  PageHeading,
  Panel,
} from "@/components/plataforma/dashboard-ui";
type SanitationStatus = "ABERTO" | "EM_TRATATIVA" | "RESOLVIDO";
const labels: Record<SanitationStatus, string> = {
  ABERTO: "Aberto",
  EM_TRATATIVA: "Em tratativa",
  RESOLVIDO: "Resolvido",
};
export function SanitationWorkspace({
  apiData: _apiData,
}: {
  apiData?: unknown;
}) {
  const apiPoints = Array.isArray(_apiData) ? _apiData : [];
  const [points, setPoints] = useState(
    apiPoints.length
      ? apiPoints.map((item, index) => {
          const row = item as Record<string, unknown>;
          return {
            id: String(row.id ?? `api-${index}`),
            type: String(row.type ?? row.tipo ?? "Ocorrência ambiental"),
            address: String(
              row.address ?? row.endereco ?? "Endereço não informado",
            ),
            neighborhood: String(row.neighborhood ?? row.bairro ?? ""),
            responsible: String(
              row.responsible ?? row.responsavel ?? "Não definido",
            ),
            deadline: String(row.deadline ?? row.prazo ?? "2026-12-31"),
            status: (row.status ?? "ABERTO") as SanitationStatus,
            notes: String(row.notes ?? row.observacoes ?? ""),
          };
        })
      : [],
  );
  const update = (id: string, status: SanitationStatus) =>
    setPoints((current) =>
      current.map((point) => (point.id === id ? { ...point, status } : point)),
    );
  return (
    <div>
      <PageHeading
        eyebrow="Vigilância ambiental"
        title="Depósitos públicos e saneamento"
        description="Registre riscos ambientais, responsáveis e prazos para acompanhar a resolução junto aos setores municipais."
      />
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Ocorrências"
          value={String(points.length)}
          detail="Pontos registrados"
        />
        <MetricCard
          label="Em tratativa"
          value={String(
            points.filter((point) => point.status === "EM_TRATATIVA").length,
          )}
          detail="Com responsável definido"
        />
        <MetricCard
          label="Resolvidas"
          value={String(
            points.filter((point) => point.status === "RESOLVIDO").length,
          )}
          detail="Com retorno registrado"
        />
      </div>
      <Panel
        title="Pontos e problemas ambientais"
        description="Cada ocorrência possui território, responsável, prazo e histórico resumido."
      >
        <div className="space-y-3">
          {points.map((point) => (
            <article key={point.id} className="border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-950">{point.type}</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {point.address} · {point.neighborhood}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-bold ${point.status === "RESOLVIDO" ? "bg-emerald-100 text-emerald-900" : point.status === "EM_TRATATIVA" ? "bg-amber-100 text-amber-900" : "bg-red-100 text-red-900"}`}
                >
                  {labels[point.status]}
                </span>
              </div>
              <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
                <span>
                  Responsável: <b>{point.responsible}</b>
                </span>
                <span>
                  Prazo:{" "}
                  <b>
                    {new Date(`${point.deadline}T12:00:00`).toLocaleDateString(
                      "pt-BR",
                    )}
                  </b>
                </span>
                <span>Histórico: {point.notes}</span>
              </div>
              <select
                value={point.status}
                onChange={(event) =>
                  update(point.id, event.target.value as SanitationStatus)
                }
                className="mt-3 min-h-9 border border-slate-300 px-3 text-xs font-semibold"
              >
                <option value="ABERTO">Aberto</option>
                <option value="EM_TRATATIVA">Em tratativa</option>
                <option value="RESOLVIDO">Resolvido</option>
              </select>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
}
