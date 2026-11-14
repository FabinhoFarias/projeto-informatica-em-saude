import { NextResponse } from "next/server";
import {
  availableDailyReportDates,
  buildDailyReport,
  defaultDailyReportDate,
} from "@/lib/visitas/daily-report";

export async function GET(request: Request) {
  const requestedDate = new URL(request.url).searchParams.get("data");
  const dates = availableDailyReportDates();
  const date =
    requestedDate && dates.includes(requestedDate)
      ? requestedDate
      : dates.includes(defaultDailyReportDate)
        ? defaultDailyReportDate
        : dates[0];

  if (!date) {
    return NextResponse.json(
      { error: "Nenhuma visita disponível para o relatório." },
      { status: 404 },
    );
  }

  return NextResponse.json(buildDailyReport(date), {
    headers: { "Cache-Control": "no-store" },
  });
}
