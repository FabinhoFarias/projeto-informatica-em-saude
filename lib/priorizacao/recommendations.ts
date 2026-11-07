import type { Neighborhood } from "@/lib/territorios/types";

export const recommendationsFor = (neighborhood: Neighborhood) => {
  if (neighborhood.risk === "Crítico") {
    return [
      `Intensificar bloqueio de vetor nas quadras prioritárias de ${neighborhood.name} nas próximas 48h.`,
      "Alocar 5 agentes suplementares para aplicação de larvicida e vistoria domiciliar.",
      "Acionar a unidade de APS local para busca ativa de casos febris.",
    ];
  }

  if (neighborhood.risk === "Alto") {
    return [
      `Programar vistoria focal em ${neighborhood.name} nas próximas 72h.`,
      "Reforçar equipes ACE em imóveis com focos recorrentes.",
      "Monitorar atendimentos febris na unidade de APS de referência.",
    ];
  }

  return [
    `Manter rotina de visitas domiciliares em ${neighborhood.name}.`,
    "Revisar focos identificados na última rodada de LIRAa/LIA.",
    "Acompanhar a tendência de notificações na próxima semana epidemiológica.",
  ];
};
