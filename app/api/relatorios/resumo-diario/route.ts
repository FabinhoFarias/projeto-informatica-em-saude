import { NextResponse } from "next/server";
import { apiServerFetch } from "@/app/api/client";

export async function GET(request: Request) {
  const requestedDate = new URL(request.url).searchParams.get("data");
  const aceId = new URL(request.url).searchParams.get("aceId");
  const date = requestedDate ?? new Date().toISOString().slice(0, 10);
  const report = await apiServerFetch<Record<string, unknown>>(
    `/v1/relatorios/diario?data=${encodeURIComponent(date)}${aceId ? `&aceId=${encodeURIComponent(aceId)}` : ""}`,
  );
  return NextResponse.json(report, {
    headers: { "Cache-Control": "no-store" },
  });
}
