import { Suspense } from "react";
import LoginClient from "./LoginClient";

export default function Page() {
  return (
    <Suspense fallback={<main className="p-8 text-zinc-300">Carregando…</main>}>
      <LoginClient />
    </Suspense>
  );
}
