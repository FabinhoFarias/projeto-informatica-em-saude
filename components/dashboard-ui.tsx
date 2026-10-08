import type { CSSProperties, ReactNode } from "react";
import { riskColors, type RiskLevel } from "@/lib/dashboard-data";

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  const colors = riskColors[risk];

  return (
    <span
      className="inline-flex items-center gap-2 px-2.5 py-1 text-xs font-semibold"
      style={{ color: colors.foreground, backgroundColor: colors.background }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: colors.foreground }} />
      {risk}
    </span>
  );
}

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">{eyebrow}</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function Panel({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`border border-slate-200 bg-white ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="font-semibold text-slate-950">{title}</h2>
          {description && <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function MetricCard({
  label,
  value,
  detail,
  trend,
}: {
  label: string;
  value: string;
  detail: string;
  trend?: string;
}) {
  return (
    <article className="border border-slate-200 bg-white p-5">
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <div className="mt-3 flex items-baseline justify-between gap-2">
        <p className="text-3xl font-bold tracking-tight text-slate-950">{value}</p>
        {trend && <span className="text-xs font-semibold text-blue-700">{trend}</span>}
      </div>
      <p className="mt-2 text-xs text-slate-500">{detail}</p>
    </article>
  );
}

export function RiskText({ risk }: { risk: RiskLevel }) {
  const colors = riskColors[risk];
  return <span style={{ color: colors.foreground } as CSSProperties}>{risk}</span>;
}
