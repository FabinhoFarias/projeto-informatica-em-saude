import { VisitsWorkspace } from "@/components/visitas/visits-workspace";
import { apiServerFetch } from "@/app/api/client";
import type { SectorPropertyMock } from "@/lib/visitas/demo-data";

export const instant = false;

export default async function VisitsPage({
  searchParams: _searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const properties = await apiServerFetch<SectorPropertyMock[]>(
    "/v1/imoveis?limit=1000",
  );
  return <VisitsWorkspace properties={properties} />;
}
