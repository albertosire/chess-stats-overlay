import { Suspense } from "react";
import OverlayClient from "./OverlayClient";
import { resolveEntitlements } from "@/lib/providers/types";

export default function OverlayPage() {
  return (
    <Suspense
      fallback={
        <main className="p-4 text-white">Carregando overlay…</main>
      }
    >
      <OverlayClient initialEntitlements={resolveEntitlements(false)} />
    </Suspense>
  );
}
