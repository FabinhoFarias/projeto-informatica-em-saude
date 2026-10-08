"use client";

import { useMemo, useState, type FormEvent } from "react";
import { MetricCard, PageHeading, Panel } from "@/components/dashboard-ui";
import { municipality } from "@/lib/dashboard-data";
import { roleLabels, roles, type Role } from "@/lib/rbac";

type AccountStatus = "Ativo" | "Inativo";

type UserAccount = {
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
};

type UserForm = Pick<UserAccount, "name" | "email" | "cpf" | "role" | "territory" | "mfa">;

const initialUsers: UserAccount[] = [
  { id: "u-1", name: "Mariana Santos", email: "mariana.santos@saude.recife.pe.gov.br", cpf: "12345678901", role: "ADMIN", territory: "Distrito Sanitário III", municipality: "Recife", mfa: true, status: "Ativo", lastAccess: "07/10/2026, 09:14" },
  { id: "u-2", name: "Paulo Henrique Lima", email: "paulo.lima@saude.recife.pe.gov.br", cpf: "23456789012", role: "GESTOR", territory: "Secretaria Municipal de Saúde", municipality: "Recife", mfa: true, status: "Ativo", lastAccess: "07/10/2026, 08:52" },
  { id: "u-3", name: "Camila Ferreira", email: "camila.ferreira@saude.recife.pe.gov.br", cpf: "34567890123", role: "EPIDEMIOLOGISTA", territory: "Vigilância Epidemiológica", municipality: "Recife", mfa: true, status: "Ativo", lastAccess: "07/10/2026, 08:31" },
  { id: "u-4", name: "João Pedro Alves", email: "joao.alves@saude.recife.pe.gov.br", cpf: "45678901234", role: "AGENTE_CAMPO", territory: "Ibura · Microárea 04", municipality: "Recife", mfa: true, status: "Ativo", lastAccess: "07/07/2026, 16:20", lastSync: "07/10/2026, 07:48" },
  { id: "u-5", name: "Ana Cláudia Melo", email: "ana.melo@saude.recife.pe.gov.br", cpf: "56789012345", role: "AGENTE_CAMPO", territory: "Água Fria · Microárea 02", municipality: "Recife", mfa: false, status: "Ativo", lastAccess: "05/10/2026, 17:05", lastSync: "06/10/2026, 18:16" },
  { id: "u-8", name: "Lucas Barros", email: "lucas.barros@saude.recife.pe.gov.br", cpf: "89012345678", role: "AGENTE_CAMPO", territory: "Várzea · Microárea 01", municipality: "Recife", mfa: false, status: "Inativo", lastAccess: "12/08/2026, 11:02", lastSync: "12/08/2026, 10:57" },
  { id: "u-9", name: "Beatriz Nascimento", email: "beatriz.nascimento@saude.recife.pe.gov.br", cpf: "09263154809", role: "PROFISSIONAL_APS", territory: "USF Ibura", municipality: "Recife", mfa: true, status: "Ativo", lastAccess: "07/10/2026, 07:56" },
];

const territoryOptions = [
  "Secretaria Municipal de Saúde",
  "Vigilância Epidemiológica",
  "Distrito Sanitário I",
  "Distrito Sanitário II",
  "Distrito Sanitário III",
  "Distrito Sanitário IV",
  "Distrito Sanitário V",
  "Distrito Sanitário VI",
  "Distrito Sanitário VII",
  "Distrito Sanitário VIII",
  "Ibura · Microárea 04",
  "Água Fria · Microárea 02",
  "Várzea · Microárea 01",
  "USF Ibura",
  "USF Água Fria",
];

const blankForm: UserForm = {
  name: "",
  email: "",
  cpf: "",
  role: "PROFISSIONAL_APS",
  territory: "",
  mfa: true,
};

function maskCpf(cpf: string) {
  if (cpf.length < 2) return "não informado";
  return `***.***.***-${cpf.slice(-2)}`;
}

function isValidCpf(cpf: string) {
  if (!cpf) return true;
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;

  const calculateDigit = (length: number) => {
    const sum = cpf.slice(0, length).split("").reduce((total, digit, index) => {
      return total + Number(digit) * (length + 1 - index);
    }, 0);
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  return calculateDigit(9) === Number(cpf[9]) && calculateDigit(10) === Number(cpf[10]);
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toLocaleUpperCase("pt-BR");
}

function roleStyle(role: Role) {
  if (role === "ADMIN") return "bg-slate-900 text-white";
  if (role === "GESTOR") return "bg-blue-50 text-blue-800";
  if (role === "EPIDEMIOLOGISTA") return "bg-indigo-50 text-indigo-800";
  if (role === "AGENTE_CAMPO") return "bg-teal-50 text-teal-800";
  return "bg-slate-100 text-slate-700";
}

function formatLastSync(lastSync?: string) {
  if (!lastSync) return { label: "Não se aplica", recent: false };
  const [date] = lastSync.split(", ");
  const [day, month, year] = date.split("/").map(Number);
  const syncDate = new Date(year, month - 1, day);
  const currentDate = new Date(2026, 9, 7);
  const daysAgo = Math.round((currentDate.getTime() - syncDate.getTime()) / 86_400_000);
  return { label: daysAgo === 0 ? `Hoje, ${lastSync.split(", ")[1]}` : `${lastSync} · há ${daysAgo} dia(s)`, recent: daysAgo <= 1 };
}

export function UsersDashboard() {
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("Todos os perfis");
  const [territoryFilter, setTerritoryFilter] = useState("Todos os territórios");
  const [statusFilter, setStatusFilter] = useState("Todos os status");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [form, setForm] = useState<UserForm>(blankForm);
  const [formError, setFormError] = useState("");
  const [actionNotice, setActionNotice] = useState("");

  const municipalUsers = useMemo(
    () => users.filter((user) => user.municipality === municipality.name),
    [users],
  );

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
    return municipalUsers.filter((user) => {
      const matchesQuery = !normalizedQuery || [
        user.name,
        user.email,
        maskCpf(user.cpf),
        roleLabels[user.role],
      ].some((value) => value.toLocaleLowerCase("pt-BR").includes(normalizedQuery));
      const matchesRole = roleFilter === "Todos os perfis" || user.role === roleFilter;
      const matchesTerritory = territoryFilter === "Todos os territórios" || user.territory === territoryFilter;
      const matchesStatus = statusFilter === "Todos os status" || user.status === statusFilter;
      return matchesQuery && matchesRole && matchesTerritory && matchesStatus;
    });
  }, [municipalUsers, query, roleFilter, statusFilter, territoryFilter]);

  const activeCount = municipalUsers.filter((user) => user.status === "Ativo").length;
  const agentCount = municipalUsers.filter((user) => user.role === "AGENTE_CAMPO").length;
  const mfaCount = municipalUsers.filter((user) => user.mfa && user.status === "Ativo").length;
  const syncedToday = municipalUsers.filter((user) => user.role === "AGENTE_CAMPO" && user.lastSync?.startsWith("07/10/2026")).length;
  const roleDistribution = `${municipalUsers.filter((user) => user.role === "GESTOR").length} gestores · ${municipalUsers.filter((user) => user.role === "EPIDEMIOLOGISTA").length} epidemiologistas · ${municipalUsers.filter((user) => user.role === "PROFISSIONAL_APS").length} APS · ${municipalUsers.filter((user) => user.role === "ADMIN").length} admins`;

  const openCreateForm = () => {
    setEditingUser(null);
    setForm({ ...blankForm });
    setFormError("");
    setIsEditorOpen(true);
  };

  const openEditForm = (user: UserAccount) => {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      cpf: user.cpf,
      role: user.role,
      territory: user.territory,
      mfa: user.mfa,
    });
    setFormError("");
    setIsEditorOpen(true);
  };

  const saveUser = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = form.name.trim();
    const email = form.email.trim().toLocaleLowerCase("pt-BR");
    const duplicateEmail = users.some((user) => user.email.toLocaleLowerCase("pt-BR") === email && user.id !== editingUser?.id);

    if (name.length < 2) {
      setFormError("Informe o nome completo do usuário.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError("Informe um endereço de e-mail válido.");
      return;
    }
    if (duplicateEmail) {
      setFormError("Já existe um usuário cadastrado com este e-mail.");
      return;
    }
    if (!isValidCpf(form.cpf) && form.cpf !== editingUser?.cpf) {
      setFormError("Informe um CPF válido ou deixe o campo em branco.");
      return;
    }
    if (!form.territory) {
      setFormError("Selecione o território ou unidade de saúde vinculada ao usuário.");
      return;
    }
    if (!territoryOptions.includes(form.territory)) {
      setFormError("Selecione uma unidade ou território do Recife.");
      return;
    }

    if (editingUser) {
      setUsers((current) => current.map((user) => user.id === editingUser.id
        ? { ...user, ...form, name, email, municipality: municipality.name }
        : user));
      setActionNotice(`Perfil de ${name} atualizado.`);
    } else {
      const newUser: UserAccount = {
        id: `u-${Date.now()}`,
        ...form,
        name,
        email,
        municipality: municipality.name,
        status: "Ativo",
        lastAccess: "Ainda não acessou",
      };
      setUsers((current) => [newUser, ...current]);
      setActionNotice(`Usuário ${name} cadastrado.`);
    }
    setEditingUser(null);
    setIsEditorOpen(false);
  };

  const toggleUserStatus = (user: UserAccount) => {
    const nextStatus: AccountStatus = user.status === "Ativo" ? "Inativo" : "Ativo";
    setUsers((current) => current.map((item) => item.id === user.id ? { ...item, status: nextStatus } : item));
    setActionNotice(`Acesso de ${user.name} ${nextStatus === "Ativo" ? "ativado" : "desativado"}.`);
  };

  const resetPassword = (user: UserAccount) => {
    setActionNotice(`Solicitação demonstrativa de redefinição de senha criada para ${user.email}.`);
  };

  return (
    <div>
      <PageHeading
        eyebrow={`Administração · ${municipality.name}, ${municipality.state} · Controle de acesso`}
        title="Gestão de usuários"
        description="Gerencie contas, perfis e vínculos territoriais dos profissionais com acesso à plataforma."
        action={<button type="button" onClick={openCreateForm} className="min-h-10 bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800">Cadastrar usuário</button>}
      />

      <section aria-label="Métricas de acesso" className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Usuários ativos no município" value={`${activeCount}`} detail={`${municipalUsers.length} contas cadastradas`} />
        <MetricCard label="Agentes de campo" value={`${agentCount}`} detail={roleDistribution} />
        <MetricCard label="MFA habilitado" value={`${mfaCount} de ${activeCount}`} detail="Contas ativas com autenticação multifator" />
        <MetricCard label="Agentes sincronizados hoje" value={`${syncedToday} de ${agentCount}`} detail="Última sincronização do aplicativo móvel" />
      </section>

      <Panel
        title="Usuários cadastrados"
        description={`${filteredUsers.length} resultado(s) · instância municipal de ${municipality.name}`}
        action={<span className="bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">Acesso administrativo</span>}
      >
        <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="xl:col-span-1">
            <label htmlFor="user-search" className="mb-1.5 block text-xs font-medium text-slate-600">Buscar usuário</label>
            <input id="user-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nome, e-mail ou CPF" className="min-h-10 w-full border border-slate-200 px-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
          </div>
          <div>
            <label htmlFor="role-filter" className="mb-1.5 block text-xs font-medium text-slate-600">Perfil</label>
            <select id="role-filter" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="min-h-10 w-full border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100">
              <option>Todos os perfis</option>
              {roles.map((role) => <option key={role} value={role}>{roleLabels[role]}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="territory-filter" className="mb-1.5 block text-xs font-medium text-slate-600">Unidade / território</label>
            <select id="territory-filter" value={territoryFilter} onChange={(event) => setTerritoryFilter(event.target.value)} className="min-h-10 w-full border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100">
              <option>Todos os territórios</option>
              {[...new Set(municipalUsers.map((user) => user.territory))].sort((a, b) => a.localeCompare(b, "pt-BR")).map((territory) => <option key={territory}>{territory}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="status-filter" className="mb-1.5 block text-xs font-medium text-slate-600">Status</label>
            <select id="status-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="min-h-10 w-full border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100">
              <option>Todos os status</option>
              <option>Ativo</option>
              <option>Inativo</option>
            </select>
          </div>
        </div>

        {actionNotice && (
          <div role="status" className="mb-4 flex items-center justify-between gap-3 border-l-2 border-blue-700 bg-blue-50 px-3 py-2 text-sm text-blue-900">
            <span>{actionNotice}</span>
            <button type="button" onClick={() => setActionNotice("")} aria-label="Fechar aviso" className="px-1 text-blue-800">×</button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-500">
                <th className="py-3 pr-4 font-semibold">Usuário</th>
                <th className="py-3 pr-4 font-semibold">Perfil / papel</th>
                <th className="py-3 pr-4 font-semibold">Território atribuído</th>
                <th className="py-3 pr-4 font-semibold">Autenticação MFA</th>
                <th className="py-3 pr-4 font-semibold">Último acesso</th>
                <th className="py-3 pr-4 font-semibold">Sincronização app</th>
                <th className="py-3 pr-4 font-semibold">Status</th>
                <th className="py-3 font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => {
                const sync = formatLastSync(user.lastSync);
                return (
                  <tr key={user.id} className={`align-top hover:bg-slate-50 ${user.status === "Inativo" ? "opacity-65" : ""}`}>
                    <td className="py-4 pr-4">
                      <div className="flex min-w-[230px] items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center bg-slate-100 text-xs font-semibold text-slate-700">{initials(user.name)}</span>
                        <span className="min-w-0">
                          <span className="block font-semibold text-slate-900">{user.name}</span>
                          <span className="mt-0.5 block truncate text-xs text-slate-500">{user.email}</span>
                          <span className="mt-0.5 block text-[11px] text-slate-400">CPF {maskCpf(user.cpf)}</span>
                        </span>
                      </div>
                    </td>
                    <td className="py-4 pr-4"><span className={`inline-flex max-w-[190px] px-2 py-1 text-xs font-semibold ${roleStyle(user.role)}`}>{roleLabels[user.role]}</span></td>
                    <td className="py-4 pr-4"><span className="block max-w-[190px] text-slate-700">{user.territory}</span><span className="mt-0.5 block text-xs text-slate-500">{user.municipality} · PE</span></td>
                    <td className="py-4 pr-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold ${user.mfa ? "bg-blue-50 text-blue-800" : "bg-slate-100 text-slate-600"}`}>
                        {user.mfa ? "MFA ativo" : "Pendente"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap py-4 pr-4 text-xs text-slate-600">{user.lastAccess}</td>
                    <td className="py-4 pr-4">
                      {user.lastSync
                        ? <span className="text-xs text-slate-600">{sync.label}</span>
                        : <span className="text-xs text-slate-400">Não se aplica</span>}
                    </td>
                    <td className="py-4 pr-4"><span className={`inline-flex items-center gap-1.5 text-xs font-medium ${user.status === "Ativo" ? "text-slate-700" : "text-slate-500"}`}><span className={`h-1.5 w-1.5 rounded-full ${user.status === "Ativo" ? "bg-blue-700" : "bg-slate-400"}`} />{user.status}</span></td>
                    <td className="py-4">
                      <div className="flex min-w-[210px] flex-wrap gap-1.5">
                        <button type="button" onClick={() => openEditForm(user)} className="border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100">Editar perfil</button>
                        <button type="button" onClick={() => resetPassword(user)} className="border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100">Redefinir senha</button>
                        <button type="button" onClick={() => toggleUserStatus(user)} className={`border px-2 py-1 text-xs font-medium ${user.status === "Ativo" ? "border-slate-200 text-slate-600 hover:bg-slate-100" : "border-blue-200 text-blue-800 hover:bg-blue-50"}`}>
                          {user.status === "Ativo" ? "Desativar" : "Reativar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredUsers.length === 0 && (
                <tr><td colSpan={8} className="py-12 text-center text-sm text-slate-500">Nenhum usuário corresponde aos filtros selecionados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs leading-5 text-slate-500">CPFs são mascarados para reduzir a exposição de dados pessoais. Os dados desta listagem são demonstrativos.</p>
      </Panel>

      {isEditorOpen && (
        <UserEditor
          key={editingUser?.id ?? "new-user"}
          editing={editingUser !== null}
          form={form}
          error={formError}
          territories={territoryOptions}
          onChange={setForm}
          onClose={() => { setEditingUser(null); setFormError(""); setIsEditorOpen(false); }}
          onSubmit={saveUser}
        />
      )}
    </div>
  );
}

function UserEditor({
  editing,
  form,
  error,
  territories,
  onChange,
  onClose,
  onSubmit,
}: {
  editing: boolean;
  form: UserForm;
  error: string;
  territories: string[];
  onChange: (form: UserForm) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="user-editor-title" className="max-h-[95dvh] w-full max-w-2xl overflow-y-auto border border-slate-200 bg-white p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Controle de acesso</p>
            <h2 id="user-editor-title" className="mt-2 text-xl font-bold text-slate-950">{editing ? "Editar usuário" : "Cadastrar usuário"}</h2>
            <p className="mt-1 text-sm text-slate-500">Defina o perfil, o território de atuação e os requisitos de autenticação.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar formulário" className="grid h-9 w-9 shrink-0 place-items-center border border-slate-200 text-lg text-slate-500 hover:bg-slate-50">×</button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="user-name" className="mb-1.5 block text-sm font-medium text-slate-700">Nome completo</label>
              <input id="user-name" required minLength={2} value={form.name} onChange={(event) => onChange({ ...form, name: event.target.value })} autoComplete="name" className="min-h-11 w-full border border-slate-200 px-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <label htmlFor="user-email" className="mb-1.5 block text-sm font-medium text-slate-700">E-mail institucional</label>
              <input id="user-email" required type="email" value={form.email} onChange={(event) => onChange({ ...form, email: event.target.value })} autoComplete="email" className="min-h-11 w-full border border-slate-200 px-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <label htmlFor="user-cpf" className="mb-1.5 block text-sm font-medium text-slate-700">CPF</label>
              <input id="user-cpf" inputMode="numeric" maxLength={11} value={form.cpf} onChange={(event) => onChange({ ...form, cpf: event.target.value.replace(/\D/g, "").slice(0, 11) })} placeholder="Somente números" className="min-h-11 w-full border border-slate-200 px-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <label htmlFor="user-role" className="mb-1.5 block text-sm font-medium text-slate-700">Perfil / papel</label>
              <select id="user-role" value={form.role} onChange={(event) => onChange({ ...form, role: event.target.value as Role })} className="min-h-11 w-full border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100">
                {roles.map((role) => <option key={role} value={role}>{role} · {roleLabels[role]}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="user-territory" className="mb-1.5 block text-sm font-medium text-slate-700">Território / unidade / microárea</label>
              <select id="user-territory" required value={form.territory} onChange={(event) => onChange({ ...form, territory: event.target.value })} className="min-h-11 w-full border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100">
                <option value="">Selecione o território de atuação</option>
                {territories.map((territory) => <option key={territory}>{territory}</option>)}
              </select>
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-3 border border-slate-200 p-3">
            <input type="checkbox" checked={form.mfa} onChange={(event) => onChange({ ...form, mfa: event.target.checked })} className="mt-0.5 h-4 w-4 accent-blue-700" />
            <span><span className="block text-sm font-medium text-slate-800">Exigir autenticação multifator (MFA)</span><span className="mt-1 block text-xs leading-5 text-slate-500">O usuário deverá configurar um segundo fator no próximo acesso.</span></span>
          </label>

          {error && <p role="alert" className="border-l-2 border-red-700 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button type="button" onClick={onClose} className="min-h-10 border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancelar</button>
            <button type="submit" className="min-h-10 bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800">{editing ? "Salvar alterações" : "Cadastrar usuário"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
