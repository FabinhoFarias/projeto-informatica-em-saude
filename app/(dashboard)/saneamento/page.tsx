import { SanitationWorkspace } from "@/components/gestao/sanitation-workspace";
import { apiServices } from "@/app/api/services";

export const instant = false;
export default async function SanitationPage() {
  const data = await apiServices.sanitation();
  const fallback = [
    {
      id: "fallback-san-001",
      tipo: "Água parada em terreno baldio",
      endereco: "Rua das Palmeiras, 100",
      bairro: "Centro",
      responsavel: "Vigilância Ambiental",
      prazo: "2026-11-28",
      status: "ABERTO",
      observacoes: "Registro demonstrativo.",
    },
  ];
  return (
    <SanitationWorkspace
      apiData={Array.isArray(data) && data.length ? data : fallback}
    />
  );
}
