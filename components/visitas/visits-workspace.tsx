"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  FileText,
  House,
  List,
  Map,
  MapPinned,
  Navigation,
  Search,
  Send,
  Signal,
} from "lucide-react";
import { PageHeading } from "@/components/plataforma/dashboard-ui";
import {
  sectorPropertiesDemo,
  type FieldVisitMock,
  type SectorPropertyMock,
} from "@/lib/visitas/demo-data";

type VisitFilter = "TODOS" | "A_VISITAR" | "ENVIADA" | "PENDENTE";
type ViewMode = "mapa" | "lista" | "relatorio";

function visitStatus(property: SectorPropertyMock) {
  if (!property.ultimaVisita) return "A_VISITAR";
  return property.ultimaVisita.operacaoSync.status === "RECEBIDA"
    ? "ENVIADA"
    : "PENDENTE";
}

function statusLabel(status: ReturnType<typeof visitStatus>) {
  if (status === "ENVIADA") return "Visita enviada";
  if (status === "PENDENTE") return "Envio pendente";
  return "A visitar";
}

function formatDate(value: string) {
  const date = value.includes("T") ? value : `${value}T12:00:00`;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function StatCard({
  label,
  value,
  detail,
  icon,
  tone,
}: {
  label: string;
  value: number;
  detail: string;
  icon: React.ReactNode;
  tone: string;
}) {
  return (
    <article className="flex items-start gap-3 border border-slate-200 bg-white p-4">
      <span className={`grid h-10 w-10 shrink-0 place-items-center ${tone}`}>
        {icon}
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <p className="mt-1 text-2xl font-bold text-slate-950">{value}</p>
        <p className="mt-1 text-xs text-slate-500">{detail}</p>
      </div>
    </article>
  );
}

function SchematicSectorMap({
  properties,
  selectedId,
  onSelect,
}: {
  properties: SectorPropertyMock[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="relative min-h-[390px] overflow-hidden bg-[#e8f0eb] sm:min-h-[470px]">
      <svg
        viewBox="0 0 800 500"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <rect width="800" height="500" fill="#e8f0eb" />
        <path
          d="M56 42L735 20 776 432 94 476Z"
          fill="#d5ead9"
          stroke="#438568"
          strokeDasharray="9 7"
          strokeWidth="3"
        />
        <path
          d="M-20 142L820 101M-20 340L820 382M229-20L270 530M560-20L521 530"
          fill="none"
          stroke="#fff"
          strokeWidth="27"
        />
        <path
          d="M-20 142L820 101M-20 340L820 382M229-20L270 530M560-20L521 530"
          fill="none"
          stroke="#c5d3ca"
          strokeWidth="2"
        />
        <path
          d="M126 44L148 472M425 24L405 492M681 28L658 450M70 244L758 225"
          fill="none"
          stroke="#fff"
          strokeDasharray="5 7"
          strokeWidth="9"
        />
        <g
          fontFamily="Arial, sans-serif"
          fontSize="12"
          fill="#60736b"
          fontWeight="700"
          letterSpacing="2"
        >
          <text x="281" y="71">
            QUARTEIRÃO 01
          </text>
          <text x="548" y="304">
            QUARTEIRÃO 02
          </text>
          <text x="80" y="465">
            SETOR 02 · CENTRO
          </text>
        </g>
      </svg>
      <div className="absolute left-3 top-3 flex items-center gap-2 border border-white bg-white/95 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm">
        <MapPinned className="h-4 w-4 text-emerald-800" aria-hidden="true" />
        Mapa esquemático do setor
      </div>
      {properties.map((property) => {
        const status = visitStatus(property);
        const active = property.id === selectedId;
        const color =
          status === "ENVIADA"
            ? "bg-emerald-700"
            : status === "PENDENTE"
              ? "bg-amber-500"
              : "bg-slate-600";
        return (
          <button
            key={property.id}
            type="button"
            onClick={() => onSelect(property.id)}
            aria-pressed={active}
            aria-label={`${property.codigoLocal}: ${statusLabel(status)}`}
            className={`absolute z-10 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white text-white shadow-md transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950 ${color} ${active ? "ring-2 ring-slate-950 ring-offset-2" : ""}`}
            style={{
              left: `${property.pontoMapa.x}%`,
              top: `${property.pontoMapa.y}%`,
            }}
          >
            {status === "ENVIADA" ? (
              <Check className="h-4 w-4" aria-hidden="true" />
            ) : (
              <span className="text-xs font-bold">
                {property.sequenciaPercurso}
              </span>
            )}
          </button>
        );
      })}
      <div className="absolute bottom-3 left-3 flex flex-wrap gap-3 border border-white bg-white/95 px-3 py-2 text-[11px] font-medium text-slate-700 shadow-sm">
        <span className="flex items-center gap-1.5">
          <i className="h-2.5 w-2.5 rounded-full bg-slate-600" /> A visitar
        </span>
        <span className="flex items-center gap-1.5">
          <i className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Envio pendente
        </span>
        <span className="flex items-center gap-1.5">
          <i className="grid h-3 w-3 place-items-center rounded-full bg-emerald-700 text-white">
            <Check className="h-2 w-2" aria-hidden="true" />
          </i>
          Recebida pelo sistema
        </span>
      </div>
    </div>
  );
}

function PropertyRow({
  property,
  selected,
  onSelect,
}: {
  property: SectorPropertyMock;
  selected: boolean;
  onSelect: () => void;
}) {
  const status = visitStatus(property);
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`w-full border-b border-slate-100 p-4 text-left transition-colors hover:bg-slate-50 ${selected ? "bg-emerald-50" : "bg-white"}`}
    >
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="block truncate font-semibold text-slate-950">
            {property.logradouro}, {property.numero}
            {property.complemento ? ` · ${property.complemento}` : ""}
          </span>
          <span className="mt-1 block font-mono text-xs text-slate-500">
            {property.codigoLocal}
          </span>
        </span>
        <span
          className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${status === "ENVIADA" ? "bg-emerald-100 text-emerald-900" : status === "PENDENTE" ? "bg-amber-100 text-amber-900" : "bg-slate-100 text-slate-700"}`}
        >
          {statusLabel(status)}
        </span>
      </span>
      <span className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
        <span>
          {property.quarteirao} · Lado {property.lado === "NORTE" ? "N" : "S"}
        </span>
        <span>Sequência {property.sequenciaPercurso}</span>
        <span>{property.tipo.toLowerCase()}</span>
      </span>
    </button>
  );
}

export function VisitsWorkspace() {
  const [properties, setProperties] =
    useState<SectorPropertyMock[]>(sectorPropertiesDemo);
  const [selectedId, setSelectedId] = useState(sectorPropertiesDemo[0].id);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<VisitFilter>("TODOS");
  const [viewMode, setViewMode] = useState<ViewMode>("mapa");
  const [message, setMessage] = useState("");

  const counts = useMemo(
    () => ({
      total: properties.length,
      sent: properties.filter((property) => visitStatus(property) === "ENVIADA")
        .length,
      toVisit: properties.filter(
        (property) => visitStatus(property) === "A_VISITAR",
      ).length,
      pending: properties.filter(
        (property) => visitStatus(property) === "PENDENTE",
      ).length,
    }),
    [properties],
  );

  const visibleProperties = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return properties.filter((property) => {
      const matchesSearch = [
        property.codigoLocal,
        property.logradouro,
        property.numero,
        property.complemento ?? "",
        property.quarteirao,
      ].some((value) => value.toLocaleLowerCase("pt-BR").includes(term));
      const status = visitStatus(property);
      const matchesFilter =
        filter === "TODOS" ||
        (filter === "A_VISITAR" && status === "A_VISITAR") ||
        (filter === "ENVIADA" && status === "ENVIADA") ||
        (filter === "PENDENTE" && status === "PENDENTE");
      return matchesSearch && matchesFilter;
    });
  }, [filter, properties, search]);

  const selectedProperty =
    visibleProperties.find((property) => property.id === selectedId) ??
    visibleProperties[0] ??
    null;

  const registerOrSyncVisit = () => {
    if (!selectedProperty) return;
    const now = new Date();
    const timestamp = now.toISOString();
    const date = timestamp.slice(0, 10);
    const existingVisit = selectedProperty.ultimaVisita;

    setProperties((current) =>
      current.map((property) => {
        if (property.id !== selectedProperty.id) return property;
        if (existingVisit) {
          return {
            ...property,
            ultimaVisita: {
              ...existingVisit,
              operacaoSync: {
                ...existingVisit.operacaoSync,
                status: "RECEBIDA",
                recebidaEm: timestamp,
              },
            },
          };
        }

        const newVisit: FieldVisitMock = {
          id: crypto.randomUUID(),
          revisaoId: crypto.randomUUID(),
          jornadaId: "20000000-0000-4000-8000-000000000002",
          itemPlanejamentoId: crypto.randomUUID(),
          modalidadeVersaoId: "40000000-0000-4000-8000-000000000001",
          autorId: "50000000-0000-4000-8000-000000000002",
          dataAtividade: date,
          lancadaEm: timestamp,
          acesso: "REALIZADO",
          statusConteudo: "CONCLUIDO",
          posicao: {
            latitude: property.coordenadas.latitude,
            longitude: property.coordenadas.longitude,
            origem: "CADASTRO_DEMO",
            precisaoMetros: 12,
          },
          operacaoSync: {
            id: crypto.randomUUID(),
            operationUuid: crypto.randomUUID(),
            deviceId: "ACE-DEMO-02",
            baseVersion: 1,
            status: "RECEBIDA",
            recebidaEm: timestamp,
          },
        };
        return { ...property, ultimaVisita: newVisit };
      }),
    );
    setMessage(
      existingVisit
        ? `Envio da visita ${existingVisit.id} confirmado pelo sistema.`
        : "Visita registrada e recebida pelo sistema. Os dados permanecem somente nesta demonstração.",
    );
  };

  const selectedStatus = selectedProperty
    ? visitStatus(selectedProperty)
    : "A_VISITAR";
  const syncPending = selectedStatus === "PENDENTE";

  return (
    <div>
      <PageHeading
        eyebrow="Operação de campo · ACE"
        title="Meu setor"
        description="Consulte os imóveis do seu percurso, confira a localização e acompanhe o estado de cada visita e envio."
        action={
          <div className="flex items-center gap-2 border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900">
            <Navigation className="h-4 w-4" aria-hidden="true" />
            Setor 02 · Centro
          </div>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Imóveis no setor"
          value={counts.total}
          detail="Percurso completo atribuído"
          icon={<House className="h-5 w-5" aria-hidden="true" />}
          tone="bg-slate-100 text-slate-700"
        />
        <StatCard
          label="A visitar"
          value={counts.toVisit}
          detail="Sem visita registrada"
          icon={<MapPinned className="h-5 w-5" aria-hidden="true" />}
          tone="bg-slate-100 text-slate-700"
        />
        <StatCard
          label="Recebidas pelo sistema"
          value={counts.sent}
          detail="Visita e sincronização confirmadas"
          icon={<CheckCircle2 className="h-5 w-5" aria-hidden="true" />}
          tone="bg-emerald-100 text-emerald-800"
        />
        <StatCard
          label="Envio pendente"
          value={counts.pending}
          detail="Registradas, aguardando sincronização"
          icon={<Clock3 className="h-5 w-5" aria-hidden="true" />}
          tone="bg-amber-100 text-amber-800"
        />
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(340px,0.8fr)]">
        <section className="min-w-0 border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-slate-950">
                  Imóveis do percurso
                </h2>
                <p className="mt-1 text-xs text-slate-600">
                  {visibleProperties.length} de {properties.length} imóveis ·
                  sequência territorial
                </p>
              </div>
              <div
                role="group"
                aria-label="Modo de visualização dos imóveis"
                className="flex border border-slate-200 p-1"
              >
                <button
                  type="button"
                  aria-pressed={viewMode === "mapa"}
                  onClick={() => setViewMode("mapa")}
                  className={`flex min-h-9 items-center gap-2 px-3 text-xs font-semibold ${viewMode === "mapa" ? "bg-emerald-800 text-white" : "text-slate-700 hover:bg-slate-100"}`}
                >
                  <Map className="h-4 w-4" aria-hidden="true" />
                  Mapa
                </button>
                <button
                  type="button"
                  aria-pressed={viewMode === "lista"}
                  onClick={() => setViewMode("lista")}
                  className={`flex min-h-9 items-center gap-2 px-3 text-xs font-semibold ${viewMode === "lista" ? "bg-emerald-800 text-white" : "text-slate-700 hover:bg-slate-100"}`}
                >
                  <List className="h-4 w-4" aria-hidden="true" />
                  Lista
                </button>
                <button
                  type="button"
                  aria-pressed={viewMode === "relatorio"}
                  onClick={() => setViewMode("relatorio")}
                  className={`flex min-h-9 items-center gap-2 px-3 text-xs font-semibold ${viewMode === "relatorio" ? "bg-emerald-800 text-white" : "text-slate-700 hover:bg-slate-100"}`}
                >
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  Relatório
                </button>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_190px]">
              <label className="relative block">
                <span className="sr-only">Buscar imóvel</span>
                <Search
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Código, rua, número ou quarteirão"
                  className="h-10 w-full border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                />
              </label>
              <label>
                <span className="sr-only">Filtrar por estado da visita</span>
                <select
                  value={filter}
                  onChange={(event) =>
                    setFilter(event.target.value as VisitFilter)
                  }
                  className="h-10 w-full border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="TODOS">Todos os estados</option>
                  <option value="A_VISITAR">A visitar</option>
                  <option value="ENVIADA">Visita enviada</option>
                  <option value="PENDENTE">Envio pendente</option>
                </select>
              </label>
            </div>
          </div>

          {viewMode === "mapa" ? (
            <SchematicSectorMap
              properties={visibleProperties}
              selectedId={selectedProperty?.id ?? ""}
              onSelect={setSelectedId}
            />
          ) : viewMode === "relatorio" ? (
            <div className="bg-slate-100 p-3 sm:p-5">
              <div className="mb-3 flex items-center justify-between gap-3 text-xs text-slate-600">
                <span>
                  Pré-visualização vertical para preenchimento do ACE.
                </span>
                <a
                  href="/relatorios/resumo-diario-servico-antivetorial.html"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-emerald-800 underline"
                >
                  Abrir para imprimir
                </a>
              </div>
              <iframe
                title="Resumo diário do serviço antivetorial"
                src="/relatorios/resumo-diario-servico-antivetorial.html"
                className="h-[820px] w-full border border-slate-300 bg-white"
              />
            </div>
          ) : (
            <div className="max-h-[470px] overflow-y-auto">
              {visibleProperties.map((property) => (
                <PropertyRow
                  key={property.id}
                  property={property}
                  selected={property.id === selectedProperty?.id}
                  onSelect={() => setSelectedId(property.id)}
                />
              ))}
              {visibleProperties.length === 0 && (
                <p className="p-8 text-center text-sm text-slate-600">
                  Nenhum imóvel encontrado para esta busca e filtro.
                </p>
              )}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-4 py-3 text-xs text-slate-600">
            <span className="flex items-center gap-2">
              <Signal className="h-4 w-4 text-emerald-700" aria-hidden="true" />
              Percurso disponível neste dispositivo
            </span>
            <span>Atualizado em 10 nov. 2026 · ciclo demonstrativo</span>
          </div>
        </section>

        <aside className="space-y-4">
          {selectedProperty ? (
            <>
              <section className="border border-slate-200 bg-white">
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-4">
                  <div>
                    <p className="font-mono text-xs font-semibold text-emerald-800">
                      {selectedProperty.codigoLocal}
                    </p>
                    <h2 className="mt-1 text-lg font-bold text-slate-950">
                      {selectedProperty.logradouro}, {selectedProperty.numero}
                    </h2>
                    {selectedProperty.complemento && (
                      <p className="mt-1 text-sm text-slate-600">
                        {selectedProperty.complemento}
                      </p>
                    )}
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-bold ${selectedStatus === "ENVIADA" ? "bg-emerald-100 text-emerald-900" : selectedStatus === "PENDENTE" ? "bg-amber-100 text-amber-900" : "bg-slate-100 text-slate-700"}`}
                  >
                    {statusLabel(selectedStatus)}
                  </span>
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-4 p-4 text-sm">
                  <div>
                    <dt className="text-xs text-slate-500">Setor / percurso</dt>
                    <dd className="mt-1 font-semibold text-slate-800">
                      {selectedProperty.setor} ·{" "}
                      {selectedProperty.sequenciaPercurso}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">
                      Quarteirão / lado
                    </dt>
                    <dd className="mt-1 font-semibold text-slate-800">
                      {selectedProperty.quarteirao} ·{" "}
                      {selectedProperty.lado === "NORTE" ? "Norte" : "Sul"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Tipo de imóvel</dt>
                    <dd className="mt-1 font-semibold text-slate-800">
                      {selectedProperty.tipo.toLowerCase()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Cadastro</dt>
                    <dd className="mt-1 font-semibold text-slate-800">
                      {selectedProperty.situacaoCadastral === "ATIVO"
                        ? "Ativo"
                        : "Em conferência"}
                    </dd>
                  </div>
                </dl>
                <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-600">
                  <span className="flex items-center gap-2">
                    <MapPinned
                      className="h-4 w-4 text-emerald-800"
                      aria-hidden="true"
                    />
                    Coordenada fictícia:{" "}
                    {selectedProperty.coordenadas.latitude.toFixed(4)},{" "}
                    {selectedProperty.coordenadas.longitude.toFixed(4)}
                  </span>
                </div>
              </section>

              <section className="border border-slate-200 bg-white p-4">
                <h2 className="font-bold text-slate-950">
                  Última visita conhecida
                </h2>
                {selectedProperty.ultimaVisita ? (
                  <div className="mt-3 border-l-2 border-emerald-600 pl-3">
                    <p className="text-sm font-semibold text-slate-800">
                      Atividade em{" "}
                      {formatDate(selectedProperty.ultimaVisita.dataAtividade)}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      {selectedProperty.ultimaVisita.operacaoSync.status ===
                      "RECEBIDA"
                        ? `Recebida pelo sistema em ${formatDate(selectedProperty.ultimaVisita.operacaoSync.recebidaEm ?? selectedProperty.ultimaVisita.lancadaEm)}.`
                        : "Visita registrada neste dispositivo; envio ao sistema pendente."}
                    </p>
                    <p className="mt-2 break-all font-mono text-[10px] text-slate-400">
                      visita_id · {selectedProperty.ultimaVisita.id}
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Nenhuma visita recebida. Isso não significa que o agente não
                    tenha trabalhado offline.
                  </p>
                )}
                {selectedStatus !== "ENVIADA" ? (
                  <button
                    type="button"
                    onClick={registerOrSyncVisit}
                    className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-900"
                  >
                    {syncPending ? (
                      <>
                        <Send className="h-4 w-4" aria-hidden="true" />
                        Enviar dados pendentes
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        Registrar visita e enviar
                      </>
                    )}
                  </button>
                ) : (
                  <p className="mt-4 flex min-h-11 items-center justify-center gap-2 border border-emerald-200 bg-emerald-50 px-3 text-sm font-semibold text-emerald-900">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    Visita recebida pelo sistema
                  </p>
                )}
                {message && (
                  <p
                    role="status"
                    className="mt-3 border-l-2 border-emerald-700 bg-emerald-50 p-3 text-xs leading-5 text-emerald-950"
                  >
                    {message}
                  </p>
                )}
              </section>

              <section className="border border-amber-200 bg-amber-50 p-4">
                <h2 className="text-sm font-bold text-amber-950">
                  Demonstração acadêmica
                </h2>
                <p className="mt-1 text-xs leading-5 text-amber-900">
                  Imóveis, visitas, códigos e coordenadas são fictícios. O
                  registro e a confirmação de envio são simulados no navegador,
                  sem conexão com servidor ou GPS real.
                </p>
              </section>
            </>
          ) : (
            <section className="border border-slate-200 bg-white p-6 text-sm text-slate-600">
              Selecione um imóvel para consultar sua ficha.
            </section>
          )}
          <p className="flex items-center gap-2 text-xs text-slate-500">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            Ciclo demonstrativo · 01 a 30 nov. 2026
          </p>
        </aside>
      </div>
    </div>
  );
}
