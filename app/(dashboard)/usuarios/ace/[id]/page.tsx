import { AceProfile } from "@/components/identidade/ace-profile";
import { apiServerFetch } from "@/app/api/client";
import type { SectorPropertyMock } from "@/lib/visitas/demo-data";

// Esta rota depende do identificador do ACE para carregar o histórico correto.
// O modo instantâneo não é aplicável a páginas dinâmicas desse tipo.
export const instant = false;

export default async function AceProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const aces =
    await apiServerFetch<
      Array<{ id: string; nome: string; status: string; funcao: string }>
    >("/v1/usuarios/aces");
  const history = await apiServerFetch<{
    visitados: number;
    atribuidos: number;
    pendentes: number;
    cobertura: number;
    retornos: unknown[];
  }>(`/v1/usuarios/aces/${id}/historico`);
  const properties = await apiServerFetch<SectorPropertyMock[]>(
    `/v1/usuarios/aces/${id}/imoveis`,
  );
  return (
    <AceProfile
      ace={aces.find((item) => item.id === id) ?? null}
      history={history}
      properties={properties}
    />
  );
}
