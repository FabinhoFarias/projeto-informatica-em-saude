"use client";

import { useMemo, useState } from "react";
import { demoTerritories } from "@/lib/priorizacao/demo-data";
import { evaluateDemoTerritory } from "@/lib/priorizacao/rules";
import type { ReviewStatus } from "@/lib/priorizacao/types";
import { TerritoryHousesPanel } from "@/components/territorios/territory-houses-panel";

export function TerritorialPrioritization() {
  const [selectedId, setSelectedId] = useState(demoTerritories[0].id);
  const [decisions, setDecisions] = useState<Record<string, ReviewStatus>>({});
  const selected = useMemo(
    () =>
      demoTerritories.find((item) => item.id === selectedId) ??
      demoTerritories[0],
    [selectedId],
  );
  const result = evaluateDemoTerritory(selected);
  const status = decisions[selected.id] ?? "Aguardando análise";
  const priorityCount = demoTerritories.filter(
    (item) => evaluateDemoTerritory(item).nivel === "Revisão prioritária",
  ).length;

  return (
    <div className="space-y-6">
      <header className="border-b border-slate-200 pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-700">
          Vigilância ambiental · apoio à decisão
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          Do sinal territorial à decisão da equipe
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
          Demonstração interativa para a persona gestora da Vigilância Ambiental
          em Lagoa de Itaenga. Escolha um território, veja quais critérios
          didáticos foram acionados e registre uma decisão temporária nesta
          sessão.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Summary
          title="Territórios fictícios"
          value={String(demoTerritories.length)}
          detail="Recorte ilustrativo de Lagoa de Itaenga"
        />
        <Summary
          title="Para revisão prioritária"
          value={String(priorityCount)}
          detail="Pela regra demonstrativa"
        />
        <Summary
          title="Decisões nesta sessão"
          value={String(Object.keys(decisions).length)}
          detail="Não são salvas nem enviadas"
        />
      </div>

      <TerritoryHousesPanel />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <section
          aria-labelledby="territorios-heading"
          className="border border-slate-200 bg-white p-5"
        >
          <h2
            id="territorios-heading"
            className="text-lg font-bold text-slate-950"
          >
            1. Selecionar território
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Todos os registros abaixo são fictícios.
          </p>
          <div className="mt-4 space-y-2">
            {demoTerritories.map((item) => {
              const evaluation = evaluateDemoTerritory(item);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  aria-pressed={selectedId === item.id}
                  className={`flex min-h-16 w-full items-center justify-between gap-3 border p-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${selectedId === item.id ? "border-blue-700 bg-blue-50" : "border-slate-200 hover:bg-slate-50"}`}
                >
                  <span>
                    <strong className="block text-sm text-slate-950">
                      {item.nome}
                    </strong>
                    <span className="text-xs text-slate-600">
                      {item.distrito} · {item.notificacoesRecentes} notificações
                      fictícias
                    </span>
                  </span>
                  <span
                    className={`shrink-0 text-xs font-semibold ${evaluation.nivel === "Revisão prioritária" ? "text-red-700" : "text-slate-700"}`}
                  >
                    {evaluation.nivel}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section
          aria-labelledby="decisao-heading"
          className="border border-slate-200 bg-white p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2
                id="decisao-heading"
                className="text-lg font-bold text-slate-950"
              >
                2. Entender e decidir · {selected.nome}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Regra transparente aplicada aos indicadores fictícios.
              </p>
            </div>
            <span
              className={`px-3 py-1 text-xs font-bold ${result.nivel === "Revisão prioritária" ? "bg-red-50 text-red-800" : result.nivel === "Acompanhar" ? "bg-amber-50 text-amber-900" : "bg-green-50 text-green-800"}`}
            >
              {result.nivel}
            </span>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Fact
              label="Notificações atuais"
              value={selected.notificacoesRecentes}
            />
            <Fact
              label="Período anterior"
              value={selected.notificacoesAnteriores}
            />
            <Fact label="Focos informados" value={selected.focosInformados} />
            <Fact label="Imóveis pendentes" value={selected.imoveisPendentes} />
          </dl>
          <div className="mt-5 border-l-4 border-blue-600 bg-blue-50 p-4">
            <h3 className="text-sm font-bold text-blue-950">
              Por que apareceu este sinal?
            </h3>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm leading-6 text-blue-950">
              {result.motivos.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-700">
            <strong>Sugestão para avaliação humana:</strong> {result.sugestao}
          </p>
          <div className="mt-5 border-t border-slate-200 pt-4">
            <p className="text-sm font-semibold text-slate-900">
              3. Registrar decisão demonstrativa
            </p>
            <p
              role="status"
              aria-live="polite"
              className="mt-1 text-sm text-slate-600"
            >
              Estado atual: {status}. Reinicia ao atualizar a página.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  setDecisions((previous) => ({
                    ...previous,
                    [selected.id]: "Encaminhado à coordenação",
                  }))
                }
                className="min-h-11 bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
              >
                Encaminhar para revisão
              </button>
              <button
                type="button"
                onClick={() =>
                  setDecisions((previous) => ({
                    ...previous,
                    [selected.id]: "Mantido em observação",
                  }))
                }
                className="min-h-11 border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
              >
                Manter em observação
              </button>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <section className="border border-slate-200 bg-white p-5">
          <h2 className="text-base font-bold text-slate-950">
            Regra demonstrativa do SADC
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Se as notificações aumentarem pelo menos 50% <strong>e</strong>{" "}
            houver pelo menos um destes sinais — cinco focos informados ou
            trinta imóveis pendentes — o território vai para revisão
            prioritária. Um critério isolado pede acompanhamento. Os valores são
            arbitrários para a aula: não são limiares oficiais, diagnóstico
            clínico ou previsão de surto.
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            Referência para o fluxo real:{" "}
            <a
              className="font-semibold text-blue-700 underline underline-offset-2"
              href="https://www.gov.br/saude/pt-br/centrais-de-conteudo/publicacoes/svsa/dengue/diretrizes_nacionais_prevencao_controle_dengue.pdf"
              target="_blank"
              rel="noreferrer"
            >
              Diretrizes Nacionais para a Prevenção e Controle de Epidemias de
              Dengue
            </a>
            . A regra e a conduta precisam de aprovação da vigilância municipal
            antes de uso operacional.
          </p>
        </section>
        <section className="border border-slate-200 bg-white p-5">
          <h2 className="text-base font-bold text-slate-950">
            Onde os dados reais entrariam
          </h2>
          <ol className="mt-3 list-inside list-decimal space-y-2 text-sm leading-6 text-slate-700">
            <li>
              Notificações agregadas do SINAN ou fonte municipal autorizada.
            </li>
            <li>
              Dados de visitas, focos e pendências aprovados pela coordenação
              ACE.
            </li>
            <li>
              Validação de qualidade, território e data de disponibilidade.
            </li>
            <li>
              Regras versionadas, revisão do epidemiologista e registro
              auditável da ação.
            </li>
          </ol>
          <p className="mt-3 border-l-4 border-amber-500 bg-amber-50 p-3 text-sm text-amber-950">
            Nenhuma dessas integrações está ativa nesta demonstração. A
            RNDS/e-SUS APS exigiria finalidade, autorização e interface técnica
            específica; não há consulta a dados de pacientes aqui.
          </p>
        </section>
      </div>
    </div>
  );
}

function Summary({
  title,
  value,
  detail,
}: {
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-600">{title}</p>
      <p className="mt-1 text-3xl font-bold text-slate-950">{value}</p>
      <p className="mt-1 text-xs text-slate-600">{detail}</p>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-slate-50 p-3">
      <dt className="text-xs leading-4 text-slate-600">{label}</dt>
      <dd className="mt-1 text-lg font-bold text-slate-950">{value}</dd>
    </div>
  );
}
