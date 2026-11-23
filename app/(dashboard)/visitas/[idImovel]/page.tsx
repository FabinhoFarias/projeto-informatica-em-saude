import { notFound } from "next/navigation";
import { PropertyVisitForm } from "@/components/visitas/property-visit-form";
import { apiServerFetch } from "@/app/api/client";
import type { SectorPropertyMock } from "@/lib/visitas/demo-data";
import { saveVisitThroughApi } from "../actions";

// A ficha depende do imóvel e do ciclo definidos na URL.
export const instant = false;

export default async function PropertyVisitPage({
  params,
  searchParams,
}: {
  params: Promise<{ idImovel: string }>;
  searchParams: Promise<{ ciclo?: string }>;
}) {
  const [{ idImovel }, query] = await Promise.all([params, searchParams]);
  let property: SectorPropertyMock;
  try {
    property = await apiServerFetch<SectorPropertyMock>(`/v1/imoveis/${idImovel}`);
  } catch {
    notFound();
  }
  const cycle =
    query.ciclo ??
    `${new Date().getFullYear()}-${Math.floor(new Date().getMonth() / 2) + 1}`;
  const saveVisit = saveVisitThroughApi.bind(null, idImovel, cycle);
  return <PropertyVisitForm property={property} cycle={cycle} saveVisit={saveVisit} />;
}
