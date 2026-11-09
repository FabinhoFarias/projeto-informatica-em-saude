import { mappedTerritories, municipality } from "@/lib/territorios/demo-data";
import type { UserAccount } from "./types";

export const initialUsers: UserAccount[] = [
  { id: "u-1", name: "Mariana Santos", email: "mariana.santos@saude.itaenga.pe.gov.br", cpf: "12345678901", role: "ADMIN", territory: "Secretaria Municipal de Saúde", municipality: municipality.name, mfa: true, status: "Ativo", lastAccess: "07/10/2026, 09:14" },
  { id: "u-2", name: "Paulo Henrique Lima", email: "paulo.lima@saude.itaenga.pe.gov.br", cpf: "23456789012", role: "GESTOR", territory: "Vigilância Epidemiológica", municipality: municipality.name, mfa: true, status: "Ativo", lastAccess: "07/10/2026, 08:52" },
  { id: "u-3", name: "Camila Ferreira", email: "camila.ferreira@saude.itaenga.pe.gov.br", cpf: "34567890123", role: "EPIDEMIOLOGISTA", territory: mappedTerritories[0].name, municipality: municipality.name, mfa: true, status: "Ativo", lastAccess: "07/10/2026, 08:31" },
  { id: "u-4", name: "João Pedro Alves", email: "joao.alves@saude.itaenga.pe.gov.br", cpf: "45678901234", role: "AGENTE_CAMPO", territory: `${mappedTerritories[1].name} · Microárea 04`, municipality: municipality.name, mfa: true, status: "Ativo", lastAccess: "07/07/2026, 16:20", lastSync: "07/10/2026, 07:48" },
  { id: "u-5", name: "Ana Cláudia Melo", email: "ana.melo@saude.itaenga.pe.gov.br", cpf: "56789012345", role: "AGENTE_CAMPO", territory: `${mappedTerritories[2].name} · Microárea 02`, municipality: municipality.name, mfa: false, status: "Ativo", lastAccess: "05/10/2026, 17:05", lastSync: "06/10/2026, 18:16" },
  { id: "u-8", name: "Lucas Barros", email: "lucas.barros@saude.itaenga.pe.gov.br", cpf: "89012345678", role: "AGENTE_CAMPO", territory: `${mappedTerritories[3].name} · Microárea 01`, municipality: municipality.name, mfa: false, status: "Inativo", lastAccess: "12/08/2026, 11:02", lastSync: "12/08/2026, 10:57" },
  { id: "u-9", name: "Beatriz Nascimento", email: "beatriz.nascimento@saude.itaenga.pe.gov.br", cpf: "09263154809", role: "PROFISSIONAL_APS", territory: `UBS ${mappedTerritories[0].name}`, municipality: municipality.name, mfa: true, status: "Ativo", lastAccess: "07/10/2026, 07:56" },
];
