import { mappedTerritories } from "./demo-data";

export interface CasaTerritorialDemo {
  id: string;
  territorioId: string;
  codigo: string;
  setor: string;
  situacao: "Aguardando visita" | "Visitado" | "Revisão";
  foco: boolean;
}

/** Dados fictícios: não representam endereços ou coordenadas reais. */
export const casasTerritoriaisDemo: CasaTerritorialDemo[] = mappedTerritories.flatMap(
  (territorio, territorioIndex) =>
    Array.from({ length: 5 }, (_, casaIndex) => ({
      id: `${territorio.id}-casa-${casaIndex + 1}`,
      territorioId: territorio.id,
      codigo: `CASA-${territorio.id.toUpperCase()}-${String(casaIndex + 1).padStart(3, "0")}`,
      setor: `Setor ${String((territorioIndex % 4) + 1).padStart(2, "0")}`,
      situacao: casaIndex === 0 ? "Revisão" : casaIndex % 2 === 0 ? "Visitado" : "Aguardando visita",
      foco: casaIndex === 0 && territorioIndex % 3 === 0,
    })),
);
