import { SanitationWorkspace } from "@/components/gestao/sanitation-workspace";
import { apiServices } from "@/app/api/services";

export const instant = false;
export default async function SanitationPage() {
  const data = await apiServices.sanitation();
  return <SanitationWorkspace apiData={data} />;
}
