import Link from "next/link";
import { LanguageSwitcher } from "@/components/landing/LanguageSwitcher";
import { localePath, type Dictionary, type Locale } from "@/lib/i18n";

export function SiteHeader({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const createHref = localePath(locale, "/create");
  const links = [
    { href: createHref, label: dict.nav.overlay },
    { href: localePath(locale, "/docs"), label: dict.nav.docs },
    { href: localePath(locale, "/about"), label: dict.nav.about },
  ];

  return (
    <header className="border-b border-border bg-card/80">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-6 py-4">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link href={localePath(locale)} className="font-serif text-lg text-foreground">
            {dict.nav.brand}
          </Link>
          <nav aria-label={dict.footer.product} className="flex items-center gap-4 text-sm">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-muted-foreground hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher locale={locale} label={dict.nav.language} />
          <Link
            href={createHref}
            className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            {dict.nav.create}
          </Link>
        </div>
      </div>
    </header>
  );
}
