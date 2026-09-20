import { KofiLink } from "@/components/KofiLink";
import { OverlayBuilder } from "@/components/OverlayBuilder";

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card/80">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <p className="font-serif text-lg text-foreground">Chess Stats Overlay</p>
          <KofiLink compact />
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-10">
        <section className="space-y-3">
          <h1 className="font-serif text-4xl leading-tight text-foreground">
            Monte o overlay da live
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Overlay gratuito e open source para OBS com estatísticas Chess.com e Lichess. Δ ELO,
            win rate, streak, dual site, paletas, alertas e logo. A configuração fica no seu
            navegador; a URL do OBS carrega os parâmetros.
          </p>
          <p className="text-sm text-muted-foreground">
            Projeto open source de{" "}
            <a
              href="https://github.com/albertosire"
              className="text-accent underline-offset-4 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Alberto Horta
            </a>
            .
          </p>
        </section>

        <OverlayBuilder />

        <footer className="flex flex-col items-start gap-3 border-t border-border py-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Se o overlay te ajuda na live, um café no Ko-fi mantém o projeto no ar.
          </p>
          <KofiLink />
        </footer>
      </main>
    </div>
  );
}
