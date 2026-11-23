import { VisitsWorkspace } from "@/components/visitas/visits-workspace";
import { apiServerFetch } from "@/app/api/client";
import type { SectorPropertyMock } from "@/lib/visitas/demo-data";

export const instant = false;

export default async function VisitsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const query = await searchParams;
  const page = Math.max(1, Number(query.page ?? 1) || 1);
  const pageSize = 150;
  const properties = await apiServerFetch<SectorPropertyMock[]>(
    `/v1/imoveis?page=${page}&limit=${pageSize}`,
  );
  return (
    <VisitsWorkspace
      properties={properties}
      currentPage={page}
      totalPages={Math.ceil(996 / pageSize)}
    />
  );
}
