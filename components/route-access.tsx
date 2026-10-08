"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { canAccessPath } from "@/lib/rbac";
import { useRole } from "@/components/rbac-context";

export function RouteAccess({ children }: { children: ReactNode }) {
  const role = useRole();
  const pathname = usePathname();

  if (canAccessPath(role, pathname)) return children;

  return (
    <section className="mx-auto max-w-xl border border-slate-200 bg-white p-8 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Acesso restrito</p>
      <h1 className="mt-3 text-xl font-bold text-slate-950">Seu perfil não tem permissão para esta rota</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">As permissões são definidas pelo administrador do sistema. Se precisar de acesso, solicite a revisão do seu perfil.</p>
    </section>
  );
}
