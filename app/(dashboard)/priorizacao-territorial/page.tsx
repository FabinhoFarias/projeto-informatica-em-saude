import { TerritorialPrioritization } from "@/components/priorizacao/priorizacao-territorial";
import { apiServices } from "@/app/api/services";

export const instant = false;

export default async function TerritorialPrioritizationPage() {
  const data = await apiServices.prioritization();
  return <TerritorialPrioritization apiData={data} />;
}
