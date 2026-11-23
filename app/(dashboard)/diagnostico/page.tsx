import { DiagnosisDashboard } from "@/components/vigilancia/diagnosis-dashboard";
import { apiServices } from "@/app/api/services";

export const instant = false;

export default async function DiagnosisPage() {
  const data = await apiServices.diagnosis();
  return <DiagnosisDashboard apiData={data} />;
}
