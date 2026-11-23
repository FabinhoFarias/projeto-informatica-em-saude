import { IngestionDashboard } from "@/components/ingestao/ingestion-dashboard";
import { apiServices } from "@/app/api/services";

export const instant = false;

export default async function IngestionPage() {
  const data = await apiServices.ingestion();
  return <IngestionDashboard apiData={data} />;
}
