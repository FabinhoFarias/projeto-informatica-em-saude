import { DigitizationWorkspace } from "@/components/digitacao/digitization-workspace";
import { apiServices } from "@/app/api/services";

export const instant = false;

export default async function DigitizationReportsPage() {
  const [forms, daily, weekly, cycle] = await Promise.all([
    apiServices.manualForms(),
    apiServices.dailyReport(),
    apiServices.weeklyReport(),
    apiServices.cycleReport(),
  ]);
  return <DigitizationWorkspace apiData={{ forms, daily, weekly, cycle }} />;
}
