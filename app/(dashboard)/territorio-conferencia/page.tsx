import {
  TerritoryReview,
  type TerritoryReviewAce,
  type TerritoryReviewBlock,
} from "@/components/gestao/territory-review";
import { apiServerFetch } from "@/app/api/client";
import type { TerritoryReviewItem } from "@/lib/gestao/operations-data";
import type { SectorPropertyMock } from "@/lib/visitas/demo-data";

export const instant = false;

interface ApiAce {
  id: string;
  nome: string;
}
interface ApiTerritory {
  id: string;
  name: string;
  zona: string;
}
interface ApiBlock {
  id: string;
  numero: number;
  bairro: string;
}
interface ApiAssignment {
  quarteiraoId?: string;
  aceId?: string;
}

export default async function TerritoryReviewPage() {
  const apiAces = await apiServerFetch<ApiAce[]>("/v1/usuarios/aces");
  const territories = await apiServerFetch<ApiTerritory[]>("/v1/territorios");
  const apiBlocks = await apiServerFetch<ApiBlock[]>("/v1/quarteiroes");
  const apiAssignments =
    await apiServerFetch<ApiAssignment[]>("/v1/atribuicoes");
  const properties = await apiServerFetch<SectorPropertyMock[]>(
    "/v1/imoveis?page=1&limit=200",
  );

  const aces: TerritoryReviewAce[] = apiAces.map((ace) => ({
    id: ace.id,
    name: ace.nome,
  }));
  const territoryByName = new Map(territories.map((item) => [item.name, item]));
  const territoryById = new Map(territories.map((item) => [item.id, item]));
  const blocks: TerritoryReviewBlock[] = apiBlocks.map((block) => {
    const territory = territoryByName.get(block.bairro);
    const count = properties.filter(
      (property) => Number(property.quarteirao) === block.numero,
    ).length;
    return {
      id: block.id,
      number: block.numero,
      neighborhood: block.bairro,
      territoryId: territory?.id ?? block.bairro,
      zone: territory?.zona ?? "Urbana",
      properties: count || 33,
    };
  });
  const initialAssignments = Object.fromEntries(
    apiAssignments
      .filter((item) => item.quarteiraoId && item.aceId)
      .map((item) => [item.quarteiraoId!, item.aceId!]),
  );
  const initialItems: TerritoryReviewItem[] = properties
    .slice(0, 50)
    .map((property) => ({
      id: property.id,
      street: property.logradouro,
      number: property.numero,
      neighborhood:
        territoryById.get(property.territorioId)?.name ?? property.territorioId,
      sector: property.setor,
      block: Number(property.quarteirao),
      status:
        property.situacaoCadastral === "EM_CONFERENCIA"
          ? "CONFERIR"
          : "VALIDADO",
      issue:
        property.situacaoCadastral === "EM_CONFERENCIA"
          ? "Cadastro marcado para conferência territorial."
          : "",
    }));

  return (
    <TerritoryReview
      initialItems={initialItems}
      aces={aces}
      blocks={blocks}
      initialAssignments={initialAssignments}
    />
  );
}
