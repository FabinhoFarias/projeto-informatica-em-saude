"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  useEffect(() => {
    if (/autenticar|API|token|sessão/i.test(error.message))
      router.replace("/login");
  }, [error.message, router]);
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <section className="max-w-md border border-slate-200 bg-white p-8 text-center">
        <h1 className="text-xl font-bold text-slate-950">Sessão necessária</h1>
        <p className="mt-2 text-sm text-slate-600">
          Entre novamente para acessar a plataforma.
        </p>
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="mt-5 bg-emerald-800 px-4 py-2 font-semibold text-white"
        >
          Ir para o login
        </button>
      </section>
    </main>
  );
}
