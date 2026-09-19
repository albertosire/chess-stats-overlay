"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleEmailAuth(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const supabase = createClient();
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          },
        });
        if (error) throw error;
        setMessage("Conta criada. Verifique seu e-mail se a confirmação estiver ativa.");
        router.push(next);
        router.refresh();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(next);
        router.refresh();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha na autenticação.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    setMessage(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) throw error;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha no Google OAuth.");
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-12 text-zinc-100">
      <div className="space-y-2">
        <Link href="/" className="text-sm text-emerald-400 hover:text-emerald-300">
          ← Voltar
        </Link>
        <h1 className="text-3xl font-bold">Entrar</h1>
        <p className="text-sm text-zinc-400">
          Acesse o dashboard para salvar config, copiar o link OBS tokenizado e liberar o Pro.
        </p>
      </div>

      <form
        onSubmit={handleEmailAuth}
        className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6"
      >
        <label className="block space-y-2">
          <span className="text-sm font-medium">E-mail</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 outline-none ring-emerald-500/40 focus:ring-2"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium">Senha</span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 outline-none ring-emerald-500/40 focus:ring-2"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {loading ? "Aguarde…" : mode === "signin" ? "Entrar" : "Criar conta"}
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="w-full text-sm text-zinc-400 hover:text-white"
        >
          {mode === "signin" ? "Criar uma conta" : "Já tenho conta"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => void handleGoogle()}
        disabled={loading}
        className="rounded-lg border border-zinc-700 px-4 py-2 text-sm hover:border-zinc-500 disabled:opacity-50"
      >
        Continuar com Google
      </button>

      {message ? <p className="text-sm text-amber-300">{message}</p> : null}
    </main>
  );
}
