export const roles = [
  "ADMIN",
  "GESTOR",
  "EPIDEMIOLOGISTA",
  "AGENTE_CAMPO",
  "PROFISSIONAL_APS",
] as const;

export type Role = (typeof roles)[number];

export const roleLabels: Record<Role, string> = {
  ADMIN: "Administrador do Sistema",
  GESTOR: "Gestor de Saúde Municipal",
  EPIDEMIOLOGISTA: "Epidemiologista / Pesquisador",
  AGENTE_CAMPO: "Agente de Saúde / Endemias",
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
  "aps:alerts",
] as const;

export type Permission = (typeof permissions)[number];

const rolePermissions: Record<Role, readonly Permission[]> = {
  ADMIN: permissions,
  GESTOR: [
    "dashboard:view",
    "diagnosis:view",
    "diagnosis:advanced",
    "ingestion:manage",
    "simulation:view",
    "routes:approve",
    "reports:export",
    "aps:alerts",
  ],
  EPIDEMIOLOGISTA: [
    "dashboard:view",
    "diagnosis:view",
    "diagnosis:advanced",
    "model:calibrate",
    "data:download",
    "aps:alerts",
  ],
  AGENTE_CAMPO: ["dashboard:view", "field:routes"],
  PROFISSIONAL_APS: ["dashboard:view", "diagnosis:view", "aps:alerts"],
};

export function hasPermission(role: Role, permission: Permission) {
  return rolePermissions[role].includes(permission);
}

export function canAccessPath(role: Role, pathname: string) {
  const routePermissions: Record<string, Permission> = {
    "/": "dashboard:view",
    "/diagnostico": "diagnosis:view",
    "/ingestao": "ingestion:manage",
    "/simulacao": "simulation:view",
    "/usuarios": "users:manage",
  };
  const path = Object.keys(routePermissions).find((route) =>
    route === "/" ? pathname === "/" : pathname === route || pathname.startsWith(`${route}/`),
  );
  return path ? hasPermission(role, routePermissions[path]) : false;
}
