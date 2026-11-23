"use server";

import { apiServerFetch } from "@/app/api/client";

export async function saveVisitThroughApi(
  imovelId: string,
  cicloId: string,
  payload: Record<string, unknown>,
) {
  return apiServerFetch<{ id: string; status: string }>(
    "/v1/visitas",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, imovelId, cicloId }),
    },
    "AGENTE_CAMPO",
  );
}
