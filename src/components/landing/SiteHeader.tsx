import Link from "next/link";
import { KofiLink } from "@/components/KofiLink";
import { LanguageSwitcher } from "@/components/landing/LanguageSwitcher";
import { localePath, type Dictionary, type Locale } from "@/lib/i18n";

export function SiteHeader({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <header className="border-b border-border bg-card/80">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Link href={localePath(locale)} className="font-serif text-lg text-foreground">
          {dict.nav.brand}
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <LanguageSwitcher locale={locale} label={dict.nav.language} />
          <Link
            href={`${localePath(locale)}#configurator`}
            className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            {dict.nav.create}
          </Link>
          <KofiLink compact label={dict.nav.support} />
        </div>
      </div>
    </header>
  );
}
