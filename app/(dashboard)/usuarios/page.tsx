import { UsersDashboard } from "@/components/identidade/users-dashboard";
import { apiServerFetch } from "@/app/api/client";
import type { UserAccount } from "@/lib/identidade/types";

export const instant = false;

interface ApiUser {
  id: string;
  nome: string;
  funcao: string;
  status: string;
}

export default async function UsersPage() {
  const users = await apiServerFetch<ApiUser[]>("/v1/usuarios");
  const territories =
    await apiServerFetch<Array<{ name?: string; nome?: string }>>(
      "/v1/territorios",
    );
  const normalized: UserAccount[] = users.map((user, index) => ({
    id: user.id,
    name: user.nome,
    email: `${user.id}@lagoadeitaenga.pe.gov.br`,
    cpf: "",
    role: user.funcao === "CAMPO" ? "AGENTE_CAMPO" : "DIGITADOR",
    territory: "Lagoa de Itaenga",
    municipality: "Lagoa de Itaenga",
    mfa: true,
    status: user.status === "ATIVO" ? "Ativo" : "Inativo",
    lastAccess: "Não informado",
    lastSync: index % 2 === 0 ? "22/11/2026, 09:00" : undefined,
    operationalFunctions: user.funcao === "CAMPO" ? ["CAMPO"] : ["DIGITACAO"],
  }));
  return (
    <UsersDashboard
      initialUsers={normalized}
      territoryNames={territories.map((item) => item.name ?? item.nome ?? "")}
    />
  );
}
