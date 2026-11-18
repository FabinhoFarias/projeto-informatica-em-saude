export const roles = [
  "ADMIN",
  "GESTOR",
  "EPIDEMIOLOGISTA",
  "AGENTE_CAMPO",
  "LABORATORISTA",
  "DIGITADOR",
  "PROFISSIONAL_APS",
] as const;

export type Role = (typeof roles)[number];

export const roleLabels: Record<Role, string> = {
  ADMIN: "Administrador do Sistema",
  GESTOR: "Gestor de Saúde Municipal",
  EPIDEMIOLOGISTA: "Epidemiologista / Pesquisador",
  AGENTE_CAMPO: "Agente de Endemias",
  LABORATORISTA: "ACE Laboratorista",
  DIGITADOR: "Digitador / Operador",
  PROFISSIONAL_APS: "Profissional da Atenção Primária",
};

export const permissions = [
  "dashboard:view",
  "diagnosis:view",
  "diagnosis:advanced",
  "ingestion:manage",
  "simulation:view",
  "users:manage",
  "model:calibrate",
  "data:download",
  "reports:export",
  "routes:approve",
  "field:routes",
  "laboratory:manage",
  "records:transcribe",
  "ai:manage",
  "aps:alerts",
] as const;

export type Permission = (typeof permissions)[number];

const rolePermissions: Record<Role, readonly Permission[]> = {
  ADMIN: permissions,
  GESTOR: [
    "dashboard:view",
    "ingestion:manage",
    "routes:approve",
    "reports:export",
    "records:transcribe",
    "aps:alerts",
  ],
  EPIDEMIOLOGISTA: ["dashboard:view", "data:download", "aps:alerts"],
  AGENTE_CAMPO: ["dashboard:view", "field:routes"],
  LABORATORISTA: ["dashboard:view", "laboratory:manage", "reports:export"],
  DIGITADOR: ["dashboard:view", "records:transcribe", "reports:export"],
  PROFISSIONAL_APS: ["dashboard:view", "diagnosis:view", "aps:alerts"],
};

export function hasPermission(role: Role, permission: Permission) {
  return rolePermissions[role].includes(permission);
}

export function canAccessPath(role: Role, pathname: string) {
  const routePermissions: Record<string, Permission> = {
    "/painel": "dashboard:view",
    "/visitas": "field:routes",
    "/laboratorio": "laboratory:manage",
    "/digitacao-relatorios": "records:transcribe",
    "/territorio-conferencia": "dashboard:view",
    "/estoque": "dashboard:view",
    "/saneamento": "dashboard:view",
    "/mapas": "dashboard:view",
    "/hotspots": "dashboard:view",
    "/priorizacao-territorial": "ai:manage",
    "/diagnostico": "ai:manage",
    "/ingestao": "ingestion:manage",
    "/simulacao": "ai:manage",
    "/usuarios": "users:manage",
    "/configuracao-municipal": "users:manage",
  };
  const path = Object.keys(routePermissions).find(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  return path ? hasPermission(role, routePermissions[path]) : false;
}
