import type { RiskLevel } from "./types";

export const riskColors: Record<
  RiskLevel,
  { foreground: string; background: string }
> = {
  Baixo: { foreground: "#2E7D32", background: "#E8F5E9" },
  Médio: { foreground: "#F57F17", background: "#FFFDE7" },
  Alto: { foreground: "#E65100", background: "#FFF3E0" },
  Crítico: { foreground: "#C62828", background: "#FFEBEE" },
};
