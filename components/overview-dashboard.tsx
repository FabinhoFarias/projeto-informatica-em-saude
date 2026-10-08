"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MetricCard, PageHeading, Panel, RiskBadge } from "@/components/dashboard-ui";
import { PermissionGate } from "@/components/permission-gate";
import { useRole } from "@/components/rbac-context";
import {
  formatNumber,
  municipality,
  neighborhoods,
  recommendationsFor,
  riskColors,
  type Neighborhood,
} from "@/lib/dashboard-data";

type SortKey = "incidenceProbability" | "forecastCases" | "name" | "vectorFoci";

const periodOptions = [
  { weeks: 2, label: "Próximas 2 semanas" },
  { weeks: 3, label: "Próximas 3 semanas" },
  { weeks: 4, label: "Próximas 4 semanas" },
];

const sortOptions: { value: SortKey; label: string }[] = [
  { value: "incidenceProbability", label: "Maior probabilidade de incidência" },
  { value: "forecastCases", label: "Maior quantidade de casos previstos" },
  { value: "name", label: "Ordem alfabética" },
  { value: "vectorFoci", label: "Maior volume de focos" },
];

function projectedCasesFor(neighborhood: Neighborhood, weeks: number, condition: string) {
  const conditionFactor = condition === "Zika" ? 0.12 : condition === "Chikungunya" ? 0.25 : condition === "Dengue" ? 0.8 : 1;
  return Math.round(neighborhood.forecastCases * weeks / 4 * conditionFactor);
}

export function OverviewDashboard() {
  const role = useRole();
  const [period, setPeriod] = useState(4);
  const [condition, setCondition] = useState("Todos");
  const [sortKey, setSortKey] = useState<SortKey>("incidenceProbability");
  const [view, setView] = useState<"grid" | "table">("grid");
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<Neighborhood | null>(null);

  const sortedNeighborhoods = useMemo(() => [...neighborhoods].sort((left, right) => {
    if (sortKey === "name") return left.name.localeCompare(right.name, "pt-BR");
    return Number(right[sortKey]) - Number(left[sortKey]);
  }), [sortKey]);

  const projectedCases = sortedNeighborhoods.reduce((total, item) => total + projectedCasesFor(item, period, condition), 0);
  const priorityCount = neighborhoods.filter((item) => item.risk === "Crítico" || item.risk === "Alto").length;
  const criticalCount = neighborhoods.filter((item) => item.risk === "Crítico").length;

  if (role === "AGENTE_CAMPO") return <FieldPortal />;
  if (role === "PROFISSIONAL_APS") return <ApsPortal />;

  return (
    <div>
      <PageHeading
        eyebrow={`${municipality.prefeitura} · Vigilância epidemiológica`}
        title="Visão geral e painel de bairros"
        description="Acompanhe a projeção municipal por território e priorize ações de prevenção e controle vetorial."
        action={
          <PermissionGate permission="ingestion:manage">
            <Link href="/ingestao" className="inline-flex min-h-10 items-center bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800">Importar planilha</Link>
          </PermissionGate>
        }
      />

      <section aria-label="Filtros do painel" className="mb-5 grid gap-3 border border-slate-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1.5fr]">
        <div>
          <label htmlFor="projection-period" className="mb-1.5 block text-xs font-medium text-slate-600">Período / semana epidemiológica</label>
          <select id="projection-period" value={period} onChange={(event) => setPeriod(Number(event.target.value))} className="min-h-10 w-full border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100">
            {periodOptions.map((option) => <option key={option.weeks} value={option.weeks}>{option.label} · SE 42–{41 + option.weeks}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="condition-filter" className="mb-1.5 block text-xs font-medium text-slate-600">Agravo</label>
          <select id="condition-filter" value={condition} onChange={(event) => setCondition(event.target.value)} className="min-h-10 w-full border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100">
            <option>Todos</option><option>Dengue</option><option>Zika</option><option>Chikungunya</option>
          </select>
        </div>
        <div>
          <label htmlFor="neighborhood-sort" className="mb-1.5 block text-xs font-medium text-slate-600">Ordenar bairros por</label>
          <select id="neighborhood-sort" value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)} className="min-h-10 w-full border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100">
            {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>
      </section>

      <section aria-label="Indicadores municipais" className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Casos previstos no município" value={formatNumber(projectedCases)} detail={`${condition} · horizonte de ${period} semanas`} trend={`SE 42–${41 + period}`} />
        <MetricCard label="Bairros em risco alto ou crítico" value={`${priorityCount} de ${neighborhoods.length}`} detail="Prioridade para resposta territorial" trend={`${criticalCount} críticos`} />
        <MetricCard label="Taxa de notificação atual" value="42,8" detail="por 100 mil hab. · média histórica 31,2" trend="+37%" />
        <MetricCard label="Cobertura das visitas de campo" value="68%" detail="Meta operacional municipal: 80%" trend="+6 p.p." />
      </section>

      <Panel
        title="Ranking de risco por bairro"
        description={`${municipality.name}, ${municipality.state} · ${sortedNeighborhoods.length} bairros · projeção para ${period} semanas`}
        action={
          <div className="flex items-center gap-1 border border-slate-200 p-1" aria-label="Modo de visualização">
            <button type="button" aria-pressed={view === "grid"} onClick={() => setView("grid")} className={`min-h-8 px-3 text-xs font-medium ${view === "grid" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}>Cards</button>
            <button type="button" aria-pressed={view === "table"} onClick={() => setView("table")} className={`min-h-8 px-3 text-xs font-medium ${view === "table" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}>Tabela</button>
          </div>
        }
      >
        {view === "grid" ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sortedNeighborhoods.map((item, index) => (
            <NeighborhoodCard key={item.id} neighborhood={item} weeks={period} condition={condition} rank={index + 1} onDetails={() => setSelectedNeighborhood(item)} />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
              <thead><tr className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-500">
                <th className="py-3 pr-4 font-semibold">Bairro</th>
                <th className="py-3 pr-4 font-semibold">Distrito sanitário</th>
                <th className="py-3 pr-4 font-semibold">Probabilidade de surto</th>
                <th className="py-3 pr-4 font-semibold">Casos previstos</th>
                <th className="py-3 pr-4 font-semibold">Atendimentos APS</th>
                <th className="py-3 pr-4 font-semibold">Risco vetorial · LIRAa/LIA</th>
                <th className="py-3 font-semibold">Ação recomendada</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {sortedNeighborhoods.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-3.5 pr-4 font-semibold text-slate-900">{item.name}</td>
                    <td className="py-3.5 pr-4 text-slate-600">{item.district}</td>
                    <td className="py-3.5 pr-4"><div className="flex items-center gap-2"><RiskBadge risk={item.risk} /><span className="text-xs text-slate-600">{item.incidenceProbability}%</span></div></td>
                    <td className="py-3.5 pr-4 font-medium text-slate-800">{formatNumber(projectedCasesFor(item, period, condition))}</td>
                    <td className="py-3.5 pr-4 text-slate-600">{item.apsCases} · {item.apsStatus}</td>
                    <td className="py-3.5 pr-4 text-slate-600">{item.vectorFoci.toFixed(1)}% focos</td>
                    <td className="py-3.5"><button type="button" onClick={() => setSelectedNeighborhood(item)} className="text-left text-xs font-semibold text-blue-800 hover:underline">Ver recomendações</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {selectedNeighborhood && (
        <RecommendationsDrawer
          neighborhood={selectedNeighborhood}
          weeks={period}
          condition={condition}
          onClose={() => setSelectedNeighborhood(null)}
        />
      )}
    </div>
  );
}

function NeighborhoodCard({
  neighborhood,
  weeks,
  condition,
  rank,
  onDetails,
}: {
  neighborhood: Neighborhood;
  weeks: number;
  condition: string;
  rank: number;
  onDetails: () => void;
}) {
  const riskColor = riskColors[neighborhood.risk];
  const cases = projectedCasesFor(neighborhood, weeks, condition);

  return (
    <article className="border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center bg-slate-100 text-xs font-semibold text-slate-600">#{rank}</span>
          <div>
            <h3 className="font-semibold text-slate-950">{neighborhood.name}</h3>
            <p className="mt-1 text-xs text-slate-500">{neighborhood.district}</p>
          </div>
        </div>
        <RiskBadge risk={neighborhood.risk} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-y border-slate-100 py-3">
        <div><p className="text-[10px] leading-4 text-slate-500">Probabilidade</p><p className="mt-1 text-sm font-bold text-slate-900">{neighborhood.incidenceProbability}%</p></div>
        <div><p className="text-[10px] leading-4 text-slate-500">Casos · {weeks} sem.</p><p className="mt-1 text-sm font-bold text-slate-900">{formatNumber(cases)}</p></div>
        <div><p className="text-[10px] leading-4 text-slate-500">Focos ativos</p><p className="mt-1 text-sm font-bold text-slate-900">{neighborhood.vectorFoci.toFixed(1)}%</p></div>
      </div>

      <div className="mt-3">
        <div className="mb-1.5 flex justify-between text-[10px] text-slate-500"><span>Probabilidade estimada</span><span>{neighborhood.incidenceProbability}%</span></div>
        <div
          className="h-2 w-full bg-slate-100"
          role="progressbar"
          aria-label={`Probabilidade de incidência em ${neighborhood.name}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={neighborhood.incidenceProbability}
        >
          <div className="h-full" style={{ width: `${neighborhood.incidenceProbability}%`, backgroundColor: riskColor.foreground }} />
        </div>
      </div>
      <button type="button" onClick={onDetails} className="mt-4 min-h-10 w-full border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50">Ver detalhes e recomendações</button>
    </article>
  );
}

function RecommendationsDrawer({
  neighborhood,
  weeks,
  condition,
  onClose,
}: {
  neighborhood: Neighborhood;
  weeks: number;
  condition: string;
  onClose: () => void;
}) {
  const [planCreated, setPlanCreated] = useState(false);

  return (
    <div className="fixed inset-0 z-[300] flex justify-end bg-slate-950/30" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <aside role="dialog" aria-modal="true" aria-labelledby="recommendations-title" className="h-full w-full max-w-lg overflow-y-auto border-l border-slate-200 bg-white p-5 sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Detalhes territoriais</p>
            <h2 id="recommendations-title" className="mt-2 text-2xl font-bold text-slate-950">{neighborhood.name}</h2>
            <p className="mt-1 text-sm text-slate-500">{neighborhood.district} · {municipality.name}, {municipality.state}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar recomendações" className="grid h-9 w-9 place-items-center border border-slate-200 text-lg text-slate-600 hover:bg-slate-50">×</button>
        </div>
        <div className="mt-5 flex items-center justify-between gap-3 border-y border-slate-100 py-4">
          <div><p className="text-xs text-slate-500">Nível de risco</p><div className="mt-1"><RiskBadge risk={neighborhood.risk} /></div></div>
          <div className="text-right"><p className="text-xs text-slate-500">Probabilidade projetada</p><p className="mt-1 text-lg font-bold text-slate-900">{neighborhood.incidenceProbability}%</p></div>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-4">
          <div className="bg-slate-50 p-3"><dt className="text-xs text-slate-500">População</dt><dd className="mt-1 font-semibold">{formatNumber(neighborhood.population)}</dd></div>
          <div className="bg-slate-50 p-3"><dt className="text-xs text-slate-500">Casos previstos · {weeks} semanas</dt><dd className="mt-1 font-semibold">{formatNumber(projectedCasesFor(neighborhood, weeks, condition))} · {condition}</dd></div>
          <div className="bg-slate-50 p-3"><dt className="text-xs text-slate-500">Focos vetoriais</dt><dd className="mt-1 font-semibold">{neighborhood.vectorFoci.toFixed(1)}% · LIRAa/LIA</dd></div>
          <div className="bg-slate-50 p-3"><dt className="text-xs text-slate-500">Atendimentos APS</dt><dd className="mt-1 font-semibold">{neighborhood.apsCases} · {neighborhood.apsStatus}</dd></div>
        </dl>
        <h3 className="mt-7 text-sm font-semibold text-slate-900">Recomendações operacionais</h3>
        <ol className="mt-3 space-y-4">
          {recommendationsFor(neighborhood).map((recommendation, index) => (
            <li key={recommendation} className="flex gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center bg-blue-50 text-xs font-semibold text-blue-800">{index + 1}</span>
              <p className="text-sm leading-6 text-slate-700">{recommendation}</p>
            </li>
          ))}
        </ol>
        <PermissionGate permission="routes:approve">
          <button type="button" onClick={() => setPlanCreated(true)} className="mt-6 min-h-11 w-full bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800">{planCreated ? "Plano de ação registrado" : "Aprovar plano de ação"}</button>
          {planCreated && <p role="status" className="mt-2 text-center text-xs text-slate-600">Plano demonstrativo aprovado para {neighborhood.name}.</p>}
        </PermissionGate>
        <p className="mt-4 text-center text-[11px] text-slate-500">Recomendações automatizadas · validar com a vigilância municipal</p>
      </aside>
    </div>
  );
}

function FieldPortal() {
  const [routeStarted, setRouteStarted] = useState(false);
  const assignedNeighborhood = neighborhoods.find((neighborhood) => neighborhood.id === "ibura")!;

  return (
    <div>
      <PageHeading eyebrow="Área do agente · Recife, PE" title="Minha rota de campo" description="Acompanhe as visitas atribuídas à sua microárea e os alertas que precisam de verificação." />
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
        <Panel title="Rota de hoje" description="Ibura · Microárea 04 · Recife">
          <p className="text-sm font-semibold text-slate-900">12 imóveis prioritários</p>
          <p className="mt-1 text-sm text-slate-600">Quadras 12 a 18 · vistoria de focos e orientação aos moradores</p>
          <p className="mt-3 text-xs text-slate-500">Última sincronização · hoje às 07:48</p>
          <button type="button" onClick={() => setRouteStarted((started) => !started)} className="mt-5 min-h-11 bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800">{routeStarted ? "Rota em andamento · registrar visita" : "Iniciar rota"}</button>
          {routeStarted && <p role="status" className="mt-3 text-xs text-slate-600">Rota iniciada. O registro de visitas ficará disponível no aplicativo móvel.</p>}
        </Panel>
        <Panel title="Alerta da microárea" description="Vigilância municipal · projeção para SE 42–45">
          <RiskBadge risk={assignedNeighborhood.risk} />
          <p className="mt-4 text-sm font-semibold text-slate-900">Aumento de notificações suspeitas no Ibura</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">Verificar recipientes com água parada nas quadras prioritárias e orientar moradores a procurar a UBS em caso de febre.</p>
        </Panel>
      </section>
    </div>
  );
}

function ApsPortal() {
  const priorityNeighborhoods = neighborhoods.filter((item) => item.risk === "Alto" || item.risk === "Crítico");

  return (
    <div>
      <PageHeading eyebrow="Atenção Primária · Recife, PE" title="Alertas da unidade de saúde" description="Sinais de síndromes febris e alertas territoriais para apoiar a triagem e a notificação pela equipe da UBS." />
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.85fr)]">
        <Panel title="Atenção na área de referência" description="Resumo de sinais de vigilância e atendimentos recentes">
          <div className="grid gap-3 sm:grid-cols-2">
            <MetricCard label="Atendimentos febris · 7 dias" value="38" detail="Síndromes febris/gripais registradas" trend="+12% na semana" />
            <MetricCard label="Notificações pendentes" value="6" detail="Verificar completude e encaminhamento" />
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">Siga o protocolo municipal para avaliação clínica e notificação de casos suspeitos.</p>
        </Panel>
        <Panel title="Bairros em alerta" description="Territórios com risco alto ou crítico no município">
          <ul className="divide-y divide-slate-100">
            {priorityNeighborhoods.map((neighborhood) => (
              <li key={neighborhood.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <span><span className="block text-sm font-semibold text-slate-900">{neighborhood.name}</span><span className="text-xs text-slate-500">{neighborhood.suspectedCases} casos suspeitos · {neighborhood.ratePer100k}/100 mil hab.</span></span>
                <RiskBadge risk={neighborhood.risk} />
              </li>
            ))}
          </ul>
        </Panel>
      </section>
    </div>
  );
}
