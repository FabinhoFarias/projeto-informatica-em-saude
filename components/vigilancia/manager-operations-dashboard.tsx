"use client";

import { useMemo, useState } from "react";
import {
  MetricCard,
  PageHeading,
  Panel,
} from "@/components/plataforma/dashboard-ui";
import { municipality, neighborhoods } from "@/lib/territorios/demo-data";
import { municipalClientsDemo } from "@/lib/administracao/demo-data";
import { sectorPropertiesDemo } from "@/lib/visitas/demo-data";

function getCoverageRows() {
  return neighborhoods.map((neighborhood, index) => {
    const properties = Math.max(18, 28 + ((index * 13) % 64));
    const coverage = Math.min(100, 42 + ((index * 11) % 54));
    const visited = Math.round((properties * coverage) / 100);
    return {
      ...neighborhood,
      properties,
      coverage,
      visited,
      pending: properties - visited,
      sectors: 1 + (index % 4),
    };
  });
}

export function ManagerOperationsDashboard() {
  const institutionPrimary =
    municipalClientsDemo.find((client) => client.id === "lagoa-de-itaenga")
      ?.branding.primaryColor ?? "#006b4f";
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"BAIRROS" | "SETORES">("BAIRROS");
  const rows = useMemo(() => getCoverageRows(), []);
  const filtered = rows.filter((row) =>
    row.name
      .toLocaleLowerCase("pt-BR")
      .includes(search.toLocaleLowerCase("pt-BR")),
  );
  const properties = rows.reduce((sum, row) => sum + row.properties, 0);
  const visited = rows.reduce((sum, row) => sum + row.visited, 0);
  const sectors = rows.reduce((sum, row) => sum + row.sectors, 0);
  const coverage = Math.round((visited / properties) * 100);
  const completed = rows.filter((row) => row.coverage >= 80).length;

  return (
    <div>
      <PageHeading
        eyebrow={`${municipality.prefeitura} · Operação de endemias`}
        title="Cobertura de visitas"
        description="Acompanhe o avanço das visitas por bairro e setor, identifique pendências e organize a recuperação dos imóveis."
      />
      <section
        aria-label="Indicadores de cobertura"
        className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <MetricCard
          label="Cobertura municipal"
          value={`${coverage}%`}
          detail="Imóveis visitados no ciclo atual"
          trend="Meta: 80%"
        />
        <MetricCard
          label="Bairros concluídos"
          value={`${completed}/${rows.length}`}
          detail="Com pelo menos 80% de cobertura"
        />
        <MetricCard
          label="Setores acompanhados"
          value={String(sectors)}
          detail="Setores de campo no ciclo"
        />
        <MetricCard
          label="Imóveis pendentes"
          value={String(properties - visited)}
          detail="Visitas ou retornos necessários"
        />
      </section>
      <Panel
        title="Cobertura territorial"
        description="A leitura operacional usa registros de visitas, sem projeção de casos ou probabilidade de surto."
      >
        <div className="mb-5 grid gap-3 border border-slate-200 bg-slate-50 p-4 md:grid-cols-[1fr_auto]">
          <label className="text-xs font-semibold text-slate-700">
            Buscar bairro ou setor
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Digite o nome do território"
              className="mt-1 min-h-10 w-full border border-slate-300 bg-white px-3 text-sm font-normal outline-none focus:border-emerald-700"
            />
          </label>
          <div className="flex items-end border border-slate-300 bg-white p-1">
            {(["BAIRROS", "SETORES"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setMode(item)}
                style={
                  mode === item
                    ? { backgroundColor: institutionPrimary }
                    : undefined
                }
                className={`min-h-9 px-4 text-xs font-semibold ${mode === item ? "text-white hover:brightness-90" : "text-slate-600 hover:bg-slate-100"}`}
              >
                {item === "BAIRROS" ? "Bairros" : "Setores"}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-3">
                  {mode === "BAIRROS" ? "Bairro" : "Setor"}
                </th>
                <th className="px-3 py-3">Área</th>
                <th className="px-3 py-3 text-right">Setores</th>
                <th className="px-3 py-3 text-right">Imóveis</th>
                <th className="px-3 py-3">Cobertura</th>
                <th className="px-3 py-3 text-right">Pendentes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="px-3 py-3 font-semibold text-slate-900">
                    {mode === "BAIRROS" ? row.name : `Setores de ${row.name}`}
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    {row.district.replace("Área ", "")}
                  </td>
                  <td className="px-3 py-3 text-right text-slate-600">
                    {row.sectors}
                  </td>
                  <td className="px-3 py-3 text-right text-slate-600">
                    {row.visited}/{row.properties}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-2 min-w-28 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className={`h-full ${row.coverage >= 80 ? "bg-emerald-700" : row.coverage >= 60 ? "bg-amber-500" : "bg-red-500"}`}
                          style={{ width: `${row.coverage}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-700">
                        {row.coverage}%
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-slate-700">
                    {row.pending}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel
          title="Próximas ações"
          description="Atividades administrativas derivadas da cobertura do ciclo"
        >
          <ul className="space-y-3 text-sm text-slate-700">
            <li className="border-l-4 border-red-500 bg-red-50 p-3">
              Programar recuperação para imóveis pendentes nos territórios
              abaixo de 60%.
            </li>
            <li className="border-l-4 border-amber-500 bg-amber-50 p-3">
              Revisar setores com muitos imóveis ainda não visitados.
            </li>
            <li className="border-l-4 border-emerald-600 bg-emerald-50 p-3">
              Conferir e fechar bairros que atingiram a meta operacional.
            </li>
          </ul>
        </Panel>
        <Panel
          title="Origem dos indicadores"
          description="Cobertura baseada no fluxo mockado da vigilância ambiental"
        >
          <p className="text-sm leading-6 text-slate-600">
            Os números representam visitas e imóveis cadastrados no ciclo. A
            integração futura poderá substituir os mocks por dados do
            aplicativo, relatórios de campo e sincronização dos ACEs.
          </p>
          <p className="mt-4 text-xs text-slate-500">
            Imóveis de referência no protótipo: {sectorPropertiesDemo.length}
          </p>
        </Panel>
      </div>
    </div>
  );
}
