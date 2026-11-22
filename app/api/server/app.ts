import express, { type Request, type Response } from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { GetPropertyUseCase } from "@/backend/application/use-cases/get-property";
import { ListPropertiesUseCase } from "@/backend/application/use-cases/list-properties";
import type { PropertyRepository } from "@/backend/domain/repositories/property-repository";
import { MockPropertyRepository } from "@/backend/infrastructure/repositories/mock-property-repository";
import { mockApiData } from "@/backend/infrastructure/mock-data";
import {
  authenticate,
  hasPermission,
  requirePermission,
  signToken,
  type ApiRole,
} from "@/app/api/server/security";

export function createApi(
  repository: PropertyRepository = new MockPropertyRepository(),
) {
  const app = express();
  const listProperties = new ListPropertiesUseCase(repository);
  const getProperty = new GetPropertyUseCase(repository);

  const allowedOrigins = new Set(
    (process.env.API_ALLOWED_ORIGINS ?? "http://localhost:3000")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  );
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.has(origin)) return callback(null, true);
        return callback(new Error("Origem não autorizada"));
      },
      credentials: true,
    }),
  );
  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 120,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    }),
  );
  app.use((request, response, next) => {
    if (process.env.NODE_ENV === "production") {
      const protocol =
        request.header("x-forwarded-proto") ??
        (request.secure ? "https" : "http");
      if (protocol !== "https")
        return response.status(426).json({ error: "HTTPS obrigatório" });
    }
    return next();
  });
  app.use(express.json({ limit: "1mb" }));
  app.get("/health", (_request, response) => response.json({ status: "ok" }));
  app.post("/v1/auth/login", (request, response) => {
    const input = z
      .object({
        email: z.string().email(),
        password: z.string().min(8),
        role: z.string(),
      })
      .safeParse(request.body);
    if (!input.success)
      return response.status(400).json({ error: "Credenciais inválidas" });
    if (process.env.NODE_ENV === "production") {
      return response
        .status(503)
        .json({ error: "Login mockado desabilitado em produção" });
    }
    const role = input.data.role as ApiRole;
    const password = process.env.SENHA_DEMO ?? "vigia-demo-local";
    if (
      !hasPermission(role, "territory:read") ||
      input.data.password !== password
    ) {
      return response.status(401).json({ error: "Credenciais inválidas" });
    }
    const demoIds: Record<ApiRole, string> = {
      ADMIN: "u-1",
      GESTOR: "u-2",
      AGENTE_CAMPO: "u-4",
      LABORATORISTA: "u-6",
      DIGITADOR: "u-7",
      EPIDEMIOLOGISTA: "u-3",
    };
    const user = {
      id: demoIds[role],
      email: input.data.email,
      role,
      municipalityId: "lagoa-de-itaenga",
    };
    return response.json({
      data: { user, accessToken: signToken(user), expiresIn: 1800 },
    });
  });
  app.use("/v1", authenticate);
  app.get("/v1/auth/me", (request, response) =>
    response.json({ data: request.user }),
  );
  app.post("/v1/auth/logout", (_request, response) =>
    response.status(204).send(),
  );
  app.get(
    "/v1/usuarios",
    requirePermission("users:read"),
    (_request, response) => response.json({ data: mockApiData.usuarios }),
  );
  app.get(
    "/v1/usuarios/aces",
    requirePermission("users:read"),
    (_request, response) => response.json({ data: mockApiData.usuarios }),
  );
  app.get(
    "/v1/permissoes",
    requirePermission("users:read"),
    (request, response) =>
      response.json({
        data: { role: request.user?.role, permissions: "perfil" },
      }),
  );
  app.get(
    "/v1/configuracao-municipal",
    requirePermission("territory:read"),
    (_request, response) =>
      response.json({
        data: {
          municipalityId: "lagoa-de-itaenga",
          modules: "MOCK",
          origem: "MOCK",
        },
      }),
  );
  app.get(
    "/v1/territorios",
    requirePermission("territory:read"),
    (_request, response) => response.json({ data: mockApiData.territorios }),
  );
  app.get(
    "/v1/quarteiroes",
    requirePermission("territory:read"),
    (_request, response) =>
      response.json({
        data: Array.from({ length: 30 }, (_, index) => ({
          id: `quarteirao-${index + 1}`,
          numero: index + 1,
          bairro:
            mockApiData.territorios[index % mockApiData.territorios.length]
              .nome,
        })),
      }),
  );
  app.get(
    "/v1/atribuicoes",
    requirePermission("territory:read"),
    (_request, response) => response.json({ data: [] }),
  );
  app.get(
    "/v1/ciclos",
    requirePermission("planning:read"),
    (_request, response) => response.json({ data: mockApiData.ciclos }),
  );
  app.get(
    "/v1/cobertura",
    requirePermission("reports:read"),
    (_request, response) => response.json({ data: mockApiData.cobertura }),
  );
  app.get(
    "/v1/cobertura/aces",
    requirePermission("reports:read"),
    (_request, response) =>
      response.json({
        data: mockApiData.usuarios.map((user, index) => ({
          ...user,
          cobertura: 54 + index * 9,
        })),
      }),
  );
  app.get(
    "/v1/cobertura/territorios",
    requirePermission("reports:read"),
    (_request, response) =>
      response.json({
        data: mockApiData.territorios.map((territory, index) => ({
          ...territory,
          cobertura: 48 + index * 11,
        })),
      }),
  );
  app.get(
    "/v1/amostras",
    requirePermission("laboratory:read"),
    (_request, response) => response.json({ data: mockApiData.amostras }),
  );
  app.get(
    "/v1/estoque",
    requirePermission("stock:read"),
    (_request, response) => response.json({ data: mockApiData.estoque }),
  );
  app.get(
    "/v1/relatorios/diario",
    requirePermission("reports:read"),
    (_request, response) =>
      response.json({
        data: {
          data: "2026-11-22",
          visitas: 582,
          retornos: 92,
          amostras: 2,
          origem: "MOCK",
        },
      }),
  );
  app.get(
    "/v1/relatorios/semanal",
    requirePermission("reports:read"),
    (_request, response) =>
      response.json({
        data: {
          periodo: "semana-47-2026",
          visitas: 582,
          cobertura: 58,
          origem: "MOCK",
        },
      }),
  );
  app.get(
    "/v1/relatorios/ciclo",
    requirePermission("reports:read"),
    (_request, response) =>
      response.json({
        data: {
          cicloId: "ciclo-2026-6",
          visitas: 582,
          cobertura: 58,
          origem: "MOCK",
        },
      }),
  );
  app.get(
    "/v1/ocorrencias",
    requirePermission("visits:read"),
    (_request, response) => response.json({ data: [] }),
  );
  app.get(
    "/v1/saneamento",
    requirePermission("territory:read"),
    (_request, response) => response.json({ data: [] }),
  );
  app.get(
    "/v1/estoque/movimentacoes",
    requirePermission("stock:read"),
    (_request, response) => response.json({ data: [] }),
  );
  app.get(
    "/v1/planejamento/ciclos",
    requirePermission("planning:read"),
    (_request, response) => response.json({ data: mockApiData.ciclos }),
  );
  app.get(
    "/v1/planejamento/ciclos/:id/acoes",
    requirePermission("planning:read"),
    (request, response) =>
      response.json({ data: [], cicloId: request.params.id }),
  );
  app.get("/v1/mapas", requirePermission("maps:read"), (_request, response) =>
    response.json({ data: { municipio: "Lagoa de Itaenga", origem: "MOCK" } }),
  );
  app.get(
    "/v1/hotspots",
    requirePermission("maps:read"),
    (_request, response) => response.json({ data: [] }),
  );
  app.get(
    "/v1/ingestao",
    requirePermission("territory:manage"),
    (_request, response) =>
      response.json({ data: { status: "PRONTO", origem: "MOCK" } }),
  );
  app.get(
    "/v1/priorizacao",
    requirePermission("prioritization:read"),
    (_request, response) => response.json({ data: [] }),
  );
  app.get(
    "/v1/diagnostico",
    requirePermission("diagnosis:read"),
    (_request, response) => response.json({ data: [] }),
  );
  app.get(
    "/v1/imoveis",
    requirePermission("visits:read"),
    async (request: Request, response: Response) => {
      const block = request.query.quarteirao
        ? Number(request.query.quarteirao)
        : undefined;
      const result = await listProperties.execute({
        search: String(request.query.busca ?? ""),
        block: Number.isFinite(block) ? block : undefined,
        assignedAceId:
          request.user?.role === "AGENTE_CAMPO"
            ? request.user.id
            : request.query.aceId
              ? String(request.query.aceId)
              : undefined,
      });
      return response.json({ data: result });
    },
  );
  app.get(
    "/v1/imoveis/:id",
    requirePermission("visits:read"),
    async (request, response) => {
      const property = await getProperty.execute(String(request.params.id));
      if (!property)
        return response.status(404).json({ error: "Imóvel não encontrado" });
      if (
        request.user?.role === "AGENTE_CAMPO" &&
        property.assignedAceId !== request.user.id
      ) {
        return response.status(404).json({ error: "Imóvel não encontrado" });
      }
      return response.json({ data: property });
    },
  );
  app.post(
    "/v1/visitas",
    requirePermission("visits:write"),
    (request, response) =>
      response.status(201).json({
        data: {
          id: `visita-mock-${Date.now()}`,
          ...request.body,
          status: "PENDENTE_SINCRONIZACAO",
          origem: "MOCK",
        },
      }),
  );
  app.get(
    "/v1/visitas/:id",
    requirePermission("visits:read"),
    (request, response) =>
      response.json({
        data: { id: request.params.id, status: "MOCK", origem: "MOCK" },
      }),
  );
  app.get(
    "/v1/visitas/:id/ocorrencias",
    requirePermission("visits:read"),
    (_request, response) => response.json({ data: [] }),
  );
  app.post(
    "/v1/visitas/:id/ocorrencias",
    requirePermission("visits:write"),
    (request, response) =>
      response.status(201).json({
        data: {
          id: `ocorrencia-mock-${Date.now()}`,
          ...request.body,
          origem: "MOCK",
        },
      }),
  );
  app.post(
    "/v1/visitas/:id/anexos",
    requirePermission("visits:write"),
    (_request, response) =>
      response.status(201).json({
        data: {
          id: `anexo-mock-${Date.now()}`,
          status: "PENDENTE_SINCRONIZACAO",
          origem: "MOCK",
        },
      }),
  );
  app.get(
    "/v1/retornos",
    requirePermission("visits:read"),
    (_request, response) => response.json({ data: [] }),
  );
  app.get(
    "/v1/amostras/:id",
    requirePermission("laboratory:read"),
    (request, response) =>
      response.json({
        data:
          mockApiData.amostras.find(
            (sample) => sample.id === request.params.id,
          ) ?? null,
      }),
  );
  app.post(
    "/v1/amostras/:id/resultado",
    requirePermission("laboratory:write"),
    (request, response) =>
      response.status(201).json({
        data: {
          amostraId: request.params.id,
          ...request.body,
          origem: "MOCK",
        },
      }),
  );
  return app;
}
