import type { Metadata } from "next";
import { HomeLanding } from "@/components/landing/HomeLanding";
import { JsonLd } from "@/components/landing/JsonLd";
import { getDictionary } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale";
import { homeJsonLd, localeMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  return localeMetadata(locale, "/", dict.meta.title, dict.meta.description);
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);

  return (
    <>
      <JsonLd data={homeJsonLd(locale, dict)} />
      <HomeLanding locale={locale} dict={dict} />
    </>
  );
}
