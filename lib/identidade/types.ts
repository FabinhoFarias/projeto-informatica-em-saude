import type { Role } from "./permissions";

export type AccountStatus = "Ativo" | "Inativo";

export interface TerritorialAssignment {
  sectorCode?: string;
  sectorName?: string;
  microareaCode?: string;
  microareaName?: string;
  localityCode?: string;
  localityName?: string;
  blockCodes: string[];
  source: "sispncd" | "sisloc" | "municipal" | "manual";
  sourceFile?: string;
  validFrom?: string;
  validUntil?: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  cpf: string;
  role: Role;
  territory: string;
  municipality: string;
  mfa: boolean;
  status: AccountStatus;
  lastAccess: string;
  lastSync?: string;
  territorialAssignments?: TerritorialAssignment[];
}

export type UserForm = Pick<
  UserAccount,
  "name" | "email" | "cpf" | "role" | "territory" | "mfa"
>;
