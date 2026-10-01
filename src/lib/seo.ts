import type { Metadata } from "next";
import { localePath, LOCALES, type Dictionary, type Locale } from "@/lib/i18n";
import { siteUrl } from "@/lib/site";

export function localeMetadata(
  locale: Locale,
  path: string,
  title: string,
  description: string,
): Metadata {
  const origin = siteUrl();
  const canonical = `${origin}${localePath(locale, path)}`;
  const languages: Record<string, string> = {
    "x-default": `${origin}${localePath("en", path)}`,
  };
  for (const entry of LOCALES) {
    languages[entry] = `${origin}${localePath(entry, path)}`;
  }

  return {
    title: path === "" || path === "/" ? { absolute: title } : title,
    description,
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      locale: locale === "pt-BR" ? "pt_BR" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export function breadcrumbJsonLd(locale: Locale, name: string, path: string) {
  const origin = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "ChesStats",
        item: `${origin}${localePath(locale)}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name,
        item: `${origin}${localePath(locale, path)}`,
      },
    ],
  };
}

export function homeJsonLd(locale: Locale, dict: Dictionary) {
  const origin = siteUrl();
  const url = `${origin}${localePath(locale)}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "ChesStats",
        applicationCategory: "MultimediaApplication",
        operatingSystem: "Web",
        url,
        description: dict.meta.description,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: dict.faq.items.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.a,
          },
        })),
      },
    ],
  };
}
