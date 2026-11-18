"use client";
import { useState } from "react";
import {
  MetricCard,
  PageHeading,
  Panel,
} from "@/components/plataforma/dashboard-ui";
import { stockDemo } from "@/lib/gestao/operations-data";
export function InventoryWorkspace() {
  const [items, setItems] = useState(stockDemo);
  const low = items.filter((item) => item.balance < item.minimum).length;
  return (
    <div>
      <PageHeading
        eyebrow="Gestão de insumos"
        title="Estoque de campo"
        description="Acompanhe saldo, consumo e alertas dos materiais utilizados nas visitas de endemias."
      />
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Itens cadastrados"
          value={String(items.length)}
          detail="Catálogo municipal"
        />
        <MetricCard
          label="Alertas de estoque"
          value={String(low)}
          detail="Abaixo do mínimo configurado"
        />
        <MetricCard
          label="Consumo no ciclo"
          value={String(items.reduce((sum, item) => sum + item.consumed, 0))}
          detail="Unidades acumuladas"
        />
      </div>
      <Panel
        title="Saldo e consumo"
        description="Ajuste o saldo para simular entrada de material ou conferência física."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="p-3">Produto</th>
                <th className="p-3">Unidade</th>
                <th className="p-3 text-right">Saldo</th>
                <th className="p-3 text-right">Mínimo</th>
                <th className="p-3 text-right">Consumo</th>
                <th className="p-3">Situação</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="p-3 font-semibold">{item.name}</td>
                  <td className="p-3 text-slate-600">{item.unit}</td>
                  <td className="p-3 text-right">
                    <input
                      aria-label={`Saldo de ${item.name}`}
                      type="number"
                      min="0"
                      value={item.balance}
                      onChange={(event) =>
                        setItems((current) =>
                          current.map((row) =>
                            row.id === item.id
                              ? { ...row, balance: Number(event.target.value) }
                              : row,
                          ),
                        )
                      }
                      className="w-24 border border-slate-300 px-2 py-2 text-right"
                    />
                  </td>
                  <td className="p-3 text-right">{item.minimum}</td>
                  <td className="p-3 text-right">{item.consumed}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 text-xs font-bold ${item.balance < item.minimum ? "bg-red-100 text-red-900" : "bg-emerald-100 text-emerald-900"}`}
                    >
                      {item.balance < item.minimum ? "Repor" : "Regular"}
                    </span>
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
