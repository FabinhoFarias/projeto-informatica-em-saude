"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";

import { DashboardHeader } from "@/components/dashboard-header";
import { RoleProvider } from "@/components/identidade/rbac-context";
import { RouteAccess } from "@/components/identidade/route-access";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { canAccessPath, type Role } from "@/lib/identidade/permissions";
import { navigationItems } from "@/lib/plataforma/navigation";

const INITIAL_ROLE: Role = "GESTOR";

function PrototypeNotice() {
  return (
    <div
      role="note"
      className="mb-5 border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950"
    >
      <strong>Projeto PILOTO · dados fictícios.</strong> Bairros, notificações,
      probabilidades, recomendações e impactos exibidos nesta interface são
      exemplos de demonstração; não orientam condutas clínicas ou ações reais da
      prefeitura.
    </div>
  );
}

function LoggedOutState({ onResume }: { onResume: () => void }) {
  return (
    <section className="mx-auto max-w-xl border border-slate-200 bg-white p-8 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        Sessão encerrada
      </p>
      <h1 className="mt-3 text-xl font-bold text-slate-950">
        Você saiu da plataforma
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Esta demonstração não está conectada a um provedor de autenticação.
      </p>
      <button
        type="button"
        onClick={onResume}
        className="mt-5 min-h-10 bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800"
      >
        Retomar demonstração
      </button>
    </section>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [role, setRole] = useState<Role>(INITIAL_ROLE);
  const [loggedOut, setLoggedOut] = useState(false);

  const allowedNavigation = navigationItems.filter((item) =>
    canAccessPath(role, item.href),
  );

  const handleLogout = () => setLoggedOut(true);
  const handleResume = () => setLoggedOut(false);
  const expandSidebar = () => setSidebarExpanded(true);
  const collapseSidebar = () => setSidebarExpanded(false);

  return (
    <div className="min-h-[100dvh] bg-transparent text-slate-900 md:flex">
      <DashboardSidebar
        pathname={pathname}
        items={allowedNavigation}
        expanded={sidebarExpanded}
        onMouseEnter={expandSidebar}
        onMouseLeave={collapseSidebar}
      />

      <div className="min-w-0 flex-1">
        <DashboardHeader
          role={role}
          onRoleChange={setRole}
          onLogout={handleLogout}
        />

        <main className="w-full px-3 pb-24 pt-4 sm:p-6 sm:pb-6">
          {/* <PrototypeNotice /> */}

          {loggedOut ? (
            <LoggedOutState onResume={handleResume} />
          ) : (
            <RoleProvider role={role}>
              <RouteAccess>{children}</RouteAccess>
            </RoleProvider>
          )}
        </main>
      </div>
    </div>
  );
}
