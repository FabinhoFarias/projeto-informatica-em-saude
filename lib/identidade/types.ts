import type { Role } from "./permissions";

export type AccountStatus = "Ativo" | "Inativo";

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
}

export type UserForm = Pick<
  UserAccount,
  "name" | "email" | "cpf" | "role" | "territory" | "mfa"
>;
