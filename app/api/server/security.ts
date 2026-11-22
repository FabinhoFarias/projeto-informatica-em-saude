import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export type ApiRole =
  | "ADMIN"
  | "GESTOR"
  | "AGENTE_CAMPO"
  | "LABORATORISTA"
  | "DIGITADOR"
  | "EPIDEMIOLOGISTA";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: ApiRole;
  municipalityId: string;
}

export type ApiPermission =
  | "users:read"
  | "users:manage"
  | "territory:read"
  | "territory:manage"
  | "visits:read"
  | "visits:write"
  | "laboratory:read"
  | "laboratory:write"
  | "reports:read"
  | "reports:export"
  | "stock:read"
  | "stock:manage"
  | "planning:read"
  | "planning:manage"
  | "maps:read"
  | "prioritization:read"
  | "diagnosis:read";

const permissions: Record<ApiRole, ApiPermission[]> = {
  ADMIN: [
    "users:read",
    "users:manage",
    "territory:read",
    "territory:manage",
    "visits:read",
    "visits:write",
    "laboratory:read",
    "laboratory:write",
    "reports:read",
    "reports:export",
    "stock:read",
    "stock:manage",
    "planning:read",
    "planning:manage",
    "maps:read",
    "prioritization:read",
    "diagnosis:read",
  ],
  GESTOR: [
    "users:read",
    "territory:read",
    "territory:manage",
    "visits:read",
    "laboratory:read",
    "reports:read",
    "reports:export",
    "stock:read",
    "stock:manage",
    "planning:read",
    "planning:manage",
    "maps:read",
    "prioritization:read",
    "diagnosis:read",
  ],
  AGENTE_CAMPO: ["territory:read", "visits:read", "visits:write", "maps:read"],
  LABORATORISTA: [
    "territory:read",
    "laboratory:read",
    "laboratory:write",
    "reports:export",
  ],
  DIGITADOR: [
    "territory:read",
    "visits:read",
    "visits:write",
    "reports:read",
    "reports:export",
  ],
  EPIDEMIOLOGISTA: [
    "territory:read",
    "reports:read",
    "reports:export",
    "maps:read",
    "prioritization:read",
    "diagnosis:read",
  ],
};

const configuredSecret = process.env.API_JWT_SECRET;
if (
  process.env.NODE_ENV === "production" &&
  (!configuredSecret || configuredSecret.length < 32)
) {
  throw new Error(
    "API_JWT_SECRET deve ter pelo menos 32 caracteres em produção",
  );
}
const secret = configuredSecret ?? crypto.randomBytes(32).toString("hex");

export function signToken(user: AuthenticatedUser) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      municipalityId: user.municipalityId,
    },
    secret,
    {
      algorithm: "HS256",
      expiresIn: "30m",
      issuer: "vigia-plus-api",
      audience: "vigia-plus-frontends",
    },
  );
}

export function hasPermission(role: ApiRole, permission: ApiPermission) {
  return permissions[role]?.includes(permission) ?? false;
}

export function authenticate(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const authorization = request.header("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return response.status(401).json({ error: "Token de acesso ausente" });
  }
  try {
    const payload = jwt.verify(authorization.slice(7), secret, {
      algorithms: ["HS256"],
      issuer: "vigia-plus-api",
      audience: "vigia-plus-frontends",
    }) as jwt.JwtPayload;
    if (!payload.sub || typeof payload.role !== "string")
      throw new Error("Token inválido");
    request.user = {
      id: payload.sub,
      email: String(payload.email),
      role: payload.role as ApiRole,
      municipalityId: String(payload.municipalityId),
    };
    return next();
  } catch {
    return response.status(401).json({ error: "Token inválido ou expirado" });
  }
}

export function requirePermission(permission: ApiPermission) {
  return (request: Request, response: Response, next: NextFunction) => {
    if (!request.user || !hasPermission(request.user.role, permission)) {
      return response.status(403).json({ error: "Permissão insuficiente" });
    }
    return next();
  };
}

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthenticatedUser;
  }
}
