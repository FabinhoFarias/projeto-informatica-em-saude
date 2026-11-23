import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";

process.env.NODE_ENV = "test";
process.env.SENHA_DEMO = "vigia123";
process.env.API_JWT_SECRET = "test-secret-vigia-plus-32-characters-long";

let createApi: typeof import("@/app/api/server/app").createApi;

let server: import("node:http").Server;
let baseUrl = "";
const tokens = new Map<string, string>();

async function request(
  path: string,
  options: RequestInit = {},
  role: string | null = "GESTOR",
) {
  const token = role ? tokens.get(role) : undefined;
  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
}

async function login(role: string) {
  const response = await request("/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: `${role.toLowerCase()}@vigia.local`,
      password: "vigia123",
      role,
    }),
  });
  assert.equal(response.status, 200, `login ${role}`);
  const body = (await response.json()) as { data: { accessToken: string } };
  tokens.set(role, body.data.accessToken);
}

before(async () => {
  ({ createApi } = await import("@/app/api/server/app"));
  const app = createApi();
  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      const address = server.address();
      assert.ok(address && typeof address !== "string");
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
  await login("GESTOR");
  await login("AGENTE_CAMPO");
  await login("LABORATORISTA");
});

after(() => server.close());

describe("VIGIA+ API — segurança e contratos", () => {
  test("health não exige token", async () => {
    const response = await request("/health");
    assert.equal(response.status, 200);
  });

  test("rejeita requisição protegida sem autenticação", async () => {
    const response = await request("/v1/usuarios", {}, null);
    assert.equal(response.status, 401);
  });

  test("rejeita credencial inválida", async () => {
    const response = await request("/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "gestor@vigia.local",
        password: "senha-incorreta",
        role: "GESTOR",
      }),
    });
    assert.equal(response.status, 401);
  });

  test("aplica autorização por perfil", async () => {
    const response = await request("/v1/usuarios", {}, "AGENTE_CAMPO");
    assert.equal(response.status, 403);
    const visits = await request(
      "/v1/imoveis?page=1&limit=10",
      {},
      "AGENTE_CAMPO",
    );
    assert.equal(visits.status, 200);
  });

  test("GETs principais retornam contrato com data", async () => {
    const paths = [
      "/v1/auth/me",
      "/v1/usuarios",
      "/v1/territorios",
      "/v1/quarteiroes",
      "/v1/atribuicoes",
      "/v1/imoveis?page=1&limit=10",
      "/v1/visitas",
      "/v1/cobertura",
      "/v1/cobertura/aces",
      "/v1/cobertura/territorios",
      "/v1/amostras",
      "/v1/estoque",
      "/v1/estoque/movimentacoes",
      "/v1/estoque/consumo",
      "/v1/relatorios/diario",
      "/v1/relatorios/semanal",
      "/v1/relatorios/ciclo",
      "/v1/planejamento/ciclos",
      "/v1/mapas",
      "/v1/mapas/aces",
      "/v1/hotspots",
      "/v1/saneamento",
      "/v1/ocorrencias",
      "/v1/sincronizacao",
      "/v1/fichas-manuais",
      "/v1/priorizacao",
      "/v1/diagnostico",
      "/v1/ingestao",
    ];
    for (const path of paths) {
      const response = await request(path);
      assert.equal(response.status, 200, path);
      const body = (await response.json()) as { data: unknown };
      assert.ok("data" in body, path);
    }
  });

  test("fluxo de visita mantém leitura após gravação", async () => {
    const created = await request(
      "/v1/visitas",
      {
        method: "POST",
        body: JSON.stringify({
          imovelId: "property-1",
          cicloId: "ciclo-2026-6",
        }),
      },
      "AGENTE_CAMPO",
    );
    assert.equal(created.status, 201);
    const visit = (await created.json()) as { data: { id: string } };
    const loaded = await request(`/v1/visitas/${visit.data.id}`);
    assert.equal(loaded.status, 200);
    const occurrences = await request(
      `/v1/visitas/${visit.data.id}/ocorrencias`,
    );
    assert.equal(occurrences.status, 200);
    const occurrenceCreated = await request(
      `/v1/visitas/${visit.data.id}/ocorrencias`,
      { method: "POST", body: JSON.stringify({ tipo: "AGUA_PARADA" }) },
      "AGENTE_CAMPO",
    );
    assert.equal(occurrenceCreated.status, 201);
    const attachmentCreated = await request(
      `/v1/visitas/${visit.data.id}/anexos`,
      { method: "POST", body: JSON.stringify({ nome: "foto.jpg" }) },
      "AGENTE_CAMPO",
    );
    assert.equal(attachmentCreated.status, 201);
    const returnCreated = await request(
      "/v1/retornos",
      {
        method: "POST",
        body: JSON.stringify({ imovelId: "property-1", motivo: "FECHADO" }),
      },
      "AGENTE_CAMPO",
    );
    assert.equal(returnCreated.status, 201);
    const syncCreated = await request(
      "/v1/sincronizacao",
      {
        method: "POST",
        body: JSON.stringify({ operationUuid: "test-operation-1" }),
      },
      "AGENTE_CAMPO",
    );
    assert.equal(syncCreated.status, 201);
  });

  test("território e laboratório mantêm contratos de escrita", async () => {
    const assignment = await request(
      "/v1/atribuicoes",
      {
        method: "POST",
        body: JSON.stringify({
          quarteiraoId: "quarteirao-30",
          aceId: "u-4",
          cicloId: "ciclo-2026-6",
        }),
      },
      "GESTOR",
    );
    assert.equal(assignment.status, 201);
    const sampleResult = await request(
      "/v1/amostras/amostra-1/resultado",
      { method: "POST", body: JSON.stringify({ resultado: "NEGATIVO" }) },
      "LABORATORISTA",
    );
    assert.equal(sampleResult.status, 201);
  });
});
