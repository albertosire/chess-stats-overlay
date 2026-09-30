"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localePath, type Locale } from "@/lib/i18n";

export function LanguageSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname();

  function hrefFor(next: Locale) {
    const stripped = pathname.replace(/^\/(en|pt-BR)(?=\/|$)/, "") || "/";
    return localePath(next, stripped === "/" ? "" : stripped);
  }

  return (
    <nav aria-label={label} className="flex items-center gap-1 text-sm">
      {(
        [
          ["en", "English"],
          ["pt-BR", "Português"],
        ] as const
      ).map(([code, name]) => {
        const current = locale === code;
        return (
          <Link
            key={code}
            href={hrefFor(code)}
            hrefLang={code}
            lang={code}
            aria-current={current ? "page" : undefined}
            className={
              current
                ? "rounded-md bg-primary px-2 py-1 text-primary-foreground"
                : "rounded-md px-2 py-1 text-muted-foreground hover:text-foreground"
            }
          >
            {name}
          </Link>
        );
      })}
    </nav>
  );
}
