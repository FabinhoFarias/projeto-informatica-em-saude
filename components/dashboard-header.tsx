"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { Bell, LogOut } from "lucide-react";
import { riskColors } from "@/lib/territorios/risk";
import { roleLabels, roles, type Role } from "@/lib/identidade/permissions";

function ProfileActions({
  role,
  onRoleChange,
  onLogout,
}: {
  role: Role;
  onRoleChange: (role: Role) => void;
  onLogout: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="hidden min-w-0 text-right sm:block">
        <p className="truncate text-xs font-semibold text-slate-900">
          Mariana Santos
        </p>
        <label className="sr-only" htmlFor="header-role">
          Perfil de demonstração
        </label>
        <select
          id="header-role"
          value={role}
          onChange={(event) => onRoleChange(event.target.value as Role)}
          className="max-w-36 border-0 bg-transparent p-0 text-[11px] text-slate-500 outline-none"
        >
          {roles.map((item) => (
            <option key={item} value={item}>
              {roleLabels[item]}
            </option>
          ))}
        </select>
      </div>
      <div
        className="grid h-9 w-9 place-items-center rounded-full  bg-white text-xs font-bold text-blue-700"
        aria-hidden="true"
      >
        MS
      </div>
      <button
        type="button"
        onClick={onLogout}
        aria-label="Sair da plataforma"
        title="Sair"
        className="grid h-9 w-9 shrink-0 place-items-center text-slate-500 hover:bg-slate-100 hover:text-slate-900"
      >
        <LogOut className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );
}

export function DashboardHeader({
  role,
  onRoleChange,
  onLogout,
}: {
  role: Role;
  onRoleChange: (role: Role) => void;
  onLogout: () => void;
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const pathname = usePathname();
  const titleByRoute: Record<string, string> = {
    "/painel": "Dashboard",
    "/hotspots": "Mapa de hotspots",
    "/priorizacao-territorial": "Priorização territorial",
    "/diagnostico": "Diagnóstico situacional",
    "/ingestao": "Ingestão de dados",
    "/simulacao": "Simulação de recursos",
    "/usuarios": "Gestão de usuários",
  };
  const title = titleByRoute[pathname] ?? "Dashboard";
  return (
    <header className="sticky top-0 z-[100] flex h-[8vh] items-center justify-between gap-4 border-b border-color-border bg-white px-3 sm:px-6">
      <h1 className="ml-12 min-w-0 truncate text-base font-bold text-slate-800 sm:text-[20px] md:ml-0 md:text-[24px]">
        {title}
      </h1>
      <div className="flex shrink-0 items-center gap-2 md:gap-4">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications((visible) => !visible)}
            aria-expanded={showNotifications}
            aria-label="Abrir central de alertas críticos"
            className="relative grid h-10 w-10 place-items-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-sm hover:border-blue-300 hover:text-blue-700"
          >
            <Bell className="h-5 w-5" aria-hidden="true" />
            <span
              className="absolute right-2 top-2 h-2 w-2 rounded-full"
              style={{ backgroundColor: riskColors.Crítico.foreground }}
            />
          </button>
          {showNotifications && (
            <section className="absolute right-0 top-12 z-[200] w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
              <h2 className="text-sm font-semibold text-slate-950">
                {role === "AGENTE_CAMPO"
                  ? "Alerta da microárea"
                  : "Alertas críticos"}
              </h2>
              <p className="mt-3 text-sm text-slate-700">
                Risco crítico · Centro
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Aumento projetado de notificações para a semana 42.
              </p>
            </section>
          )}
        </div>
        <ProfileActions
          role={role}
          onRoleChange={onRoleChange}
          onLogout={onLogout}
        />
      </div>
    </header>
  );
}
