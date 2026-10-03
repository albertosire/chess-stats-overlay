import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from "@/lib/i18n";

const EXCLUDED = [/^\/overlay(?:\/|$)/, /^\/api(?:\/|$)/, /^\/login(?:\/|$)/, /^\/dashboard(?:\/|$)/];

/** Pages that exist under `app/[locale]`. `/pt` aliases these; it is not a locale. */
const PT_ALIAS_SUFFIXES = new Set([
  "",
  "/about",
  "/changelog",
  "/create",
  "/docs",
  "/privacy",
  "/terms",
]);

function ptAliasDestination(pathname: string): string | null {
  if (pathname !== "/pt" && !pathname.startsWith("/pt/")) return null;
  const suffix = pathname.slice("/pt".length);
  if (!PT_ALIAS_SUFFIXES.has(suffix)) return null;
  return `/pt-BR${suffix}`;
}

function preferredLocale(request: NextRequest): Locale {
  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(saved)) return saved;
  const header = request.headers.get("accept-language") ?? "";
  if (/\bpt\b/i.test(header)) return "pt-BR";
  return DEFAULT_LOCALE;
}

function localeFromPath(pathname: string): Locale | null {
  if (pathname === "/en" || pathname.startsWith("/en/")) return "en";
  if (pathname === "/pt-BR" || pathname.startsWith("/pt-BR/")) return "pt-BR";
  return null;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Alias before the locale prefixer. Otherwise `/pt` is treated as an
  // unlocalized path and becomes `/en/pt` or `/pt-BR/pt`.
  const alias = ptAliasDestination(pathname);
  if (alias) {
    const url = request.nextUrl.clone();
    url.pathname = alias;
    return NextResponse.redirect(url, 308);
  }

  if (pathname === "/pt-br" || pathname.startsWith("/pt-br/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(/^\/pt-br/, "/pt-BR");
    return NextResponse.redirect(url);
  }

  const locale = localeFromPath(pathname);
  if (locale) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-locale", locale);
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.cookies.set(LOCALE_COOKIE, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return response;
  }

  if (EXCLUDED.some((pattern) => pattern.test(pathname))) {
    return NextResponse.next();
  }

  const nextLocale = preferredLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? `/${nextLocale}` : `/${nextLocale}${pathname}`;
  const response = NextResponse.redirect(url);
  response.cookies.set(LOCALE_COOKIE, nextLocale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
