import { notFound } from "next/navigation";
import { PropertyVisitForm } from "@/components/visitas/property-visit-form";
import { sectorPropertiesDemo } from "@/lib/visitas/demo-data";

export default async function PropertyVisitPage({
  params,
  searchParams,
}: {
  params: Promise<{ idImovel: string }>;
  searchParams: Promise<{ ciclo?: string }>;
}) {
  const [{ idImovel }, query] = await Promise.all([params, searchParams]);
  const property = sectorPropertiesDemo.find((item) => item.id === idImovel);
  if (!property) notFound();
  const cycle =
    query.ciclo ??
    `${new Date().getFullYear()}-${Math.floor(new Date().getMonth() / 2) + 1}`;
  return <PropertyVisitForm property={property} cycle={cycle} />;
}
