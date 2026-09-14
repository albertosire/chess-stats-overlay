import { OverlayBuilder } from "@/components/OverlayBuilder";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12 text-zinc-100">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold">Chess Stats Overlay</h1>
        <p className="max-w-3xl text-zinc-400">
          Monte seu painel de estatísticas para transmissões. Configure conta, modalidade e período,
          visualize o resultado e copie a URL HTML, o texto puro ou o JSON para o OBS.
        </p>
        <p className="text-sm text-zinc-500">
          Projeto open source de{" "}
          <a
            href="https://github.com/albertosire"
            className="text-emerald-400 hover:text-emerald-300"
            target="_blank"
            rel="noreferrer"
          >
            Alberto Horta
          </a>
          .
        </p>
      </section>

      <OverlayBuilder />
    </main>
  );
}
