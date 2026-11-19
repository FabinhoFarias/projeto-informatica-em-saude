import { AceProfile } from "@/components/identidade/ace-profile";

// Esta rota depende do identificador do ACE para carregar o histórico correto.
// O modo instantâneo não é aplicável a páginas dinâmicas desse tipo.
export const instant = false;

export default async function AceProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AceProfile id={id} />;
}
