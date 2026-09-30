import { DocumentLang } from "@/components/landing/DocumentLang";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { getDictionary, LOCALES } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);

  return (
    <div className="min-h-screen">
      <DocumentLang locale={locale} />
      <SiteHeader locale={locale} dict={dict} />
      {children}
      <SiteFooter locale={locale} dict={dict} />
    </div>
  );
}
