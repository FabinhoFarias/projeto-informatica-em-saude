import "server-only";
import { connection } from "next/server";

const configuredBaseUrl = process.env.API_BASE_URL?.replace(/\/$/, "");
const baseUrl = configuredBaseUrl ?? "http://localhost:4000";
const password = process.env.SENHA_DEMO ?? "vigia-demo-local";
const tokenCache = new Map<string, { value: string; expiresAt: number }>();
const pendingTokens = new Map<string, Promise<string>>();

async function token(role = "GESTOR") {
  const cached = tokenCache.get(role);
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.value;
  const pending = pendingTokens.get(role);
  if (pending) return pending;

  const request = (async () => {
    const response = await fetch(`${baseUrl}/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        email: "server-renderer@vigia.local",
        password,
        role,
      }),
    });
    if (!response.ok) throw new Error("Não foi possível autenticar na API");
    const body = (await response.json()) as {
      data: { accessToken: string; expiresIn: number };
    };
    tokenCache.set(role, {
      value: body.data.accessToken,
      expiresAt: Date.now() + body.data.expiresIn * 1000,
    });
    return body.data.accessToken;
  })();
  pendingTokens.set(role, request);
  try {
    return await request;
  } finally {
    pendingTokens.delete(role);
  }
}

export async function apiServerFetch<T>(
  path: string,
  options: RequestInit = {},
  role = "GESTOR",
): Promise<T> {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.VERCEL === "1" &&
    !configuredBaseUrl
  ) {
    throw new Error(
      "API_BASE_URL não foi configurada no ambiente de produção.",
    );
  }
  // cacheComponents exige uma marcação explícita antes de dados dependentes
  // de tempo, autenticação ou rede.
  await connection();
  const method = (options.method ?? "GET").toUpperCase();
  const cacheOptions =
    method === "GET"
      ? { next: { revalidate: 20 } }
      : { cache: "no-store" as const };
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    ...cacheOptions,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${await token(role)}`,
    },
  });
  if (!response.ok) throw new Error(`API retornou HTTP ${response.status}`);
  const body = (await response.json()) as { data: T };
  return body.data;
}
