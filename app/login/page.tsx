"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "vigia@email.com",
          password,
          role: "GESTOR",
        }),
      });
      const body = (await response.json()) as {
        data?: { accessToken?: string };
        error?: string;
      };
      if (!response.ok || !body.data?.accessToken) {
        throw new Error(body.error ?? "Não foi possível entrar na plataforma.");
      }
      localStorage.setItem("vigia.accessToken", body.data.accessToken);
      const redirect = new URLSearchParams(window.location.search).get(
        "redirect",
      );
      router.push(redirect || "/painel");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao entrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <section className="w-full max-w-md border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">
          VIGIA+
        </p>
        <h1 className="mt-3 text-2xl font-bold text-slate-950">
          Entrar na plataforma
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Acesse o ambiente demonstrativo de Lagoa de Itaenga.
        </p>
        <form onSubmit={submit} className="mt-7 space-y-4">
          <label className="block text-sm font-semibold text-slate-700">
            E-mail
            <input
              readOnly
              value="vigia@email.com"
              className="mt-1 h-11 w-full border border-slate-300 bg-slate-50 px-3 text-slate-700"
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Senha
            <input
              required
              minLength={8}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 h-11 w-full border border-slate-300 px-3"
              autoComplete="current-password"
            />
          </label>
          {error && (
            <p role="alert" className="bg-red-50 p-3 text-sm text-red-800">
              {error}
            </p>
          )}
          <button
            disabled={loading}
            className="h-11 w-full bg-emerald-800 px-4 font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}
