"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  MetricCard,
  PageHeading,
  Panel,
} from "@/components/plataforma/dashboard-ui";
// O componente recebe todos os dados pela API através de ManagerDashboardData.

function coverageColor(coverage: number) {
  if (coverage >= 80) return "#047857";
  if (coverage >= 60) return "#f59e0b";
  return "#ef4444";
}

export interface ManagerDashboardData {
  coverage: {
    atribuidos: number;
    visitados: number;
    pendentes: number;
    percentual: number;
  };
  territories: Array<{
    id: string;
    name: string;
    district?: string;
    cobertura?: number;
    status?: string;
    coverage?: number;
    properties?: number;
    visited?: number;
  }>;
  aces: Array<{
    id: string;
    nome: string;
    status?: string;
    cobertura?: number;
    assigned?: number;
    visited?: number;
    pending?: number;
    avatarUrl?: string;
    lastSync?: string;
  }>;
  blocks: Array<{
    id: string;
    numero: number;
    bairro: string;
    aceId?: string | null;
  }>;
  propertiesTotal: number;
  municipality: { name: string; state: string; prefeitura: string };
  neighborhoods: Array<{
    id: string;
    name: string;
    district: string;
    population: number;
    suspectedCases: number;
    forecastCases: number;
    ratePer100k: number;
    incidenceProbability: number;
    risk: "Baixo" | "Médio" | "Alto" | "Crítico";
    vectorFoci: number;
    apsCases: number;
    apsStatus: string;
  }>;
  properties: Array<{
    id: string;
    neighborhood: string;
    quarteirao?: number | string;
    lastVisitStatus?: string;
  }>;
  dailyReport: {
    dates: string[];
    latest?: { visitas?: number; retornos?: number; amostras?: number };
  };
  fieldSummary: { received: number; pending: number; assigned: number };
  statusCounts: {
    realizado: number;
    recusa: number;
    fechado: number;
    semVisita: number;
    retornos: number;
  };
  cycleId: string;
  cycles: Array<{ id: string; nome: string; status: string }>;
  aceHistories: Record<string, Record<string, unknown>>;
}

export function ManagerOperationsDashboard({
  apiData,
}: {
  apiData: ManagerDashboardData;
}) {
  const institutionPrimary = "#006b4f";
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"BAIRROS" | "SETORES" | "QUARTEIROES">(
    "BAIRROS",
  );
  const [selectedAceId, setSelectedAceId] = useState<string | null>(null);
  const rows = useMemo(() => {
    return apiData.territories.map((territory) => {
      const coverage = territory.cobertura ?? territory.coverage ?? 0;
      const properties = territory.properties ?? 0;
      const visited = territory.visited ?? 0;
      return {
        ...territory,
        name: territory.name,
        properties,
        coverage,
        visited,
        pending: properties - visited,
        sectors: apiData.blocks.filter(
          (block) => block.bairro === territory.name && Boolean(block.aceId),
        ).length,
      };
    });
  }, [apiData]);
  const aceRows = useMemo(() => {
    return apiData.aces.map((user) => ({
      id: user.id,
      name: user.nome,
      role: "AGENTE_CAMPO",
      territory: apiData.municipality.name,
      status: user.status ?? "ATIVO",
      lastSync: "via API",
      avatarUrl:
        user.avatarUrl ?? "/brandingPrefeioturaLagoaDeItaenga/logoQuadrada.png",
      assigned: user.assigned ?? 0,
      coverage: user.cobertura ?? 0,
      visited: user.visited ?? 0,
      pending: user.pending ?? 0,
    }));
  }, [apiData]);
  const filtered = rows.filter((row) =>
    String(row.name ?? "")
      .toLocaleLowerCase("pt-BR")
      .includes(search.toLocaleLowerCase("pt-BR")),
  );
  const blockRows = useMemo(
    () =>
      apiData.blocks.map((block) => {
        const properties = apiData.properties.filter(
          (property) => Number(property.quarteirao) === block.numero,
        ).length;
        const visited = apiData.properties.filter(
          (property) =>
            Number(property.quarteirao) === block.numero &&
            property.lastVisitStatus,
        ).length;
        const coverage = properties
          ? Math.round((visited / properties) * 100)
          : 0;
        return {
          number: block.numero,
          properties,
          coverage,
          visited,
        };
      }),
    [apiData],
  );
  const filteredBlocks = blockRows.filter((block) =>
    String(block.number).includes(search.trim()),
  );
  const properties = rows.reduce((sum, row) => sum + row.properties, 0);
  const visited = rows.reduce((sum, row) => sum + row.visited, 0);
  const sectors = rows.reduce((sum, row) => sum + row.sectors, 0);
  const coverage = properties ? Math.round((visited / properties) * 100) : 0;
  const completed = rows.filter((row) => row.coverage >= 80).length;
  const selectedAce = aceRows.find((ace) => ace.id === selectedAceId);
  const selectedHistory = selectedAce
    ? apiData.aceHistories[selectedAce.id]
    : undefined;
  const historyVisits = Array.isArray(selectedHistory?.visitas)
    ? selectedHistory.visitas
    : [];
  const historyReturns = Array.isArray(selectedHistory?.retornos)
    ? selectedHistory.retornos
    : [];

  return (
    <div>
      <PageHeading
        eyebrow={`${apiData.municipality.prefeitura} · Operação de endemias`}
        title="Cobertura de visitas"
        description="Acompanhe o avanço das visitas por bairro e setor, identifique pendências e organize a recuperação dos imóveis."
      />
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border border-slate-200 bg-white p-4">
        <label className="text-xs font-semibold text-slate-700">
          Ciclo operacional
          <select
            value={apiData.cycleId}
            onChange={(event) => {
              window.location.href = `/painel?cicloId=${encodeURIComponent(event.target.value)}`;
            }}
            className="mt-1 block min-h-10 min-w-64 border border-slate-300 bg-white px-3 text-sm font-normal"
          >
            {apiData.cycles.map((cycle) => (
              <option key={cycle.id} value={cycle.id}>
                {cycle.nome} · {cycle.status}
              </option>
            ))}
          </select>
        </label>
        <p className="text-xs text-slate-500">
          Indicadores calculados somente para o ciclo selecionado.
        </p>
      </div>
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
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          [
            "Visitas realizadas",
            apiData.statusCounts.realizado,
            "text-emerald-800",
          ],
          ["Recusas", apiData.statusCounts.recusa, "text-orange-700"],
          ["Imóveis fechados", apiData.statusCounts.fechado, "text-amber-700"],
          ["Sem visita", apiData.statusCounts.semVisita, "text-red-700"],
          ["Retornos", apiData.statusCounts.retornos, "text-blue-700"],
        ].map(([label, value, color]) => (
          <div
            key={String(label)}
            className="border border-slate-200 bg-white px-4 py-3"
          >
            <p className="text-xs text-slate-500">{label}</p>
            <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>
      <Panel
        title="Acompanhamento dos ACEs"
        description="Usuários de campo vinculados à gestão e cobertura das áreas atribuídas no ciclo atual."
        className="mb-5"
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {aceRows.map((ace) => (
            <article
              key={ace.id}
              className="border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Image
                    src={ace.avatarUrl}
                    alt={`Foto de perfil de ${ace.name}`}
                    width={44}
                    height={44}
                    className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-white"
                  />
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-950">{ace.name}</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {ace.territory}
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-[11px] font-semibold ${ace.status === "Ativo" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}
                >
                  {ace.status}
                </span>
              </div>
              <div className="mt-5 flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Cobertura da área
                  </p>
                  <p className="mt-1 text-3xl font-bold text-slate-950">
                    {ace.coverage}%
                  </p>
                </div>
                <p className="text-right text-xs text-slate-600">
                  {ace.visited}/{ace.assigned} imóveis
                  <br />
                  {ace.pending} pendentes
                </p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full ${ace.coverage >= 80 ? "bg-emerald-700" : ace.coverage >= 60 ? "bg-amber-500" : "bg-red-500"}`}
                  style={{ width: `${ace.coverage}%` }}
                />
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Última sincronização: {ace.lastSync ?? "sem registro"}
              </p>
              <button
                type="button"
                onClick={() => setSelectedAceId(ace.id)}
                className="mt-4 min-h-9 w-full border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:border-emerald-700 hover:text-emerald-800"
              >
                Ver trabalho
              </button>
              <Link
                href={`/usuarios/ace/${ace.id}`}
                className="mt-2 block text-center text-xs font-semibold text-emerald-800 hover:underline"
              >
                Abrir perfil completo
              </Link>
            </article>
          ))}
        </div>
        {selectedAce && (
          <div className="mt-4 border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                  Histórico de trabalho
                </p>
                <h3 className="mt-1 text-lg font-bold text-slate-950">
                  {selectedAce.name}
                </h3>
                <p className="text-sm text-slate-600">
                  {selectedAce.territory}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAceId(null)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-950"
              >
                Fechar
              </button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                [
                  "Visitas registradas",
                  String(selectedAce.visited),
                  "No ciclo atual",
                ],
                ["Cobertura", `${selectedAce.coverage}%`, "Área atribuída"],
                [
                  "Pendências",
                  String(selectedAce.pending),
                  "Retornos necessários",
                ],
                [
                  "Retornos registrados",
                  String(historyReturns.length),
                  "No ciclo consultado",
                ],
              ].map(([label, value, detail]) => (
                <div
                  key={label}
                  className="border border-emerald-100 bg-white p-3"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {label}
                  </p>
                  <p className="mt-1 text-lg font-bold text-slate-950">
                    {value}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{detail}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="border border-emerald-100 bg-white p-3 text-sm text-slate-700">
                <strong>Últimos registros:</strong>
                <ul className="mt-2 space-y-1 text-xs">
                  {historyVisits
                    .slice(-3)
                    .reverse()
                    .map((visit, index) => (
                      <li
                        key={String(
                          (visit as Record<string, unknown>).id ?? index,
                        )}
                      >
                        {String(
                          (visit as Record<string, unknown>).dataAtividade ??
                            (visit as Record<string, unknown>).createdAt ??
                            "Data não informada",
                        )}{" "}
                        ·{" "}
                        {String(
                          (visit as Record<string, unknown>).acesso ??
                            "REALIZADO",
                        )}{" "}
                        · imóvel{" "}
                        {String(
                          (visit as Record<string, unknown>).imovelId ??
                            "não informado",
                        )}
                      </li>
                    ))}
                  {historyVisits.length === 0 && (
                    <li>Nenhuma visita registrada no ciclo.</li>
                  )}
                </ul>
              </div>
              <div className="border border-emerald-100 bg-white p-3 text-sm text-slate-700">
                <strong>Situação operacional:</strong>
                <p className="mt-2 text-xs leading-5">
                  O gestor pode revisar os imóveis pendentes, acompanhar
                  retornos e conferir a última sincronização antes de
                  redistribuir a área.
                </p>
              </div>
            </div>
          </div>
        )}
      </Panel>
      <Panel
        title="Cobertura territorial"
        description="A leitura operacional usa registros de visitas, sem projeção de casos ou probabilidade de surto."
      >
        <div className="mb-5 grid min-w-0 gap-3 border border-slate-200 bg-slate-50 p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] md:items-end">
          <label className="flex flex-col text-xs font-semibold text-slate-700">
            Buscar bairro, setor ou quarteirão
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Digite o nome do território"
              className="mt-1 min-h-10 w-full flex-1 border border-slate-300 bg-white px-3 text-sm font-normal outline-none focus:border-emerald-700"
            />
          </label>
          <div className="flex w-full border border-slate-300 bg-white p-1">
            {(["BAIRROS", "SETORES", "QUARTEIROES"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setMode(item)}
                style={
                  mode === item
                    ? { backgroundColor: institutionPrimary }
                    : undefined
                }
                className={`min-h-9 flex-1 px-4 text-sm font-semibold ${mode === item ? "text-white hover:brightness-90" : "bg-white text-slate-700 hover:bg-slate-100"}`}
              >
                {item === "BAIRROS"
                  ? "Bairros"
                  : item === "SETORES"
                    ? "Setores"
                    : "Quarteirões"}
              </button>
            ))}
          </div>
        </div>
        {mode === "QUARTEIROES" ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-10">
            {filteredBlocks.map((block) => (
              <article
                key={block.number}
                className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm"
              >
                <div
                  className="grid h-28 w-28 place-items-center rounded-full p-2"
                  style={{
                    background: `conic-gradient(${coverageColor(block.coverage)} ${block.coverage}%, #e2e8f0 ${block.coverage}% 100%)`,
                  }}
                  role="img"
                  aria-label={`Quarteirão ${block.number}, ${block.coverage}% de cobertura`}
                >
                  <div className="grid h-full w-full place-items-center rounded-full bg-white">
                    <p className="text-3xl font-bold text-slate-950">
                      {block.number}
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Quarteirão {block.number}
                  </h3>
                  <p className="mt-1 text-xs text-slate-600">
                    {block.visited}/{block.properties} imóveis visitados
                  </p>
                </div>
              </article>
            ))}
          </div>
        ) : (
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
                      {(row.district ?? "Urbana").replace("Área ", "")}
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
        )}
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
          description="Cobertura baseada nos registros retornados pela API da vigilância ambiental"
        >
          <p className="text-sm leading-6 text-slate-600">
            Os números representam visitas e imóveis cadastrados no ciclo,
            calculados a partir das atribuições e sincronizações da API.
          </p>
          <p className="mt-4 text-xs text-slate-500">
            Imóveis retornados pela API: {apiData.propertiesTotal}
          </p>
        </Panel>
      </div>
    </div>
  );
}
