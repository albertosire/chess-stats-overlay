import { KOFI_URL } from "@/lib/kofi";

function CoffeeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      <path d="M6 2v2M10 2v2M14 2v2" />
    </svg>
  );
}

export function KofiLink({ compact = false, label }: { compact?: boolean; label: string }) {
  return (
    <a
      href={KOFI_URL}
      target="_blank"
      rel="noreferrer"
      className={
        compact
          ? "inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground transition hover:border-accent hover:text-accent"
          : "inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition hover:opacity-90"
      }
    >
      <CoffeeIcon className="h-4 w-4" />
      {label}
    </a>
  );
}
