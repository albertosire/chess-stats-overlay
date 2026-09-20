import { Suspense } from "react";
import OverlayClient from "./OverlayClient";

export default function OverlayPage() {
  return (
    <Suspense
      fallback={
        <main className="p-4 text-white">Carregando overlay…</main>
      }
    >
      <OverlayClient />
    </Suspense>
  );
}
