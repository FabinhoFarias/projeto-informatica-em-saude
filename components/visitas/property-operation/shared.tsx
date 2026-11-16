import type { SectorPropertyMock } from "@/lib/visitas/demo-data";
import type { TimelineItem } from "./types";

export function formatDateBr(date?: string) {
  if (!date) return "Data não informada";
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

export function addDays(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days))
    .toISOString()
    .slice(0, 10);
}

export function initialTimeline(property: SectorPropertyMock): TimelineItem[] {
  const visit = property.ultimaVisita;
  if (!visit)
    return [
      {
        id: "sem-visita",
        date: "",
        title: "Nenhuma tentativa neste ciclo",
        description: "O imóvel permanece na fila de trabalho do ACE.",
        tone: "neutral",
      },
    ];
  const pending = visit.acesso !== "REALIZADO";
  const title =
    visit.acesso === "RECUSA"
      ? "Recusa registrada"
      : visit.acesso === "FECHADO"
        ? "Imóvel fechado"
        : "Visita realizada";
  return [
    {
      id: visit.id,
      date: visit.dataAtividade,
      title,
      description: visit.formulario.observacoes,
      tone: pending ? "warning" : "success",
    },
    ...(pending
      ? [
          {
            id: `${visit.id}-retorno`,
            date: addDays(visit.dataAtividade, 2),
            title: "Retorno programado",
            description: "Recuperação preparada para nova tentativa do ACE.",
            tone: "neutral" as const,
          },
        ]
      : visit.formulario.tipoVisita === "R"
        ? [
            {
              id: `${visit.id}-recuperado`,
              date: visit.dataAtividade,
              title: "Recuperação concluída",
              description: "Retorno vinculado à tentativa anterior.",
              tone: "success" as const,
            },
          ]
        : []),
  ];
}

export function OperationalSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-200 px-4 py-3 sm:px-5">
        <h2 className="text-base font-bold text-slate-950">{title}</h2>
        {description && (
          <p className="mt-1 text-xs leading-5 text-slate-600">{description}</p>
        )}
      </header>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}
