import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { subscriptionIsPro } from "@/lib/billing/entitlements";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { signOut } from "./actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const [{ data: config }, { data: accounts }, { data: subscription }, { data: themes }] =
    await Promise.all([
      supabase.from("overlay_configs").select("*").eq("user_id", user.id).single(),
      supabase.from("linked_accounts").select("*").eq("user_id", user.id),
      supabase.from("subscriptions").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("theme_purchases").select("theme_id").eq("user_id", user.id),
    ]);

  if (!config) {
    return (
      <main className="p-8 text-amber-300">
        Perfil incompleto. Faça logout e entre novamente para recriar o perfil.
        <form action={signOut} className="mt-4">
          <button className="rounded-lg bg-zinc-800 px-4 py-2">Sair</button>
        </form>
      </main>
    );
  }

  const isPro = subscriptionIsPro(subscription);
  const ownedThemes = (themes ?? []).map((t) => t.theme_id);

  return (
    <main className="mx-auto min-h-screen max-w-6xl space-y-8 px-6 py-10 text-zinc-100">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/" className="text-sm text-emerald-400 hover:text-emerald-300">
            ← Home
          </Link>
          <h1 className="mt-2 text-3xl font-bold">Dashboard</h1>
          <p className="text-sm text-zinc-400">{user.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              isPro ? "bg-emerald-500/20 text-emerald-300" : "bg-zinc-800 text-zinc-300"
            }`}
          >
            {isPro ? "PRO" : "FREE"}
          </span>
          <form action={signOut}>
            <button type="submit" className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm">
              Sair
            </button>
          </form>
        </div>
      </header>

      <DashboardClient
        config={config}
        accounts={accounts ?? []}
        isPro={isPro}
        ownedThemes={ownedThemes}
        kofiUrl={process.env.NEXT_PUBLIC_KOFI_URL ?? "https://ko-fi.com"}
      />
    </main>
  );
}
