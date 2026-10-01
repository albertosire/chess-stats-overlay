import type { Metadata } from "next";
import { OverlayBuilder } from "@/components/OverlayBuilder";
import { JsonLd } from "@/components/landing/JsonLd";
import { getDictionary } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale";
import { breadcrumbJsonLd, localeMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  return localeMetadata(locale, "/create", dict.configurator.title, dict.hero.subtitle);
}

export default async function CreatePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(locale, dict.configurator.title, "/create")} />
      <a
        href="#accounts"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2"
      >
        {dict.nav.skip}
      </a>
      <OverlayBuilder
        copy={dict.builder}
        locale={locale}
        title={dict.configurator.title}
        demo={{
          labels: dict.demo.labels,
          title: "BLITZ SESSION",
          caption: dict.demo.caption,
        }}
      />
    </>
  );
}
