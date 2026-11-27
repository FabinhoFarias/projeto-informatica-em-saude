import { NextResponse } from "next/server";
import { apiServerFetch } from "@/app/api/client";

export async function GET(request: Request) {
  const requestedDate = new URL(request.url).searchParams.get("data");
  const aceId = new URL(request.url).searchParams.get("aceId");
  const date = requestedDate ?? new Date().toISOString().slice(0, 10);
  const responseData = await apiServerFetch<Record<string, unknown>>(
    `/v1/relatorios/diario?data=${encodeURIComponent(date)}${aceId ? `&aceId=${encodeURIComponent(aceId)}` : ""}`,
  );
  // Aceita também respostas já envelopadas, caso a API esteja sendo executada
  // por uma versão anterior durante o desenvolvimento.
  const report =
    responseData.data && typeof responseData.data === "object"
      ? (responseData.data as Record<string, unknown>)
      : responseData;
  return NextResponse.json(report, {
    headers: { "Cache-Control": "no-store" },
  });
}
