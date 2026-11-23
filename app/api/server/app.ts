import crypto from "node:crypto";
import express, { type Request, type Response } from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { GetPropertyUseCase } from "../../../backend/application/use-cases/get-property";
import { ListPropertiesUseCase } from "../../../backend/application/use-cases/list-properties";
import type { PropertyRepository } from "../../../backend/domain/repositories/property-repository";
import { MockPropertyRepository } from "../../../backend/infrastructure/repositories/mock-property-repository";
import { mockApiData } from "../../../backend/infrastructure/mock-data";
import { aceMemoryStore } from "../../../backend/infrastructure/stores/ace-memory-store";
import {
  authenticate,
  hasPermission,
  requirePermission,
  signToken,
  type ApiRole,
} from "./security";

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
    if (
      process.env.NODE_ENV === "production" &&
      process.env.API_DEMO_MODE !== "true"
    ) {
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
    if (
      process.env.NODE_ENV === "production" &&
      process.env.API_DEMO_MODE !== "true"
    ) {
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

  async function operationalSnapshot(cicloId?: string) {
    const properties = await repository.list();
    const assignedProperties = properties.filter(
      (property) => property.assignedAceId,
    );
    const visits = aceMemoryStore.allVisits.filter(
      (visit) =>
        !cicloId || String(visit.cicloId ?? "ciclo-2026-6") === cicloId,
    );
    const visitedPropertyIds = new Set(
      visits.map((visit) => String(visit.imovelId ?? "")),
    );
    return { properties, assignedProperties, visits, visitedPropertyIds };
  }

  function normalizeVisit(visit: Record<string, unknown> | null) {
    if (!visit) return null;
    const createdAt = String(visit.createdAt ?? new Date().toISOString());
    return {
      ...visit,
      dataAtividade: String(visit.dataAtividade ?? createdAt.slice(0, 10)),
      formulario: (visit.formulario ?? {}) as Record<string, unknown>,
      operacaoSync: visit.operacaoSync ?? {
        operationUuid: String(visit.id),
        status: visit.status === "SINCRONIZADO" ? "RECEBIDA" : "PENDENTE",
        recebidaEm: visit.status === "SINCRONIZADO" ? createdAt : null,
      },
    };
  }
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
    "/v1/usuarios/:id",
    requirePermission("users:read"),
    (request, response) =>
      response.json({
        data:
          mockApiData.usuarios.find(
            (user) => user.id === String(request.params.id),
          ) ?? null,
      }),
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
    (_request, response) =>
      response.json({
        data: mockApiData.territorios.map((territory) => ({
          ...territory,
          name: territory.nome,
          city: "Lagoa de Itaenga",
          district: "Área Urbana",
          density: territory.population ? territory.population : 0,
        })),
      }),
  );
  app.get(
    "/v1/quarteiroes",
    requirePermission("territory:read"),
    (_request, response) =>
      response.json({
        data: Array.from({ length: 60 }, (_, index) => {
          const id = `quarteirao-${index + 1}`;
          const assignment = aceMemoryStore
            .assignments()
            .find((item) => item.quarteiraoId === id);
          return {
            id,
            numero: index + 1,
            bairro:
              mockApiData.territorios[index % mockApiData.territorios.length]
                .nome,
            aceId: assignment?.aceId ?? null,
            cicloId: assignment?.cicloId ?? null,
          };
        }),
      }),
  );
  app.get(
    "/v1/atribuicoes",
    requirePermission("territory:read"),
    (request, response) =>
      response.json({
        data: aceMemoryStore.assignments(
          request.query.aceId ? String(request.query.aceId) : undefined,
        ),
      }),
  );
  app.post(
    "/v1/atribuicoes",
    requirePermission("territory:manage"),
    (request, response) =>
      response
        .status(201)
        .json({ data: aceMemoryStore.upsertAssignment(request.body) }),
  );
  app.get(
    "/v1/ciclos",
    requirePermission("planning:read"),
    (_request, response) => response.json({ data: mockApiData.ciclos }),
  );
  app.get(
    "/v1/cobertura",
    requirePermission("reports:read"),
    async (request, response) => {
      const cicloId = request.query.cicloId
        ? String(request.query.cicloId)
        : undefined;
      const snapshot = await operationalSnapshot(cicloId);
      const atribuidos = snapshot.assignedProperties.length;
      const visitados = snapshot.assignedProperties.filter((property) =>
        snapshot.visitedPropertyIds.has(property.id),
      ).length;
      return response.json({
        data: {
          cicloId: cicloId ?? "ciclo-2026-6",
          atribuidos,
          visitados,
          pendentes: Math.max(0, atribuidos - visitados),
          percentual: atribuidos
            ? Math.round((visitados / atribuidos) * 100)
            : 0,
        },
      });
    },
  );
  app.get(
    "/v1/cobertura/aces",
    requirePermission("reports:read"),
    async (request, response) => {
      const cicloId = request.query.cicloId
        ? String(request.query.cicloId)
        : undefined;
      const snapshot = await operationalSnapshot(cicloId);
      return response.json({
        data: mockApiData.usuarios.map((user) => {
          const assigned = snapshot.assignedProperties.filter(
            (property) => property.assignedAceId === user.id,
          );
          const visited = new Set(
            snapshot.visits
              .filter((visit) => visit.aceId === user.id)
              .map((visit) => String(visit.imovelId)),
          ).size;
          return {
            ...user,
            atribuidos: assigned.length,
            visitados: visited,
            pendentes: Math.max(0, assigned.length - visited),
            cobertura: assigned.length
              ? Math.round((visited / assigned.length) * 100)
              : 0,
          };
        }),
      });
    },
  );
  app.get(
    "/v1/cobertura/territorios",
    requirePermission("reports:read"),
    async (request, response) => {
      const cicloId = request.query.cicloId
        ? String(request.query.cicloId)
        : undefined;
      const snapshot = await operationalSnapshot(cicloId);
      return response.json({
        data: mockApiData.territorios.map((territory) => {
          const territoryProperties = snapshot.assignedProperties.filter(
            (property) => property.neighborhood === territory.nome,
          );
          const visited = territoryProperties.filter((property) =>
            snapshot.visitedPropertyIds.has(property.id),
          ).length;
          return {
            ...territory,
            atribuidos: territoryProperties.length,
            visitados: visited,
            pendentes: territoryProperties.length - visited,
            cobertura: territoryProperties.length
              ? Math.round((visited / territoryProperties.length) * 100)
              : 0,
          };
        }),
      });
    },
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
    async (request, response) => {
      const cicloId = request.query.cicloId
        ? String(request.query.cicloId)
        : undefined;
      const data = request.query.data ? String(request.query.data) : undefined;
      const snapshot = await operationalSnapshot(cicloId);
      const visitas = data
        ? snapshot.visits.filter((visit) =>
            String(visit.dataAtividade ?? visit.createdAt).startsWith(data),
          )
        : snapshot.visits;
      return response.json({
        data: {
          cicloId: cicloId ?? "ciclo-2026-6",
          data: data ?? "2026-11-22",
          visitas: visitas.length,
          retornos: aceMemoryStore
            .returns({ cicloId })
            .filter((item) => !data || String(item.createdAt).startsWith(data))
            .length,
          amostras: mockApiData.amostras.length,
          origem: "MOCK",
        },
      });
    },
  );
  app.get(
    "/v1/relatorios/semanal",
    requirePermission("reports:read"),
    async (request, response) => {
      const cicloId = request.query.cicloId
        ? String(request.query.cicloId)
        : undefined;
      const snapshot = await operationalSnapshot(cicloId);
      const cobertura = snapshot.assignedProperties.length
        ? Math.round(
            (snapshot.assignedProperties.filter((property) =>
              snapshot.visitedPropertyIds.has(property.id),
            ).length /
              snapshot.assignedProperties.length) *
              100,
          )
        : 0;
      return response.json({
        data: {
          periodo: "semana-47-2026",
          visitas: snapshot.visits.length,
          cobertura,
          origem: "MOCK",
        },
      });
    },
  );
  app.get(
    "/v1/relatorios/ciclo",
    requirePermission("reports:read"),
    async (request, response) => {
      const cicloId = request.query.cicloId
        ? String(request.query.cicloId)
        : undefined;
      const snapshot = await operationalSnapshot(cicloId);
      const cobertura = snapshot.assignedProperties.length
        ? Math.round(
            (snapshot.assignedProperties.filter((property) =>
              snapshot.visitedPropertyIds.has(property.id),
            ).length /
              snapshot.assignedProperties.length) *
              100,
          )
        : 0;
      return response.json({
        data: {
          cicloId: cicloId ?? "ciclo-2026-6",
          visitas: snapshot.visits.length,
          cobertura,
          origem: "MOCK",
        },
      });
    },
  );
  app.get(
    "/v1/ocorrencias",
    requirePermission("visits:read"),
    (_request, response) =>
      response.json({ data: aceMemoryStore.occurrences() }),
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
      const hasPagination =
        request.query.page !== undefined || request.query.limit !== undefined;
      const requestedPage = Number(request.query.page ?? 1);
      const requestedLimit = Number(request.query.limit ?? result.length);
      const page = Number.isFinite(requestedPage)
        ? Math.max(1, Math.floor(requestedPage))
        : 1;
      const limit = Number.isFinite(requestedLimit)
        ? Math.min(2000, Math.max(10, Math.floor(requestedLimit)))
        : result.length;
      const pageItems = hasPagination
        ? result.slice((page - 1) * limit, page * limit)
        : result;
      response.setHeader("X-Total-Count", String(result.length));
      response.setHeader("X-Page", String(page));
      response.setHeader("X-Page-Size", String(limit));
      return response.json({
        data: pageItems.map((property) => ({
          ...property,
          numero: property.number,
          tipo: property.type,
          logradouro: property.street,
          quarteirao: String(property.block),
          codigoLocal: property.id,
          imovelVersaoId: property.id,
          territorioId: property.neighborhood,
          territorioVersaoId: "mock-v1",
          situacaoCadastral: "ATIVO",
          zona:
            mockApiData.territorios.find(
              (territory) => territory.nome === property.neighborhood,
            )?.zona === "Rural"
              ? "RURAL"
              : "URBANA",
          lado: "NORTE",
          sequenciaPercurso: Number(property.number),
          coordenadas: {
            latitude: -7.94,
            longitude: -35.29,
            origem: "CADASTRO_DEMO",
          },
          pontoMapa: { x: 0, y: 0 },
          ultimaVisita: normalizeVisit(aceMemoryStore.latestVisit(property.id)),
        })),
      });
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
      return response.json({
        data: {
          ...property,
          numero: property.number,
          tipo: property.type,
          logradouro: property.street,
          quarteirao: String(property.block),
          codigoLocal: property.id,
          imovelVersaoId: property.id,
          territorioId: property.neighborhood,
          territorioVersaoId: "mock-v1",
          situacaoCadastral: "ATIVO",
          zona: "URBANA",
          lado: "NORTE",
          sequenciaPercurso: Number(property.number),
          coordenadas: {
            latitude: -7.94,
            longitude: -35.29,
            origem: "CADASTRO_DEMO",
          },
          pontoMapa: { x: 0, y: 0 },
          ultimaVisita: normalizeVisit(aceMemoryStore.latestVisit(property.id)),
        },
      });
    },
  );
  app.post(
    "/v1/visitas",
    requirePermission("visits:write"),
    (request, response) =>
      response.status(201).json({
        data: aceMemoryStore.createVisit(request.body, request.user!.id),
      }),
  );
  app.get(
    "/v1/visitas",
    requirePermission("visits:read"),
    (request, response) =>
      response.json({
        data: aceMemoryStore
          .visits({
            aceId: request.query.aceId
              ? String(request.query.aceId)
              : undefined,
            propertyId: request.query.imovelId
              ? String(request.query.imovelId)
              : undefined,
          })
          .filter(
            (visit) =>
              !request.query.cicloId ||
              String(visit.cicloId ?? "ciclo-2026-6") ===
                String(request.query.cicloId),
          )
          .map((visit) => normalizeVisit(visit)),
      }),
  );
  app.get(
    "/v1/visitas/:id",
    requirePermission("visits:read"),
    (request, response) =>
      response.json({
        data: normalizeVisit(aceMemoryStore.visit(String(request.params.id))),
      }),
  );
  app.get(
    "/v1/visitas/:id/ocorrencias",
    requirePermission("visits:read"),
    (request, response) =>
      response.json({
        data: aceMemoryStore.occurrences(String(request.params.id)),
      }),
  );
  app.post(
    "/v1/visitas/:id/ocorrencias",
    requirePermission("visits:write"),
    (request, response) =>
      response.status(201).json({
        data: aceMemoryStore.createOccurrence(
          String(request.params.id),
          request.body,
        ),
      }),
  );
  app.post(
    "/v1/visitas/:id/anexos",
    requirePermission("visits:write"),
    (request, response) =>
      response.status(201).json({
        data: aceMemoryStore.createAttachment(
          String(request.params.id),
          request.body,
        ),
      }),
  );
  app.get(
    "/v1/visitas/:id/anexos",
    requirePermission("visits:read"),
    (request, response) =>
      response.json({
        data: aceMemoryStore.attachments(String(request.params.id)),
      }),
  );
  app.get(
    "/v1/retornos",
    requirePermission("visits:read"),
    (request, response) =>
      response.json({
        data: aceMemoryStore.returns({
          aceId: request.query.aceId ? String(request.query.aceId) : undefined,
          propertyId: request.query.imovelId
            ? String(request.query.imovelId)
            : undefined,
          cicloId: request.query.cicloId
            ? String(request.query.cicloId)
            : undefined,
        }),
      }),
  );
  app.post(
    "/v1/retornos",
    requirePermission("visits:write"),
    (request, response) =>
      response.status(201).json({
        data: aceMemoryStore.createReturn(request.body, request.user!.id),
      }),
  );
  app.get(
    "/v1/imoveis/:id/visitas",
    requirePermission("visits:read"),
    (request, response) =>
      response.json({
        data: aceMemoryStore
          .visitsByProperty(String(request.params.id))
          .map((visit) => normalizeVisit(visit)),
      }),
  );
  app.get(
    "/v1/imoveis/:id/retornos",
    requirePermission("visits:read"),
    (request, response) =>
      response.json({
        data: aceMemoryStore.returns({ propertyId: String(request.params.id) }),
      }),
  );
  app.get(
    "/v1/usuarios/aces/:id/historico",
    requirePermission("reports:read"),
    async (request, response) => {
      const aceId = String(request.params.id);
      const cicloId = request.query.cicloId
        ? String(request.query.cicloId)
        : undefined;
      const visits = aceMemoryStore
        .visitsByAce(aceId)
        .filter(
          (visit) =>
            !cicloId || String(visit.cicloId ?? "ciclo-2026-6") === cicloId,
        );
      const visited = new Set(visits.map((item) => item.imovelId)).size;
      const properties = await repository.list({ assignedAceId: aceId });
      const atribuidos = properties.length;
      return response.json({
        data: {
          aceId,
          visitas: visits,
          visitados: visited,
          atribuidos,
          pendentes: Math.max(0, atribuidos - visited),
          cobertura: atribuidos ? Math.round((visited / atribuidos) * 100) : 0,
          retornos: aceMemoryStore.returns({ aceId, cicloId }),
        },
      });
    },
  );
  app.get(
    "/v1/me/historico",
    requirePermission("visits:read"),
    async (request, response) => {
      const aceId = request.user?.id ?? "";
      const cicloId = request.query.cicloId
        ? String(request.query.cicloId)
        : undefined;
      const data = request.query.data ? String(request.query.data) : undefined;
      const semana = request.query.semana
        ? String(request.query.semana)
        : undefined;
      const visits = aceMemoryStore.visitsByAce(aceId).filter((visit) => {
        if (cicloId && String(visit.cicloId ?? "") !== cicloId) return false;
        const date = String(visit.dataAtividade ?? visit.createdAt ?? "");
        if (data && !date.startsWith(data)) return false;
        if (semana && !date.startsWith(semana)) return false;
        return true;
      });
      const properties = await repository.list({ assignedAceId: aceId });
      return response.json({
        data: {
          aceId,
          visitas: visits,
          retornos: aceMemoryStore.returns({ aceId, cicloId }),
          atribuidos: properties.length,
          visitados: new Set(visits.map((visit) => visit.imovelId)).size,
        },
      });
    },
  );
  app.get(
    "/v1/usuarios/aces/:id/imoveis",
    requirePermission("visits:read"),
    async (request, response) => {
      const properties = await listProperties.execute({
        assignedAceId: String(request.params.id),
      });
      return response.json({
        data: properties.map((property) => ({
          ...property,
          numero: property.number,
          tipo: property.type,
          logradouro: property.street,
          quarteirao: String(property.block),
          codigoLocal: property.id,
          imovelVersaoId: property.id,
          territorioId: property.neighborhood,
          situacaoCadastral: "ATIVO",
          zona: "URBANA",
          lado: "NORTE",
          sequenciaPercurso: Number(property.number),
          coordenadas: {
            latitude: -7.94,
            longitude: -35.29,
            origem: "CADASTRO_DEMO",
          },
          pontoMapa: { x: 0, y: 0 },
          ultimaVisita: normalizeVisit(aceMemoryStore.latestVisit(property.id)),
        })),
      });
    },
  );
  app.post(
    "/v1/sincronizacao",
    requirePermission("visits:write"),
    (request, response) => {
      const operationUuid = String(
        request.body.operationUuid ?? crypto.randomUUID(),
      );
      return response.status(201).json({
        data: aceMemoryStore.synchronize(operationUuid, request.body),
      });
    },
  );
  app.get(
    "/v1/sincronizacao/:operationUuid",
    requirePermission("visits:read"),
    (request, response) =>
      response.json({
        data: aceMemoryStore.synchronization(
          String(request.params.operationUuid),
        ),
      }),
  );
  app.get(
    "/v1/sincronizacao",
    requirePermission("visits:read"),
    (_request, response) =>
      response.json({ data: aceMemoryStore.synchronizations() }),
  );
  app.get(
    "/v1/fichas-manuais",
    requirePermission("visits:read"),
    (_request, response) =>
      response.json({
        data: aceMemoryStore.allVisits.filter(
          (visit) => visit.origemRegistro === "PAPEL",
        ),
      }),
  );
  app.get(
    "/v1/estoque/consumo",
    requirePermission("stock:read"),
    (_request, response) =>
      response.json({
        data: aceMemoryStore.allVisits
          .filter(
            (visit) =>
              Number(visit.larvicida1Quantidade ?? 0) > 0 ||
              Number(visit.larvicida2Quantidade ?? 0) > 0,
          )
          .map((visit) => ({
            visitaId: visit.id,
            imovelId: visit.imovelId,
            aceId: visit.aceId,
            larvicida1Tipo: visit.larvicida1Tipo ?? "",
            larvicida1Quantidade: Number(visit.larvicida1Quantidade ?? 0),
            larvicida2Tipo: visit.larvicida2Tipo ?? "",
            larvicida2Quantidade: Number(visit.larvicida2Quantidade ?? 0),
          })),
      }),
  );
  app.get(
    "/v1/mapas/aces",
    requirePermission("maps:read"),
    (_request, response) =>
      response.json({
        data: mockApiData.usuarios.map((user, index) => ({
          aceId: user.id,
          nome: user.nome,
          latitude: -7.94 + index * 0.002,
          longitude: -35.29 + index * 0.002,
          atualizadoEm: "2026-11-22T09:00:00-03:00",
          origem: "MOCK",
        })),
      }),
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
