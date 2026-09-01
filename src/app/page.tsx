import { OverlayBuilder } from "@/components/OverlayBuilder";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12 text-zinc-100">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold">Chess Stats Overlay</h1>
        <p className="max-w-3xl text-zinc-400">
          Monte seu painel de estatísticas para transmissões. Configure conta, modalidade e período,
          visualize o resultado e copie a URL ou o snippet HTML para usar no OBS ou em qualquer
          destino compatível.
        </p>
      </section>

      <OverlayBuilder />
    </main>
  );
}
