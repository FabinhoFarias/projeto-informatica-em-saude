"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Role } from "@/lib/rbac";

const RoleContext = createContext<Role>("GESTOR");

export function RoleProvider({ role, children }: { role: Role; children: ReactNode }) {
  return <RoleContext.Provider value={role}>{children}</RoleContext.Provider>;
}

export function useRole() {
  return useContext(RoleContext);
}
