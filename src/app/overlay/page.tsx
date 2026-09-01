import { Suspense } from "react";
import OverlayClient from "./OverlayClient";

export default function OverlayPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-start justify-start bg-transparent p-4">
          <div className="rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white">
            Carregando…
          </div>
        </main>
      }
    >
      <OverlayClient />
    </Suspense>
  );
}
