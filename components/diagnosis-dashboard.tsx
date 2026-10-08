"use client";

import { useMemo, useState } from "react";
import { MetricCard, PageHeading, Panel, RiskBadge } from "@/components/dashboard-ui";
import { PermissionGate } from "@/components/permission-gate";
import { formatNumber, municipality, neighborhoods, type MunicipalityConfiguration } from "@/lib/dashboard-data";

const weekLabels = ["SE 31", "SE 32", "SE 33", "SE 34", "SE 35", "SE 36", "SE 37", "SE 38", "SE 39", "SE 40", "SE 41", "SE 42"];
const apsSeries = [27, 29, 34, 31, 40, 47, 61, 70, 76, 89, 92, 104];
const sinanSeries = [18, 20, 21, 24, 25, 30, 36, 43, 48, 57, 63, 72];

type SortKey = "name" | "population" | "vectorFoci" | "apsCases" | "trigger";

function pointsFor(values: number[]) {
  const min = 0;
  const max = 110;
  return values.map((value, index) => {
    const x = 48 + index * (580 / (values.length - 1));
    const y = 178 - ((value - min) / (max - min)) * 140;
    return `${x},${y}`;
  }).join(" ");
}

export function DiagnosisDashboard() {
  const [sortKey, setSortKey] = useState<SortKey>("vectorFoci");
  const [ascending, setAscending] = useState(false);
  const [sensitivity, setSensitivity] = useState(60);
  const activeNeighborhoods = neighborhoods;

  const sortedNeighborhoods = useMemo(() => [...activeNeighborhoods].sort((a, b) => {
    const left = a[sortKey];
    const right = b[sortKey];
    const comparison = typeof left === "string" ? left.localeCompare(String(right), "pt-BR") : Number(left) - Number(right);
    return ascending ? comparison : -comparison;
  }), [activeNeighborhoods, ascending, sortKey]);
  const triggerCount = activeNeighborhoods.filter((item) => item.trigger).length;
  const averageVectorFoci = activeNeighborhoods.reduce((sum, item) => sum + item.vectorFoci, 0) / activeNeighborhoods.length;
  const totalApsCases = activeNeighborhoods.reduce((sum, item) => sum + item.apsCases, 0);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setAscending((current) => !current);
    else {
      setSortKey(key);
      setAscending(key === "name");
    }
  };

  const sortIndicator = (key: SortKey) => sortKey !== key ? "" : ascending ? " ↑" : " ↓";

  return (
    <div>
      <PageHeading
        eyebrow={`Saúde Única · ${municipality.name}, ${municipality.state} · Relatório automatizado`}
        title="Diagnóstico situacional"
        description="Leitura integrada de dados da Atenção Primária, Vigilância em Saúde e território para apoiar a decisão municipal."
        action={
          <div className="flex flex-wrap gap-2">
            <PermissionGate permission="reports:export">
              <button type="button" onClick={() => window.print()} className="min-h-10 border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Exportar relatório
              </button>
            </PermissionGate>
            <PermissionGate permission="data:download">
              <button type="button" onClick={() => downloadTerritorialData(sortedNeighborhoods, municipality)} className="min-h-10 border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Baixar base territorial
              </button>
            </PermissionGate>
          </div>
        }
      />

      <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Antecedência média do sinal APS" value="18 dias" detail="Antes do crescimento das notificações SINAN" trend="Sinal precoce" />
        <MetricCard label="Bairros gatilho identificados" value={`${triggerCount}`} detail="Territórios com fatores combinados de risco" />
        <MetricCard label="Casos febris identificados pela APS" value={formatNumber(totalApsCases)} detail="Registros agregados de e-SUS PEC" />
        <MetricCard label="Índice vetorial médio (LIRAa/LIA)" value={`${averageVectorFoci.toFixed(1)}%`} detail="Município · último levantamento informado" trend="Atenção" />
      </section>

      <div className="space-y-5">
        <PermissionGate
          permission="diagnosis:advanced"
          fallback={
            <Panel title="Relatório de síndromes febris" description={`Sinais assistenciais e alertas relevantes para a Atenção Primária em ${municipality.name}.`}>
              <div className="grid gap-3 sm:grid-cols-2">
                <MetricCard label="Atendimentos febris · 7 dias" value="38" detail="Registros agregados das unidades vinculadas" trend="+12% na semana" />
                <MetricCard label="Notificações pendentes" value="6" detail="Verificar completude e encaminhamento" />
              </div>
              <p className="mt-4 border-l-2 border-blue-700 bg-blue-50 px-3 py-2 text-sm leading-6 text-slate-700">Considere sinais clínicos e exposição territorial durante a avaliação; siga o protocolo municipal para notificação de arboviroses.</p>
            </Panel>
          }
        >
        <Panel title="Correlação temporal · APS e Vigilância" description="Sinais de atendimentos febris/gripais e notificações oficiais de arboviroses por semana epidemiológica.">
          <div className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600">
            <span className="inline-flex items-center gap-2"><span className="h-0.5 w-5 bg-blue-700" />Atendimentos febris · e-SUS PEC</span>
            <span className="inline-flex items-center gap-2"><span className="h-0.5 w-5 bg-slate-500" />Notificações confirmadas · SINAN</span>
            <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 border border-blue-300 bg-blue-50" />Antecedência observada</span>
          </div>
          <div className="overflow-x-auto">
            <svg role="img" aria-label="Gráfico de atendimentos febris e notificações SINAN em 12 semanas, com sinal da APS antecedendo a Vigilância" viewBox="0 0 680 235" className="h-auto min-w-[560px] w-full">
              <rect x="48" y="32" width="245" height="150" fill="#eff6ff" />
              {[38, 73, 108, 143, 178].map((y) => <line key={y} x1="48" y1={y} x2="628" y2={y} stroke="#e2e8f0" strokeWidth="1" />)}
              <polyline points={pointsFor(apsSeries)} fill="none" stroke="#1d4ed8" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
              <polyline points={pointsFor(sinanSeries)} fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
              {apsSeries.map((value, index) => {
                const actualX = 48 + index * (580 / (apsSeries.length - 1));
                return <circle key={`aps-${index}`} cx={actualX} cy={178 - (value / 110) * 140} r="3" fill="#1d4ed8" />;
              })}
              {weekLabels.map((week, index) => <text key={week} x={48 + index * (580 / (weekLabels.length - 1))} y="204" textAnchor="middle" fontSize="9" fill="#64748b">{week}</text>)}
              <text x="170" y="52" textAnchor="middle" fontSize="10" fontWeight="600" fill="#1e40af">Sinal antecipado na APS</text>
              <line x1="290" y1="62" x2="362" y2="62" stroke="#1d4ed8" strokeWidth="1.5" />
              <path d="M362 62l-6-4v8z" fill="#1d4ed8" />
              <text x="326" y="54" textAnchor="middle" fontSize="9" fill="#1e40af">~18 dias</text>
              <text x="18" y="108" transform="rotate(-90 18 108)" textAnchor="middle" fontSize="10" fill="#64748b">Registros indexados</text>
            </svg>
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-500">A curva de atendimentos por sintomas febris apresenta aumento antes da curva de notificações oficiais, oferecendo uma janela operacional para investigação e resposta. Valores ilustrativos agregados.</p>
        </Panel>

        <PermissionGate permission="model:calibrate">
          <Panel title="Calibração do modelo" description={`Ajuste demonstrativo da sensibilidade para sinalização territorial em ${municipality.name}.`}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-800">Sensibilidade do alerta antecipado</p>
                <p className="mt-1 text-xs text-slate-500">Valores maiores sinalizam mais territórios para revisão epidemiológica.</p>
              </div>
              <span className="text-lg font-bold text-slate-900">{sensitivity}%</span>
            </div>
            <input aria-label="Sensibilidade do modelo" type="range" min={20} max={90} step={5} value={sensitivity} onChange={(event) => setSensitivity(Number(event.target.value))} className="mt-4 h-2 w-full cursor-pointer accent-blue-700" />
            <p role="status" className="mt-2 text-xs text-slate-600">Pré-visualização: {Math.min(activeNeighborhoods.length, Math.round(activeNeighborhoods.length * sensitivity / 100))} territórios sinalizados para validação.</p>
          </Panel>
        </PermissionGate>

        <Panel
          title="Matriz de vulnerabilidade territorial"
          description="Ordene os bairros pelos indicadores territoriais integrados. Um bairro gatilho combina sinais de vulnerabilidade e atividade vetorial."
          action={<span className="bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800">{activeNeighborhoods.length} territórios</span>}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-3 pr-4"><button type="button" onClick={() => handleSort("name")} className="font-semibold hover:text-slate-900">Bairro{sortIndicator("name")}</button></th>
                  <th className="py-3 pr-4"><button type="button" onClick={() => handleSort("population")} className="font-semibold hover:text-slate-900">População{sortIndicator("population")}</button></th>
                  <th className="py-3 pr-4"><button type="button" onClick={() => handleSort("vectorFoci")} className="font-semibold hover:text-slate-900">Focos LIRAa/LIA{sortIndicator("vectorFoci")}</button></th>
                  <th className="py-3 pr-4"><button type="button" onClick={() => handleSort("apsCases")} className="font-semibold hover:text-slate-900">Casos APS{sortIndicator("apsCases")}</button></th>
                  <th className="py-3 pr-4"><button type="button" onClick={() => handleSort("trigger")} className="font-semibold hover:text-slate-900">Bairro gatilho{sortIndicator("trigger")}</button></th>
                  <th className="py-3">Risco atual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedNeighborhoods.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-3.5 pr-4 font-semibold text-slate-900">{item.name}<span className="mt-0.5 block text-xs font-normal text-slate-500">{item.district}</span></td>
                    <td className="py-3.5 pr-4 text-slate-700">{formatNumber(item.population)}</td>
                    <td className="py-3.5 pr-4"><span className="text-slate-700">{item.vectorFoci.toFixed(1)}%</span><span className="mt-1 block"><RiskBadge risk={item.risk} /></span></td>
                    <td className="py-3.5 pr-4 text-slate-700">{formatNumber(item.apsCases)}</td>
                    <td className="py-3.5 pr-4">
                      {item.trigger
                        ? <span className="bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-800">Identificado</span>
                        : <span className="text-xs text-slate-500">Não</span>}
                    </td>
                    <td className="py-3.5"><RiskBadge risk={item.risk} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-slate-500">Fontes previstas: e-SUS PEC · SINAN · LIRAa/LIA · estimativas populacionais. Dados exibidos para demonstração.</p>
        </Panel>
        </PermissionGate>
      </div>
    </div>
  );
}

function downloadTerritorialData(rows: typeof neighborhoods, municipality: MunicipalityConfiguration) {
  const headers = ["bairro", "municipio", "populacao", "casos_suspeitos", "taxa_por_100_mil", "risco", "densidade_km2", "focos_liraa_lia", "atendimentos_aps", "bairro_gatilho"];
  const csvRows = rows.map((neighborhood) => [
    neighborhood.name,
    neighborhood.city,
    neighborhood.population,
    neighborhood.suspectedCases,
    neighborhood.ratePer100k,
    neighborhood.risk,
    neighborhood.density,
    neighborhood.vectorFoci,
    neighborhood.apsVisits,
    neighborhood.trigger ? "sim" : "nao",
  ]);
  const csv = [headers, ...csvRows]
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(";"))
    .join("\r\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `base-territorial-${municipality.name.toLocaleLowerCase("pt-BR")}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}
