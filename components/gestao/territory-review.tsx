"use client";
import { useMemo, useState } from "react";
import {
  MetricCard,
  PageHeading,
  Panel,
} from "@/components/plataforma/dashboard-ui";
import {
  territoryReviewDemo,
  type TerritoryReviewStatus,
} from "@/lib/gestao/operations-data";

const labels: Record<TerritoryReviewStatus, string> = {
  VALIDADO: "Validado",
  DIVERGENCIA: "Divergência",
  CONFERIR: "Conferir",
};
export function TerritoryReview() {
  const [items, setItems] = useState(territoryReviewDemo);
  const [search, setSearch] = useState("");
  const filtered = useMemo(
    () =>
      items.filter((item) =>
        `${item.street} ${item.neighborhood} ${item.sector}`
          .toLocaleLowerCase("pt-BR")
          .includes(search.toLocaleLowerCase("pt-BR")),
      ),
    [items, search],
  );
  const update = (id: string, status: TerritoryReviewStatus) =>
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, status } : item)),
    );
  return (
    <div>
      <PageHeading
        eyebrow="Gestão territorial"
        title="Conferência de endereços"
        description="Revise divergências entre o cadastro territorial e as fichas de campo antes de consolidar a produção."
      />
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Registros analisados"
          value={String(items.length)}
          detail="Imóveis no recorte demonstrativo"
        />
        <MetricCard
          label="Divergências"
          value={String(
            items.filter((item) => item.status === "DIVERGENCIA").length,
          )}
          detail="Exigem revisão do cadastro"
        />
        <MetricCard
          label="Para conferir"
          value={String(
            items.filter((item) => item.status === "CONFERIR").length,
          )}
          detail="Sem validação definitiva"
        />
      </div>
      <Panel
        title="Cadastro territorial e divergências"
        description="Marque o endereço como validado ou mantenha-o na fila de conferência."
      >
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar rua, bairro ou setor"
          className="mb-4 min-h-10 w-full border border-slate-300 px-3 text-sm outline-none focus:border-emerald-700"
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="p-3">Endereço</th>
                <th className="p-3">Bairro</th>
                <th className="p-3">Setor</th>
                <th className="p-3">Quarteirão</th>
                <th className="p-3">Situação</th>
                <th className="p-3">Ação</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="p-3 font-semibold">
                    {item.street}, {item.number}
                    <span className="block text-xs font-normal text-slate-500">
                      {item.issue || "Cadastro compatível"}
                    </span>
                  </td>
                  <td className="p-3">{item.neighborhood}</td>
                  <td className="p-3">{item.sector}</td>
                  <td className="p-3">{item.block}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 text-xs font-bold ${item.status === "VALIDADO" ? "bg-emerald-100 text-emerald-900" : item.status === "DIVERGENCIA" ? "bg-red-100 text-red-900" : "bg-amber-100 text-amber-900"}`}
                    >
                      {labels[item.status]}
                    </span>
                  </td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() =>
                        update(
                          item.id,
                          item.status === "VALIDADO" ? "CONFERIR" : "VALIDADO",
                        )
                      }
                      className="border border-slate-300 px-3 py-2 text-xs font-semibold hover:bg-slate-100"
                    >
                      {item.status === "VALIDADO"
                        ? "Reabrir"
                        : "Validar cadastro"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
