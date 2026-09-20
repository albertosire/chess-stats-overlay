import Link from "next/link";

export default function DeprecatedTokenOverlayPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-transparent p-6 text-zinc-100">
      <div className="max-w-md rounded-2xl border border-zinc-700 bg-black/70 p-6 text-center">
        <h1 className="text-lg font-semibold text-white">Link tokenizado descontinuado</h1>
        <p className="mt-2 text-sm text-zinc-400">
          O overlay agora é 100% gratuito e open source. Monte a URL no builder e cole no OBS —
          a configuração vai na query string.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          Ir para o builder
        </Link>
      </div>
    </main>
  );
}
