"use client";

import { useMemo, useState } from "react";
import { MetricCard, PageHeading, Panel, RiskBadge } from "@/components/dashboard-ui";
import { formatNumber, municipality, neighborhoods } from "@/lib/dashboard-data";

const riskWeight = { Baixo: 1, Médio: 1.5, Alto: 2.5, Crítico: 4 } as const;

function distribute(total: number, weights: number[]) {
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
  const exact = weights.map((weight) => total * weight / weightSum);
  const allocation = exact.map(Math.floor);
  let remainder = total - allocation.reduce((sum, value) => sum + value, 0);
  const remainderOrder = exact
    .map((value, index) => ({ index, fraction: value - allocation[index] }))
    .sort((a, b) => b.fraction - a.fraction);
  for (const item of remainderOrder) {
    if (remainder <= 0) break;
    allocation[item.index] += 1;
    remainder -= 1;
  }
  return allocation;
}

export function SimulationDashboard() {
  const [acs, setAcs] = useState(32);
  const [ace, setAce] = useState(48);
  const [larvicide, setLarvicide] = useState(220);
  const [tests, setTests] = useState(180);

  const activeNeighborhoods = useMemo(() => [...neighborhoods].sort((left, right) => {
    const riskDifference = ({ Crítico: 0, Alto: 1, Médio: 2, Baixo: 3 } as const)[left.risk] -
      ({ Crítico: 0, Alto: 1, Médio: 2, Baixo: 3 } as const)[right.risk];
    return riskDifference || right.vectorFoci - left.vectorFoci;
  }), []);
  const allocationWeights = useMemo(
    () => activeNeighborhoods.map((neighborhood) => riskWeight[neighborhood.risk] * (1 + neighborhood.population / 100000)),
    [activeNeighborhoods],
  );
  const acsAllocation = useMemo(() => distribute(acs, allocationWeights), [acs, allocationWeights]);
  const aceAllocation = useMemo(() => distribute(ace, allocationWeights), [ace, allocationWeights]);
  const larvicideAllocation = useMemo(() => distribute(larvicide, allocationWeights), [larvicide, allocationWeights]);
  const testsAllocation = useMemo(() => distribute(tests, allocationWeights), [tests, allocationWeights]);
  const reduction = Math.min(46, Math.round(ace * 0.19 + larvicide * 0.035 + tests * 0.018));
  const coverage = Math.min(96, 42 + Math.round(ace * 0.42 + acs * 0.18 + larvicide * 0.025));
  const baseline = [1248, 1390, 1516, 1644];
  const projected = baseline.map((cases) => Math.round(cases * (1 - reduction / 100)));

  const resetScenario = () => {
    setAcs(32);
    setAce(48);
    setLarvicide(220);
    setTests(180);
  };

  const controls = [
    { id: "acs", label: "Agentes comunitários (ACS)", value: acs, setValue: setAcs, min: 0, max: 120, unit: "agentes" },
    { id: "ace", label: "Agentes de combate a endemias (ACE)", value: ace, setValue: setAce, min: 0, max: 160, unit: "agentes" },
    { id: "larvicide", label: "Estoque de larvicida", value: larvicide, setValue: setLarvicide, min: 0, max: 800, unit: "kg/L" },
    { id: "tests", label: "Testes rápidos disponíveis", value: tests, setValue: setTests, min: 0, max: 1000, unit: "testes" },
  ];

  return (
    <div>
      <PageHeading
        eyebrow={`Planejamento operacional · ${municipality.name}, ${municipality.state} · Cenários`}
        title="Simulação de recursos"
        description="Ajuste a disponibilidade municipal e compare cobertura territorial e impacto epidemiológico estimado."
        action={<button type="button" onClick={resetScenario} className="min-h-10 border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Restaurar cenário base</button>}
      />

      <section className="mb-5 grid gap-5 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <Panel title="Recursos disponíveis" description="Ajuste os valores para construir um cenário de resposta.">
          <div className="space-y-6">
            {controls.map((control) => (
              <div key={control.id}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label htmlFor={control.id} className="text-sm font-medium text-slate-700">{control.label}</label>
                  <span className="min-w-[88px] text-right text-sm font-bold text-slate-900">{control.value} <span className="text-xs font-normal text-slate-500">{control.unit}</span></span>
                </div>
                <input
                  id={control.id}
                  type="range"
                  min={control.min}
                  max={control.max}
                  value={control.value}
                  onChange={(event) => control.setValue(Number(event.target.value))}
                  className="h-2 w-full cursor-pointer accent-blue-700"
                />
                <div className="mt-1 flex justify-between text-[10px] text-slate-400"><span>{control.min}</span><span>{control.max}</span></div>
              </div>
            ))}
          </div>
          <div className="mt-6 border-l-2 border-blue-700 bg-blue-50 px-4 py-3">
            <p className="text-xs font-semibold text-blue-900">Como interpretar</p>
            <p className="mt-1 text-xs leading-5 text-blue-900/80">Estimativas demonstrativas baseadas em disponibilidade de equipes e criticidade do território. Não substituem avaliação da gestão local.</p>
          </div>
        </Panel>

        <div className="space-y-5">
          <section aria-label="Indicadores do cenário simulado" className="grid gap-3 sm:grid-cols-2">
            <MetricCard label="Redução estimada de casos" value={`${reduction}%`} detail="Comparado ao cenário sem ajuste" trend={`−${formatNumber(baseline[3] - projected[3])} até SE +4`} />
            <MetricCard label="Cobertura estimada de visitas" value={`${coverage}%`} detail="Imóveis prioritários com visita planejada" trend="Meta: 80%" />
          </section>
          <Panel title="Impacto projetado" description="Casos estimados em quatro semanas · cenário atual versus simulado.">
            <div className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600">
              <span className="inline-flex items-center gap-2"><span className="h-3 w-3 bg-slate-300" />Cenário atual sem ajuste</span>
              <span className="inline-flex items-center gap-2"><span className="h-3 w-3 bg-blue-700" />Cenário simulado</span>
            </div>
            <div className="space-y-4">
              {baseline.map((value, index) => {
                const currentPercent = value / baseline[3] * 100;
                const simulatedPercent = projected[index] / baseline[3] * 100;
                return (
                  <div key={index} className="grid grid-cols-[48px_minmax(0,1fr)_60px] items-center gap-3">
                    <span className="text-xs font-medium text-slate-600">SE +{index + 1}</span>
                    <div className="space-y-1.5">
                      <div className="h-3 w-full bg-slate-100"><div className="h-full bg-slate-300" style={{ width: `${currentPercent}%` }} /></div>
                      <div className="h-3 w-full bg-slate-100"><div className="h-full bg-blue-700" style={{ width: `${simulatedPercent}%` }} /></div>
                    </div>
                    <span className="text-right text-xs font-semibold text-slate-700">{formatNumber(projected[index])}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 flex justify-between border-t border-slate-100 pt-3 text-xs text-slate-500"><span>Estimativa de casos para o município</span><span className="font-medium text-slate-700">Impacto estimado: −{reduction}%</span></div>
          </Panel>
        </div>
      </section>

      <Panel
        title="Distribuição recomendada por bairro"
        description="Alocação proporcional à população e ao nível de criticidade territorial. As quantidades totalizam os recursos disponíveis no cenário."
        action={<span className="text-xs text-slate-500">{acs} ACS · {ace} ACE</span>}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[690px] border-collapse text-left text-sm">
            <thead><tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <th className="py-3 pr-4 font-semibold">Bairro</th>
              <th className="py-3 pr-4 font-semibold">Criticidade</th>
              <th className="py-3 pr-4 font-semibold">ACS</th>
              <th className="py-3 pr-4 font-semibold">ACE</th>
              <th className="py-3 pr-4 font-semibold">Larvicida (kg/L)</th>
              <th className="py-3 font-semibold">Testes rápidos</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {activeNeighborhoods.map((neighborhood, index) => (
                <tr key={neighborhood.id} className="hover:bg-slate-50">
                  <td className="py-3.5 pr-4 font-semibold text-slate-900">{neighborhood.name}<span className="mt-0.5 block text-xs font-normal text-slate-500">{neighborhood.city}</span></td>
                  <td className="py-3.5 pr-4"><RiskBadge risk={neighborhood.risk} /></td>
                  <td className="py-3.5 pr-4 text-slate-700">{acsAllocation[index]}</td>
                  <td className="py-3.5 pr-4 text-slate-700">{aceAllocation[index]}</td>
                  <td className="py-3.5 pr-4 text-slate-700">{larvicideAllocation[index]}</td>
                  <td className="py-3.5 text-slate-700">{testsAllocation[index]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-slate-500">A alocação utiliza pesos de risco e população; eventuais unidades residuais são distribuídas para totalizar os recursos informados.</p>
      </Panel>
    </div>
  );
}
