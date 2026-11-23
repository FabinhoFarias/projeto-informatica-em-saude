"use client";

import { useState } from "react";
import { PageHeading, Panel } from "@/components/plataforma/dashboard-ui";

const options = [
  "Levantamento de índice",
  "Tratamento",
  "Recuperação",
  "Ponto estratégico",
];

export function CyclePlanning({ apiData: _apiData }: { apiData?: unknown }) {
  const apiCycles = Array.isArray(_apiData) ? _apiData : [];
  const municipalityName = "Lagoa de Itaenga";
  const mappedTerritories = apiCycles
    .map((cycle) => (cycle as Record<string, unknown>).territories)
    .flatMap((territories) => (Array.isArray(territories) ? territories : []))
    .map((item) => ({ id: String(item), name: String(item) }));
  const [name, setName] = useState("Ciclo operacional 2026.2");
  const [start, setStart] = useState("2026-06-01");
  const [end, setEnd] = useState("2026-07-31");
  const [activities, setActivities] = useState(options.slice(0, 3));
  const [published, setPublished] = useState(false);
  const [actionName, setActionName] = useState("");
  const [actionActivity, setActionActivity] = useState(options[0]);
  const [actionTerritories, setActionTerritories] = useState<string[]>([]);
  const [actions, setActions] = useState<
    Array<{ name: string; activity: string; territories: string[] }>
  >([]);
  const toggle = (activity: string) =>
    setActivities((current) =>
      current.includes(activity)
        ? current.filter((item) => item !== activity)
        : [...current, activity],
    );
  const toggleTerritory = (territory: string) =>
    setActionTerritories((current) =>
      current.includes(territory)
        ? current.filter((item) => item !== territory)
        : [...current, territory],
    );
  const addAction = () => {
    if (!actionName.trim() || actionTerritories.length === 0) return;
    setActions((current) => [
      ...current,
      {
        name: actionName.trim(),
        activity: actionActivity,
        territories: actionTerritories,
      },
    ]);
    setActionName("");
    setActionTerritories([]);
  };
  return (
    <div>
      <PageHeading
        eyebrow={`${municipalityName} · gestão operacional`}
        title="Planejamento por ciclo"
        description="Organize um único ciclo com várias atividades, territórios e ACEs antes da publicação do trabalho de campo."
      />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <Panel
          title="Configuração do ciclo"
          description="As atividades ocorrem dentro do mesmo ciclo e podem compartilhar os imóveis atribuídos."
        >
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-slate-700">
              Nome
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1 min-h-10 w-full border border-slate-300 px-3 font-normal"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">
                Início
                <input
                  type="date"
                  value={start}
                  onChange={(event) => setStart(event.target.value)}
                  className="mt-1 min-h-10 w-full border border-slate-300 px-3 font-normal"
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Fim
                <input
                  type="date"
                  value={end}
                  onChange={(event) => setEnd(event.target.value)}
                  className="mt-1 min-h-10 w-full border border-slate-300 px-3 font-normal"
                />
              </label>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700">
                Atividades deste ciclo
              </p>
              <div className="space-y-2">
                {options.map((activity) => (
                  <label
                    key={activity}
                    className="flex items-center gap-2 border border-slate-200 bg-slate-50 p-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={activities.includes(activity)}
                      onChange={() => toggle(activity)}
                      className="h-4 w-4 accent-emerald-800"
                    />
                    {activity}
                  </label>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPublished(true)}
              className="min-h-10 w-full bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-900"
            >
              {published ? "Ciclo publicado para os ACEs" : "Publicar ciclo"}
            </button>
            <div className="border-t border-slate-200 pt-4">
              <p className="mb-1 text-sm font-semibold text-slate-700">
                Ações específicas por bairro
              </p>
              <p className="mb-3 text-xs leading-5 text-slate-500">
                Crie uma ação direcionada a um ou mais bairros dentro deste
                mesmo ciclo.
              </p>
              <div className="space-y-3">
                <input
                  value={actionName}
                  onChange={(event) => setActionName(event.target.value)}
                  placeholder="Ex.: Mutirão de recuperação"
                  className="min-h-10 w-full border border-slate-300 px-3 text-sm"
                />
                <select
                  value={actionActivity}
                  onChange={(event) => setActionActivity(event.target.value)}
                  className="min-h-10 w-full border border-slate-300 bg-white px-3 text-sm"
                >
                  {options.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
                <div className="grid max-h-32 gap-2 overflow-y-auto sm:grid-cols-2">
                  {mappedTerritories.slice(0, 12).map((territory) => (
                    <label
                      key={territory.id}
                      className="flex items-center gap-2 text-xs text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={actionTerritories.includes(territory.name)}
                        onChange={() => toggleTerritory(territory.name)}
                        className="h-4 w-4 accent-emerald-800"
                      />
                      {territory.name}
                    </label>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addAction}
                  disabled={
                    !actionName.trim() || actionTerritories.length === 0
                  }
                  className="min-h-9 w-full border border-emerald-800 px-3 text-xs font-semibold text-emerald-800 enabled:hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Adicionar ação ao ciclo
                </button>
              </div>
            </div>
          </div>
        </Panel>
        <Panel
          title={published ? "Ciclo publicado" : "Revisão antes da publicação"}
          description="Confira o escopo e as atribuições que serão disponibilizadas aos agentes."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="border border-slate-200 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Período
              </p>
              <p className="mt-2 font-semibold text-slate-950">
                {start} a {end}
              </p>
            </div>
            <div className="border border-slate-200 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Atividades
              </p>
              <p className="mt-2 font-semibold text-slate-950">
                {activities.length} no mesmo ciclo
              </p>
            </div>
          </div>
          <div className="mt-4">
            <p className="mb-2 text-sm font-semibold text-slate-700">
              Territórios atribuídos
            </p>
            <div className="flex flex-wrap gap-2">
              {mappedTerritories.slice(0, 8).map((territory) => (
                <span
                  key={territory.id}
                  className="border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800"
                >
                  {territory.name}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-5 border-t border-slate-200 pt-4">
            <p className="mb-2 text-sm font-semibold text-slate-700">
              Ações específicas ({actions.length})
            </p>
            {actions.length === 0 ? (
              <p className="text-xs text-slate-500">
                Nenhuma ação específica criada ainda.
              </p>
            ) : (
              <div className="space-y-2">
                {actions.map((action, index) => (
                  <div
                    key={`${action.name}-${index}`}
                    className="border border-emerald-200 bg-emerald-50 p-3"
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {action.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      {action.activity} · {action.territories.join(", ")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <p className="mt-5 border-l-4 border-amber-500 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
            No ciclo, levantamento, tratamento, recuperação e pontos
            estratégicos podem acontecer em conjunto. A ordem e o registro de
            cada atividade continuam separados na ficha da visita.
          </p>
        </Panel>
      </div>
    </div>
  );
}
