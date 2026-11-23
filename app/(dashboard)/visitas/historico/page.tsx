import { AceVisitHistory } from "@/components/visitas/ace-visit-history";
import { apiServerFetch } from "@/app/api/client";

export const instant = false;

export default async function VisitHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string; semana?: string; cicloId?: string }>;
}) {
  const query = await searchParams;
  const filters = new URLSearchParams();
  for (const key of ["data", "semana", "cicloId"] as const)
    if (query[key]) filters.set(key, query[key]!);
  const [history, cycles] = await Promise.all([
    apiServerFetch<{
      visitas: Array<{
        id: string;
        imovelId?: string;
        acesso?: string;
        createdAt?: string;
      }>;
    }>(`/v1/me/historico?${filters}`, {}, "AGENTE_CAMPO"),
    apiServerFetch<Array<{ id: string; nome: string }>>(
      "/v1/planejamento/ciclos",
      {},
      "AGENTE_CAMPO",
    ),
  ]);
  return <AceVisitHistory visits={history.visitas} cycles={cycles} />;
}
