"use client";

import { useRouter, useSearchParams } from "next/navigation";

type Visit = {
  id: string;
  imovelId?: string;
  acesso?: string;
  createdAt?: string;
};

export function AceVisitHistory({
  visits,
  cycles,
}: {
  visits: Visit[];
  cycles: Array<{ id: string; nome: string }>;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/visitas/historico?${next.toString()}`);
  };
  return (
    <section className="border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-bold text-slate-950">
        Meu histórico de visitas
      </h2>
      <p className="mb-4 text-sm text-slate-600">
        Consulte seus registros por data, semana ou ciclo.
      </p>
      <div className="grid gap-3 md:grid-cols-3">
        <label className="text-sm font-semibold text-slate-700">
          Data
          <input
            type="date"
            defaultValue={params.get("data") ?? ""}
            onChange={(event) => update("data", event.target.value)}
            className="mt-1 block w-full border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          Semana
          <input
            type="week"
            defaultValue={params.get("semana") ?? ""}
            onChange={(event) => update("semana", event.target.value)}
            className="mt-1 block w-full border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          Ciclo
          <select
            defaultValue={params.get("cicloId") ?? ""}
            onChange={(event) => update("cicloId", event.target.value)}
            className="mt-1 block w-full border border-slate-300 px-3 py-2"
          >
            <option value="">Todos os ciclos</option>
            {cycles.map((cycle) => (
              <option key={cycle.id} value={cycle.id}>
                {cycle.nome}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <th className="px-3 py-2">Data</th>
              <th className="px-3 py-2">Imóvel</th>
              <th className="px-3 py-2">Resultado</th>
            </tr>
          </thead>
          <tbody>
            {visits.map((visit) => (
              <tr key={visit.id} className="border-b border-slate-100">
                <td className="px-3 py-3">
                  {String(visit.createdAt ?? "").slice(0, 10)}
                </td>
                <td className="px-3 py-3">{visit.imovelId ?? "—"}</td>
                <td className="px-3 py-3">{visit.acesso ?? "REALIZADO"}</td>
              </tr>
            ))}
            {visits.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="px-3 py-8 text-center text-slate-500"
                >
                  Nenhum registro encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
