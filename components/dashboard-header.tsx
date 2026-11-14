"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Bell, Camera, ChevronDown, LogOut, Mail } from "lucide-react";
import Image from "next/image";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  useEffect(
    () => () => {
      if (avatarUrl) URL.revokeObjectURL(avatarUrl);
    },
    [avatarUrl],
  );

  const changeAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAvatarUrl((currentUrl) => {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
      return URL.createObjectURL(file);
    });
    event.target.value = "";
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        aria-label="Abrir opções do perfil de Mariana Santos"
        className="flex min-h-10 items-center gap-2 rounded-full p-0.5 text-left hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 sm:rounded-lg sm:pl-2"
      >
        <span className="hidden min-w-0 text-right sm:block">
          <span className="block truncate text-xs font-semibold text-slate-900">
            Mariana Santos
          </span>
          <span className="block text-[11px] text-slate-500">
            {roleLabels[role]}
          </span>
        </span>
        <span
          aria-hidden="true"
          className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full border border-slate-200 bg-white bg-cover bg-center text-xs font-bold text-blue-700 shadow-sm"
          style={
            avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined
          }
        >
          {!avatarUrl && "MS"}
        </span>
        <ChevronDown
          className={`hidden h-4 w-4 text-slate-500 transition-transform sm:block ${menuOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {menuOpen && (
        <>
          <button
            type="button"
            aria-label="Fechar opções do perfil"
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-[300] bg-slate-950/20 sm:hidden"
          />
          <section
            role="menu"
            aria-label="Opções do perfil"
            className="fixed right-3 top-[4.5rem] z-[310] w-[min(19rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl sm:absolute sm:right-0 sm:top-12 sm:z-[210] sm:shadow-xl"
          >
            <div className="border-b border-slate-200 p-4">
              <p className="font-semibold text-slate-950">Mariana Santos</p>
              <p className="mt-1 flex items-center gap-2 text-xs text-slate-600">
                <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                mariana.santos@lagoadeitaenga.pe.gov.br
              </p>
            </div>

            <div className="space-y-3 p-3">
              <label className="flex min-h-10 cursor-pointer items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-slate-100">
                <Camera className="h-4 w-4" aria-hidden="true" />
                Trocar foto de perfil
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={changeAvatar}
                  className="sr-only"
                />
              </label>

              <div>
                <label
                  htmlFor="header-role"
                  className="mb-1 block px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500"
                >
                  Perfil de demonstração
                </label>
                <select
                  id="header-role"
                  value={role}
                  onChange={(event) => onRoleChange(event.target.value as Role)}
                  aria-label="Escolher perfil para testar o protótipo"
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-600"
                >
                  {roles.map((item) => (
                    <option key={item} value={item}>
                      {roleLabels[item]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border-t border-slate-200 p-3">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onLogout();
                }}
                className="flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sair da plataforma
              </button>
            </div>
          </section>
        </>
      )}
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
    "/visitas": "Meu setor · visitas",
    "/hotspots": "Mapa de hotspots",
    "/priorizacao-territorial": "Priorização territorial",
    "/diagnostico": "Diagnóstico situacional",
    "/ingestao": "Ingestão de dados",
    "/simulacao": "Projeto PILOTO",
    "/usuarios": "Gestão de usuários",
  };
  const title = titleByRoute[pathname] ?? "Dashboard";
  return (
    <header className="sticky top-0 z-[300] flex h-16 items-center justify-between gap-3 border-b border-color-border bg-white px-3 sm:z-[100] sm:h-[8vh] sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-slate-200 bg-white p-1 md:hidden">
          <Image
            src="/brandingPrefeioturaLagoaDeItaenga/logoQuadrada.png"
            alt="Prefeitura de Lagoa de Itaenga"
            width={44}
            height={44}
            className="h-full w-full rounded-full object-contain"
          />
        </div>
        <h1 className="min-w-0 truncate text-base font-bold text-slate-800 sm:text-[20px] md:text-[24px]">
          {title}
        </h1>
      </div>
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
