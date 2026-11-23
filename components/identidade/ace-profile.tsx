"use client";

import Link from "next/link";
import Image from "next/image";
import {
  PageHeading,
  Panel,
  MetricCard,
} from "@/components/plataforma/dashboard-ui";
import { VisitsWorkspace } from "@/components/visitas/visits-workspace";
import type { SectorPropertyMock } from "@/lib/visitas/demo-data";

export function AceProfile({ ace, history, properties }: {
  ace: { id: string; nome: string; status: string; funcao: string } | null;
  history: { visitados: number; atribuidos: number; pendentes: number; cobertura: number; retornos: unknown[] };
  properties: SectorPropertyMock[];
}) {
  if (!ace)
    return (
      <div className="border border-red-200 bg-red-50 p-5 text-sm text-red-800">
        ACE não encontrado.
      </div>
    );
  const stats = { assigned: history.atribuidos, visited: history.visitados, coverage: history.cobertura, pending: history.pendentes };
  const target = 80;
  const coverageBand =
    stats.coverage >= target
      ? "Dentro da meta"
      : stats.coverage >= 60
        ? "Em atenção"
        : "Crítica";
  const bandStyle =
    stats.coverage >= target
      ? "bg-emerald-100 text-emerald-800"
      : stats.coverage >= 60
        ? "bg-amber-100 text-amber-800"
        : "bg-red-100 text-red-800";
  return (
    <div>
      <PageHeading
        eyebrow="Gestão de campo · perfil do ACE"
        title={ace.nome}
        description="Histórico operacional, cobertura territorial e registros do ciclo selecionado."
        action={
          <Link
            href="/painel"
            className="border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Voltar ao painel
          </Link>
        }
      />
      <section className="mb-5 flex flex-wrap items-center gap-4 border border-slate-200 bg-white p-5">
        <Image
          src={
            "https://randomuser.me/api/portraits/men/32.jpg"
          }
          alt={`Foto de ${ace.nome}`}
          width={72}
          height={72}
          className="h-[72px] w-[72px] rounded-full object-cover"
        />
        <div>
          <h2 className="text-xl font-bold text-slate-950">{ace.nome}</h2>
          <p className="text-sm text-slate-600">
            Operação de campo · Lagoa de Itaenga
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Última sincronização: via API · Status:{" "}
            {ace.status}
          </p>
        </div>
      </section>
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Imóveis atribuídos"
          value={String(stats.assigned)}
          detail="No ciclo atual"
        />
        <MetricCard
          label="Imóveis visitados"
          value={String(stats.visited)}
          detail="Registros concluídos"
        />
        <MetricCard
          label="Cobertura"
          value={`${stats.coverage}%`}
          detail="Da área atribuída"
        />
        <MetricCard
          label="Pendências"
          value={String(stats.pending)}
          detail="Retornos ou não visitados"
        />
      </div>
      <Panel
        className="mb-5"
        title="Indicador de cobertura do ciclo"
        description="Cobertura calculada sobre os imóveis válidos atribuídos ao ACE no ciclo atual."
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-4xl font-bold text-slate-950">
              {stats.coverage}%
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {stats.visited} de {stats.assigned} imóveis visitados
            </p>
          </div>
          <span className={`px-3 py-1 text-xs font-bold ${bandStyle}`}>
            {coverageBand}
          </span>
        </div>
        <div className="mt-4 h-4 overflow-hidden rounded-full bg-slate-200">
          <div
            className={`h-full ${stats.coverage >= target ? "bg-emerald-700" : stats.coverage >= 60 ? "bg-amber-500" : "bg-red-500"}`}
            style={{ width: `${stats.coverage}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-slate-500">
          <span>0%</span>
          <span>Meta municipal: {target}%</span>
          <span>100%</span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="border border-slate-200 p-3">
            <p className="text-xs text-slate-500">Diferença para meta</p>
            <p className="mt-1 font-bold text-slate-900">
              {Math.max(0, target - stats.coverage)} p.p.
            </p>
          </div>
          <div className="border border-slate-200 p-3">
            <p className="text-xs text-slate-500">Retornos/recusas</p>
            <p className="mt-1 font-bold text-slate-900">12</p>
          </div>
          <div className="border border-slate-200 p-3">
            <p className="text-xs text-slate-500">Ritmo médio</p>
            <p className="mt-1 font-bold text-slate-900">18/dia</p>
          </div>
        </div>
      </Panel>
      <section className="mb-5 border-t border-slate-300 pt-5">
        <VisitsWorkspace
          eyebrow={`Operação acompanhada · ${ace.nome}`}
          title="Imóveis e visitas do ACE"
          description="A mesma visão operacional usada pelo ACE: ciclo, quarteirão, rua, situação da visita e acesso à ficha do imóvel."
          properties={properties}
        />
      </section>
      <div className="max-w-2xl">
        <Panel
          className="min-w-0 overflow-hidden"
          title="Atividades habilitadas"
          description="Funções operacionais atribuídas ao usuário."
        >
          <div className="w-full overflow-x-auto overscroll-x-contain">
            <div className="min-w-[280px] space-y-2">
              {[ace.funcao || "CAMPO"].map((item) => (
                <div
                  key={item}
                  className="break-words border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700"
                >
                  {item === "CAMPO"
                    ? "Operação de campo"
                    : item === "LARVICIDA"
                      ? "Aplicação de larvicida"
                      : item === "LABORATORIO"
                        ? "Laboratório / amostras"
                        : item === "DIGITACAO"
                          ? "Digitação de fichas"
                          : "Pontos estratégicos"}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-5 border-l-4 border-amber-500 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
            A gestão pode conferir os registros, solicitar retorno e
            redistribuir atividades. Os dados desta demonstração são mockados.
          </div>
        </Panel>
      </div>
    </div>
  );
}
