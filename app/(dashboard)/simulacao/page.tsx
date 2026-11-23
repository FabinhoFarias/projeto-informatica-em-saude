import { SimulationDashboard } from "@/components/planejamento/simulation-dashboard";
import { apiServices } from "@/app/api/services";

export const instant = false;

export default async function SimulationPage() {
  const [territories, coverage] = await Promise.all([
    apiServices.territories(),
    apiServices.dashboard(),
  ]);
  return <SimulationDashboard apiData={{ territories, coverage }} />;
}
