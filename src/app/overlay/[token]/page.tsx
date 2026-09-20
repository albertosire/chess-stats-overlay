import Link from "next/link";

export default function DeprecatedTokenOverlayPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-transparent p-6 text-foreground">
      <div className="max-w-md rounded-2xl border border-border bg-card p-6 text-center">
        <h1 className="font-serif text-lg text-foreground">Link tokenizado descontinuado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          O overlay agora é 100% gratuito e open source. Monte a URL no builder e cole no OBS —
          a configuração vai na query string.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Ir para o builder
        </Link>
      </div>
    </main>
  );
}
