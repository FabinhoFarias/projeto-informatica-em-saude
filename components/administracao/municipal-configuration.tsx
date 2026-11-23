"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Layers3,
  Palette,
  Settings2,
} from "lucide-react";
import {
  MetricCard,
  PageHeading,
  Panel,
} from "@/components/plataforma/dashboard-ui";
import {
  municipalClientsDemo,
  municipalModuleCatalog,
  type MunicipalClientMock,
  type MunicipalModuleId,
} from "@/lib/administracao/demo-data";

const fieldClass =
  "mt-1 h-10 w-full border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

export function MunicipalConfiguration({ apiData: _apiData }: { apiData?: unknown }) {
  const [clients, setClients] = useState<MunicipalClientMock[]>(() =>
    structuredClone(municipalClientsDemo),
  );
  const [selectedId, setSelectedId] = useState(clients[0].id);
  const [notice, setNotice] = useState("");
  const selected = clients.find((client) => client.id === selectedId)!;
  const enabledModules = Object.values(selected.modules).filter(Boolean).length;
  const activeUnits = selected.units.filter((unit) => unit.active).length;

  function updateSelected(
    update: (client: MunicipalClientMock) => MunicipalClientMock,
  ) {
    setClients((current) =>
      current.map((client) =>
        client.id === selectedId ? update(client) : client,
      ),
    );
    setNotice("Alteração mantida somente nesta sessão de demonstração.");
  }

  const statusStyle =
    selected.status === "ATIVO"
      ? "bg-emerald-100 text-emerald-900"
      : "bg-amber-100 text-amber-900";
  const moduleEntries = useMemo(
    () =>
      municipalModuleCatalog.map((module) => ({
        ...module,
        enabled: selected.modules[module.id],
      })),
    [selected.modules],
  );

  function setAllModules(enabled: boolean) {
    updateSelected((client) => ({
      ...client,
      modules: Object.fromEntries(
        municipalModuleCatalog.map((module) => [module.id, enabled]),
      ) as Record<MunicipalModuleId, boolean>,
    }));
  }

  return (
    <div>
      <PageHeading
        eyebrow="Administração · configuração municipal"
        title="Clientes, unidades e módulos"
        description="Configure cada prefeitura sem duplicar o produto. Todos os dados e alterações desta tela são fictícios."
        action={
          <span
            className={`px-3 py-2 text-xs font-bold uppercase tracking-wide ${statusStyle}`}
          >
            {selected.status}
          </span>
        }
      />

      <Panel
        title="Prefeitura em configuração"
        description="A troca de cliente altera unidades, módulos, marca e parâmetros sem misturar os dados."
      >
        <label className="block max-w-xl text-xs font-semibold text-slate-700">
          Cliente / prefeitura
          <select
            value={selectedId}
            onChange={(event) => {
              setSelectedId(event.target.value);
              setNotice("");
            }}
            className={fieldClass}
          >
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name} · IBGE {client.ibgeCode}
              </option>
            ))}
          </select>
        </label>
        {notice && (
          <p
            role="status"
            className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-800"
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            {notice}
          </p>
        )}
      </Panel>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Unidades ativas"
          value={String(activeUnits)}
          detail={`${selected.units.length} unidades cadastradas`}
        />
        <MetricCard
          label="Serviços habilitados"
          value={String(enabledModules)}
          detail={`${municipalModuleCatalog.length} serviços disponíveis`}
        />
        <MetricCard
          label="Territórios"
          value={String(selected.territoryCount)}
          detail="Referências territoriais fictícias"
        />
        <MetricCard
          label="Catálogos"
          value={String(selected.catalogs.length)}
          detail="Conjuntos versionados"
        />
      </div>

      <div className="mt-4 grid items-start gap-4 xl:grid-cols-2">
        <Panel
          title="Unidades organizacionais"
          description="Secretarias, vigilâncias, laboratórios e distritos não herdam acesso automaticamente."
          action={
            <Building2 className="h-5 w-5 text-blue-700" aria-hidden="true" />
          }
        >
          <ul className="space-y-2">
            {selected.units.map((unit) => (
              <li
                key={unit.id}
                className="flex items-center justify-between gap-3 border border-slate-200 p-3"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {unit.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {unit.type.toLocaleLowerCase("pt-BR")}
                  </p>
                </div>
                <button
                  type="button"
                  aria-pressed={unit.active}
                  onClick={() =>
                    updateSelected((client) => ({
                      ...client,
                      units: client.units.map((item) =>
                        item.id === unit.id
                          ? { ...item, active: !item.active }
                          : item,
                      ),
                    }))
                  }
                  className={`min-h-9 min-w-20 px-3 text-xs font-semibold ${unit.active ? "bg-emerald-800 text-white" : "border border-slate-300 text-slate-600"}`}
                >
                  {unit.active ? "Ativa" : "Inativa"}
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          title="Serviços habilitados"
          description="Ative individualmente todos os serviços disponíveis para esta prefeitura."
          action={
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setAllModules(true)}
                className="min-h-9 border border-emerald-700 bg-white px-3 text-xs font-semibold text-emerald-800 hover:bg-emerald-50"
              >
                Habilitar todos
              </button>
              <button
                type="button"
                onClick={() => setAllModules(false)}
                className="min-h-9 border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Desabilitar todos
              </button>
              <Layers3
                className="hidden h-5 w-5 text-blue-700 sm:block"
                aria-hidden="true"
              />
            </div>
          }
        >
          <ul className="space-y-2">
            {moduleEntries.map((module) => (
              <li
                key={module.id}
                className="flex items-start justify-between gap-3 border border-slate-200 p-3"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {module.label}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {module.description}
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-slate-400">
                    {module.route}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={module.enabled}
                  aria-label={`${module.enabled ? "Desabilitar" : "Habilitar"} ${module.label}`}
                  onClick={() =>
                    updateSelected((client) => ({
                      ...client,
                      modules: {
                        ...client.modules,
                        [module.id as MunicipalModuleId]:
                          !client.modules[module.id],
                      },
                    }))
                  }
                  className={`relative mt-1 h-6 w-11 shrink-0 rounded-full transition-colors ${module.enabled ? "bg-emerald-700" : "bg-slate-300"}`}
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${module.enabled ? "left-6" : "left-1"}`}
                  />
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-4 grid items-start gap-4 xl:grid-cols-2">
        <Panel
          title="Identidade visual"
          description="Configuração de marca usada pelo mesmo shell da plataforma."
          action={
            <Palette className="h-5 w-5 text-blue-700" aria-hidden="true" />
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-700 sm:col-span-2">
              Nome curto
              <input
                value={selected.branding.shortName}
                onChange={(event) =>
                  updateSelected((client) => ({
                    ...client,
                    branding: {
                      ...client.branding,
                      shortName: event.target.value,
                    },
                  }))
                }
                className={fieldClass}
              />
            </label>
            <label className="text-xs font-semibold text-slate-700">
              Cor principal
              <input
                type="color"
                value={selected.branding.primaryColor}
                onChange={(event) =>
                  updateSelected((client) => ({
                    ...client,
                    branding: {
                      ...client.branding,
                      primaryColor: event.target.value,
                    },
                  }))
                }
                className={`${fieldClass} p-1`}
              />
            </label>
            <label className="text-xs font-semibold text-slate-700">
              Cor secundária
              <input
                type="color"
                value={selected.branding.secondaryColor}
                onChange={(event) =>
                  updateSelected((client) => ({
                    ...client,
                    branding: {
                      ...client.branding,
                      secondaryColor: event.target.value,
                    },
                  }))
                }
                className={`${fieldClass} p-1`}
              />
            </label>
            <label className="text-xs font-semibold text-slate-700 sm:col-span-2">
              Identificação da logo
              <input
                value={selected.branding.logoLabel}
                onChange={(event) =>
                  updateSelected((client) => ({
                    ...client,
                    branding: {
                      ...client.branding,
                      logoLabel: event.target.value,
                    },
                  }))
                }
                className={fieldClass}
              />
            </label>
          </div>
          <div className="mt-4 flex items-center gap-3 border border-slate-200 p-3">
            <span
              className="grid h-12 w-12 place-items-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: selected.branding.primaryColor }}
            >
              {selected.branding.shortName.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900">
                {selected.branding.shortName}
              </p>
              <p className="text-xs text-slate-500">
                {selected.branding.logoLabel}
              </p>
            </div>
          </div>
        </Panel>

        <Panel
          title="Parâmetros municipais"
          description="Valores variam por cliente e podem ter vigência futura."
          action={
            <Settings2 className="h-5 w-5 text-blue-700" aria-hidden="true" />
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-700">
              Duração do ciclo (dias)
              <input
                type="number"
                min="1"
                value={selected.parameters.cycleDays}
                onChange={(event) =>
                  updateSelected((client) => ({
                    ...client,
                    parameters: {
                      ...client.parameters,
                      cycleDays: Number(event.target.value),
                    },
                  }))
                }
                className={fieldClass}
              />
            </label>
            <label className="text-xs font-semibold text-slate-700">
              Inspeção de PE (dias)
              <input
                type="number"
                min="1"
                value={selected.parameters.strategicInspectionDays}
                onChange={(event) =>
                  updateSelected((client) => ({
                    ...client,
                    parameters: {
                      ...client.parameters,
                      strategicInspectionDays: Number(event.target.value),
                    },
                  }))
                }
                className={fieldClass}
              />
            </label>
            <label className="text-xs font-semibold text-slate-700">
              Zona padrão
              <select
                value={selected.parameters.defaultZone}
                onChange={(event) =>
                  updateSelected((client) => ({
                    ...client,
                    parameters: {
                      ...client.parameters,
                      defaultZone: event.target.value,
                    },
                  }))
                }
                className={fieldClass}
              >
                <option>Urbana</option>
                <option>Rural</option>
                <option>Mista</option>
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-700">
              Início da semana epidemiológica
              <select
                value={selected.parameters.epidemiologicalWeekStart}
                onChange={(event) =>
                  updateSelected((client) => ({
                    ...client,
                    parameters: {
                      ...client.parameters,
                      epidemiologicalWeekStart: event.target.value,
                    },
                  }))
                }
                className={fieldClass}
              >
                <option>Domingo</option>
                <option>Segunda-feira</option>
              </select>
            </label>
          </div>
        </Panel>
      </div>

      <Panel
        className="mt-4"
        title="Catálogos e territórios"
        description="Referências versionadas usadas nos formulários e relatórios; nenhuma alteração afeta outra prefeitura."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="px-3 py-2">Catálogo</th>
                <th className="px-3 py-2">Versão</th>
                <th className="px-3 py-2 text-right">Itens</th>
              </tr>
            </thead>
            <tbody>
              {selected.catalogs.map((catalog) => (
                <tr
                  key={catalog.name}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="px-3 py-3 font-medium text-slate-900">
                    {catalog.name}
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    {catalog.version}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-slate-900">
                    {catalog.items}
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
