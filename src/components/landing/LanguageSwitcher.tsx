"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localePath, type Locale } from "@/lib/i18n";

const SHORT_LABEL: Record<Locale, string> = {
  en: "EN",
  "pt-BR": "PT",
};

export function LanguageSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname();

  function hrefFor(next: Locale) {
    const stripped = pathname.replace(/^\/(en|pt-BR)(?=\/|$)/, "") || "/";
    return localePath(next, stripped === "/" ? "" : stripped);
  }

  const options = [
    ["en", "English"],
    ["pt-BR", "Português"],
  ] as const;

  return (
    <nav aria-label={label} className="flex items-center gap-1 text-xs">
      {options.map(([code, name], index) => {
        const current = locale === code;
        return (
          <span key={code} className="flex items-center gap-1">
            {index > 0 ? (
              <span aria-hidden="true" className="text-muted-foreground">
                ·
              </span>
            ) : null}
            <Link
              href={hrefFor(code)}
              hrefLang={code}
              lang={code}
              aria-label={name}
              aria-current={current ? "page" : undefined}
              className={
                current
                  ? "font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }
            >
              {SHORT_LABEL[code]}
            </Link>
          </span>
        );
      })}
    </nav>
  );
}
