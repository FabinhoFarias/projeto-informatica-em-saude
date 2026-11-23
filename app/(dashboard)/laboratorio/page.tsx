import { LaboratoryWorkspace } from "@/components/laboratorio/laboratory-workspace";
import { apiServerFetch } from "@/app/api/client";
import type { LaboratorySampleMock } from "@/lib/laboratorio/demo-data";

export default async function LaboratoryPage() {
  const samples = await apiServerFetch<LaboratorySampleMock[]>("/v1/amostras");
  return <LaboratoryWorkspace initialSamples={samples} />;
}
