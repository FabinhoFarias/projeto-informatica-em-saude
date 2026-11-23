import { CyclePlanning } from "@/components/planejamento/cycle-planning";
import { apiServices } from "@/app/api/services";

export const instant = false;

export default async function PlanejamentoPage() {
  const cycles = await apiServices.cycles();
  return <CyclePlanning apiData={cycles} />;
}
