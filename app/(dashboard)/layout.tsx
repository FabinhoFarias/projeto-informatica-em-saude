import { Suspense, type ReactNode } from "react";
import { DashboardShell } from "@/components/plataforma/dashboard-shell";

// O painel depende da API em tempo de requisição e não deve ser pré-renderizado.
export const instant = false;

function DashboardLoading() {
  return (
    <div
      role="status"
      aria-label="Carregando painel"
      className="min-h-[100dvh] bg-background-color"
    >
      <div className="h-16 border-b border-color-border bg-white sm:h-[8vh]" />
      <div className="p-4 sm:p-6">
        <div className="h-24 animate-pulse bg-slate-200" />
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="dashboard-layout">
      <Suspense fallback={<DashboardLoading />}>
        <DashboardShell>{children}</DashboardShell>
      </Suspense>
    </div>
  );
}
