"use client";
import { useMemo, useState } from "react";
import {
  MetricCard,
  PageHeading,
  Panel,
} from "@/components/plataforma/dashboard-ui";
import {
  type TerritoryReviewItem,
  type TerritoryReviewStatus,
} from "@/lib/gestao/operations-data";

export interface TerritoryReviewAce {
  id: string;
  name: string;
  lastSync?: string;
}

export interface TerritoryReviewBlock {
  id: string;
  number: number;
  neighborhood: string;
  territoryId: string;
  zone: string;
  properties: number;
}

const labels: Record<TerritoryReviewStatus, string> = {
  VALIDADO: "Validado",
  DIVERGENCIA: "Divergência",
  CONFERIR: "Conferir",
};
export function TerritoryReview({
  initialItems,
  aces,
  blocks,
  initialAssignments,
}: {
  initialItems: TerritoryReviewItem[];
  aces: TerritoryReviewAce[];
  blocks: TerritoryReviewBlock[];
  initialAssignments: Record<string, string>;
}) {
  const [items, setItems] = useState(initialItems);
  const [search, setSearch] = useState("");
  const [assignments, setAssignments] =
    useState<Record<string, string>>(initialAssignments);
  const [blockSearch, setBlockSearch] = useState("");
  const [savingBlockId, setSavingBlockId] = useState<string | null>(null);
  const [syncLabels, setSyncLabels] = useState<Record<string, string>>({});
  const filteredBlocks = blocks.filter((block) =>
    `${block.number} ${block.neighborhood}`
      .toLocaleLowerCase("pt-BR")
      .includes(blockSearch.toLocaleLowerCase("pt-BR")),
  );
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
      <Panel
        className="mt-5"
        title="Atribuição de quarteirões aos ACEs"
        description="Distribua cada quarteirão do ciclo entre os agentes responsáveis. O mesmo bairro pode ter mais de um ACE; a unidade de atribuição é o quarteirão. A cobertura exibida é demonstrativa."
      >
        <input
          value={blockSearch}
          onChange={(event) => setBlockSearch(event.target.value)}
          placeholder="Buscar número do quarteirão ou bairro"
          className="mb-4 min-h-10 w-full border border-slate-300 px-3 text-sm outline-none focus:border-emerald-700"
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="p-3">Quarteirão</th>
                <th className="p-3">Bairro</th>
                <th className="p-3">Zona</th>
                <th className="p-3">Imóveis previstos</th>
                <th className="p-3">ACE responsável</th>
                <th className="p-3">Cobertura</th>
              </tr>
            </thead>
            <tbody>
              {filteredBlocks.map((block, index) => {
                const aceId = assignments[block.id] ?? "";
                const assignedAce = aces.find((ace) => ace.id === aceId);
                const isSaving = savingBlockId === block.id;
                const assigned = block.properties;
                const visited = Math.round(
                  assigned * (0.55 + (index % 4) * 0.08),
                );
                const coverage = Math.round((visited / assigned) * 100);
                return (
                  <tr key={block.id} className="border-b border-slate-100">
                    <td className="p-3 font-semibold text-slate-900">
                      Quarteirão {block.number}
                    </td>
                    <td className="p-3 text-slate-600">{block.neighborhood}</td>
                    <td className="p-3 text-slate-600">{block.zone}</td>
                    <td className="p-3 text-slate-600">{assigned}</td>
                    <td className="p-3">
                      <select
                        value={aceId}
                        aria-label={`Selecionar ACE do quarteirão ${block.number}`}
                        disabled={isSaving}
                        onChange={(event) => {
                          const nextAceId = event.target.value;
                          setAssignments((current) => ({
                            ...current,
                            [block.id]: nextAceId,
                          }));
                          setSavingBlockId(block.id);
                          setSyncLabels((current) => ({
                            ...current,
                            [block.id]: "Salvando atribuição…",
                          }));
                          window.setTimeout(() => {
                            setSavingBlockId((current) =>
                              current === block.id ? null : current,
                            );
                            setSyncLabels((current) => ({
                              ...current,
                              [block.id]: "Sincronizado agora",
                            }));
                          }, 900);
                        }}
                        className={`min-h-10 min-w-56 cursor-pointer border border-emerald-700 bg-white px-2 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-200 disabled:cursor-wait disabled:opacity-70`}
                      >
                        <option value="">Sem atribuição</option>
                        {aces.map((ace) => (
                          <option key={ace.id} value={ace.id}>
                            {ace.name}
                          </option>
                        ))}
                      </select>
                      <span
                        aria-live="polite"
                        className={`mt-1 block text-[11px] text-slate-500 ${isSaving ? "animate-pulse text-emerald-700" : ""}`}
                      >
                        {syncLabels[block.id] ??
                          (assignedAce?.lastSync
                            ? `Sincronizado ${assignedAce.lastSync}`
                            : "Sem sincronização")}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className={`h-full ${coverage >= 80 ? "bg-emerald-700" : "bg-amber-500"}`}
                            style={{ width: `${coverage}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold">{coverage}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-4 border-l-4 border-blue-600 bg-blue-50 p-3 text-xs leading-5 text-blue-900">
          Ao alterar o ACE responsável, a área atribuída será refletida no
          painel de cobertura individual e na lista de imóveis do agente quando
          houver persistência real.
        </p>
      </Panel>
    </div>
  );
}
