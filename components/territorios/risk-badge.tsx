import type { CSSProperties } from "react";
import { riskColors } from "@/lib/territorios/risk";
import type { RiskLevel } from "@/lib/territorios/types";

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  const colors = riskColors[risk];
  return (
    <span
      className="inline-flex items-center gap-2 px-2.5 py-1 text-xs font-semibold"
      style={{ color: colors.foreground, backgroundColor: colors.background }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: colors.foreground }}
      />
      {risk}
    </span>
  );
}

export function RiskText({ risk }: { risk: RiskLevel }) {
  const colors = riskColors[risk];
  return (
    <span style={{ color: colors.foreground } as CSSProperties}>{risk}</span>
  );
}
