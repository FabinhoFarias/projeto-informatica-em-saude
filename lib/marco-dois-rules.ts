export type DemoTerritory = {
  id: string;
  nome: string;
  distrito: string;
  notificacoesRecentes: number;
  notificacoesAnteriores: number;
  imoveisPendentes: number;
  focosInformados: number;
};

export const demoTerritories: DemoTerritory[] = [
  { id: "ibura", nome: "Ibura", distrito: "DS VI", notificacoesRecentes: 26, notificacoesAnteriores: 11, imoveisPendentes: 41, focosInformados: 8 },
  { id: "boa-viagem", nome: "Boa Viagem", distrito: "DS VI", notificacoesRecentes: 18, notificacoesAnteriores: 13, imoveisPendentes: 29, focosInformados: 5 },
  { id: "casa-amarela", nome: "Casa Amarela", distrito: "DS III", notificacoesRecentes: 12, notificacoesAnteriores: 8, imoveisPendentes: 36, focosInformados: 4 },
  { id: "madalena", nome: "Madalena", distrito: "DS IV", notificacoesRecentes: 5, notificacoesAnteriores: 6, imoveisPendentes: 12, focosInformados: 1 },
];

export type DemoDecision = {
  nivel: "Revisão prioritária" | "Acompanhar" | "Rotina";
  motivos: string[];
  sugestao: string;
};

// Critérios exclusivamente didáticos. A vigilância municipal deve aprovar limiares e condutas antes de qualquer uso real.
export function evaluateDemoTerritory(territory: DemoTerritory): DemoDecision {
  const aumento = territory.notificacoesAnteriores > 0 && territory.notificacoesRecentes >= territory.notificacoesAnteriores * 1.5;
  const muitosFocos = territory.focosInformados >= 5;
  const muitasPendencias = territory.imoveisPendentes >= 30;
  const motivos = [
    ...(aumento ? ["Notificações fictícias aumentaram pelo menos 50% em relação ao período anterior"] : []),
    ...(muitosFocos ? ["Cinco ou mais focos fictícios informados"] : []),
    ...(muitasPendencias ? ["Trinta ou mais imóveis fictícios pendentes"] : []),
  ];
  if (aumento && (muitosFocos || muitasPendencias)) {
    return { nivel: "Revisão prioritária", motivos, sugestao: "Encaminhar para conferência da vigilância e planejamento da equipe ACE." };
  }
  if (motivos.length > 0) {
    return { nivel: "Acompanhar", motivos, sugestao: "Conferir registros e acompanhar a próxima atualização." };
  }
  return { nivel: "Rotina", motivos: ["Nenhum critério didático foi acionado"], sugestao: "Manter o planejamento regular aprovado pela coordenação." };
}
