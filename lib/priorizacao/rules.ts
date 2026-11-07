import type { DemoDecision, DemoTerritory } from "./types";

// Critérios exclusivamente didáticos. A vigilância municipal deve aprovar limiares e condutas antes de qualquer uso real.
export function evaluateDemoTerritory(territory: DemoTerritory): DemoDecision {
  const aumento =
    territory.notificacoesAnteriores > 0 &&
    territory.notificacoesRecentes >= territory.notificacoesAnteriores * 1.5;
  const muitosFocos = territory.focosInformados >= 5;
  const muitasPendencias = territory.imoveisPendentes >= 30;
  const motivos = [
    ...(aumento
      ? [
          "Notificações fictícias aumentaram pelo menos 50% em relação ao período anterior",
        ]
      : []),
    ...(muitosFocos ? ["Cinco ou mais focos fictícios informados"] : []),
    ...(muitasPendencias ? ["Trinta ou mais imóveis fictícios pendentes"] : []),
  ];
  if (aumento && (muitosFocos || muitasPendencias)) {
    return {
      nivel: "Revisão prioritária",
      motivos,
      sugestao:
        "Encaminhar para conferência da vigilância e planejamento da equipe ACE.",
    };
  }
  if (motivos.length > 0) {
    return {
      nivel: "Acompanhar",
      motivos,
      sugestao: "Conferir registros e acompanhar a próxima atualização.",
    };
  }
  return {
    nivel: "Rotina",
    motivos: ["Nenhum critério didático foi acionado"],
    sugestao: "Manter o planejamento regular aprovado pela coordenação.",
  };
}
