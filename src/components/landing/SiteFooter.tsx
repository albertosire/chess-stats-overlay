import { ChessComAffiliateLine } from "@/components/landing/ChessComAffiliateLine";
import { KOFI_URL } from "@/lib/kofi";
import { GITHUB_URL } from "@/lib/site";
import { localePath, type Dictionary, type Locale } from "@/lib/i18n";

export function SiteFooter({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const columns = [
    {
      title: dict.footer.product,
      links: [
        { href: localePath(locale, "/create"), label: dict.footer.overlay },
        { href: localePath(locale, "/docs"), label: dict.footer.documentation },
        { href: localePath(locale, "/changelog"), label: dict.footer.changelog },
      ],
    },
    {
      title: dict.footer.resources,
      links: [{ href: localePath(locale, "/docs"), label: dict.footer.obsGuide }],
    },
    {
      title: dict.footer.project,
      links: [
        { href: GITHUB_URL, label: dict.footer.github, external: true },
        { href: localePath(locale, "/about"), label: dict.footer.about },
        { href: KOFI_URL, label: dict.nav.support, external: true },
      ],
    },
    {
      title: dict.footer.legal,
      links: [
        { href: localePath(locale, "/privacy"), label: dict.footer.privacy },
        { href: localePath(locale, "/terms"), label: dict.footer.terms },
        { href: `${localePath(locale, "/about")}#attribution`, label: dict.footer.attribution },
      ],
    },
  ];

  return (
    <footer className="border-t border-border bg-card/60">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 sm:grid-cols-2 lg:grid-cols-4">
        {columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2 className="font-serif text-lg text-foreground">{column.title}</h2>
            <ul className="mt-3 space-y-2">
              {column.links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                    {...("external" in link && link.external
                      ? { target: "_blank", rel: "noreferrer" }
                      : {})}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <ChessComAffiliateLine
        placement="footer"
        linkLabel={dict.affiliate.link}
        disclosure={dict.affiliate.disclosure}
        className="mx-auto max-w-6xl px-6 pb-8"
      />
    </footer>
  );
}
