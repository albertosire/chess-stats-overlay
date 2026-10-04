import { chessComAffiliateHref, type ChessComAffiliatePlacement } from "@/lib/chesscom-affiliate";
import { cn } from "@/lib/utils";

export function ChessComAffiliateLine({
  placement,
  linkLabel,
  disclosure,
  className,
}: {
  placement: ChessComAffiliatePlacement;
  linkLabel: string;
  disclosure: string;
  className?: string;
}) {
  const href = chessComAffiliateHref(placement);
  if (!href) return null;

  return (
    <p className={cn("text-sm text-muted-foreground", className)}>
      <span className="font-medium text-foreground">{disclosure}</span>
      {" · "}
      <a
        href={href}
        className="underline decoration-border underline-offset-4 hover:text-foreground"
        target="_blank"
        rel="sponsored noreferrer"
      >
        {linkLabel}
      </a>
    </p>
  );
}
