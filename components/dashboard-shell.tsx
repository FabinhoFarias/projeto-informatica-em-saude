"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { navigationItems, riskColors, municipality } from "@/lib/dashboard-data";
import { canAccessPath, roleLabels, type Role, roles } from "@/lib/rbac";
import { RoleProvider } from "@/components/rbac-context";
import { RouteAccess } from "@/components/route-access";

function ProfileActions({
  id,
  role,
  onRoleChange,
  onLogout,
}: {
  id: string;
  role: Role;
  onRoleChange: (role: Role) => void;
  onLogout: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center bg-slate-100 text-xs font-bold text-slate-700">MS</div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900">Mariana Santos</p>
        <label className="sr-only" htmlFor={id}>Perfil de demonstração</label>
        <select id={id} value={role} onChange={(event) => onRoleChange(event.target.value as Role)} className="mt-1 max-w-full border-0 bg-transparent p-0 text-[11px] text-slate-500 outline-none">
          {roles.map((item) => <option key={item} value={item}>{roleLabels[item]}</option>)}
        </select>
      </div>
      <button type="button" onClick={onLogout} aria-label="Sair da plataforma" title="Sair" className="ml-auto grid h-9 w-9 shrink-0 place-items-center text-slate-500 hover:bg-slate-100 hover:text-slate-900">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
          <path d="M10 17l5-5-5-5m5 5H3m9-9h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
        </svg>
      </button>
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState(false);
  const [role, setRole] = useState<Role>("GESTOR");
  const [loggedOut, setLoggedOut] = useState(false);
  const allowedNavigation = navigationItems.filter((item) => canAccessPath(role, item.href));

  return (
    <div className="min-h-[100dvh] bg-slate-50 text-slate-900 md:flex">
      <aside className="flex w-full flex-col border-b border-slate-200 bg-white md:sticky md:top-0 md:h-[100dvh] md:w-72 md:shrink-0 md:border-r md:border-b-0">
        <div className="border-b border-slate-100 px-5 py-5">
          <Link href="/" className="flex items-center gap-3" aria-label="Denguinhos, página inicial">
            <span className="grid h-10 w-10 place-items-center bg-blue-700 text-sm font-bold text-white">D</span>
            <span>
              <span className="block text-sm font-bold tracking-tight text-slate-950">Denguinhos</span>
              <span className="mt-0.5 block max-w-[190px] text-[11px] leading-4 text-slate-500">{municipality.prefeitura}</span>
            </span>
          </Link>
        </div>

        <nav aria-label="Navegação principal" className="flex gap-1 overflow-x-auto px-3 py-3 md:flex-col md:overflow-visible">
          {allowedNavigation.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex shrink-0 items-center gap-3 border-l-2 px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? "border-blue-700 bg-blue-50 font-semibold text-blue-800"
                    : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                }`}
              >
                <span className="w-5 text-center text-base" aria-hidden="true">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto hidden border-t border-slate-100 p-4 md:block">
          <ProfileActions id="active-role-desktop" role={role} onRoleChange={setRole} onLogout={() => setLoggedOut(true)} />
        </div>

        <div className="border-t border-slate-100 p-4 md:hidden">
          <ProfileActions id="active-role-mobile" role={role} onRoleChange={setRole} onLogout={() => setLoggedOut(true)} />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-[100] flex min-h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-7">
          <div>
            <p className="text-sm font-medium text-slate-800">{municipality.prefeitura}</p>
            <p className="mt-0.5 text-xs text-slate-500">Projeção calculada para as semanas epidemiológicas 42 a 45</p>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications((visible) => !visible)}
              aria-expanded={showNotifications}
              aria-label="Abrir central de alertas críticos"
              className="relative grid h-10 w-10 place-items-center border border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
              </svg>
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full" style={{ backgroundColor: riskColors.Crítico.foreground }} />
            </button>
            {showNotifications && (
              <section className="absolute right-0 top-12 z-[200] w-[min(22rem,calc(100vw-2rem))] border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-950">{role === "AGENTE_CAMPO" ? "Alerta da microárea" : "Alertas críticos"}</h2>
                  <span className="px-2 py-1 text-xs font-semibold" style={{ color: riskColors.Crítico.foreground, backgroundColor: riskColors.Crítico.background }}>{role === "AGENTE_CAMPO" ? "1 alerta" : "2 alertas"}</span>
                </div>
                <ul className="mt-3 divide-y divide-slate-100">
                  <li className="py-3">
                    <p className="text-sm font-medium text-slate-800">Risco crítico · Ibura</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{role === "AGENTE_CAMPO" ? "Verificar focos nas quadras 12 a 18 da sua microárea." : "Aumento projetado de notificações para a semana 42."}</p>
                  </li>
                  {role !== "AGENTE_CAMPO" && (
                    <li className="py-3">
                      <p className="text-sm font-medium text-slate-800">Risco crítico · Boa Viagem</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">Atividade vetorial acima do limiar municipal de atenção.</p>
                    </li>
                  )}
                </ul>
              </section>
            )}
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1440px] px-4 py-7 sm:px-7 lg:px-9">
          {loggedOut ? (
            <section className="mx-auto max-w-xl border border-slate-200 bg-white p-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Sessão encerrada</p>
              <h1 className="mt-3 text-xl font-bold text-slate-950">Você saiu da plataforma</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">Esta demonstração não está conectada a um provedor de autenticação.</p>
              <button type="button" onClick={() => setLoggedOut(false)} className="mt-5 min-h-10 bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800">Retomar demonstração</button>
            </section>
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
