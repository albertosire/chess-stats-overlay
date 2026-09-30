import type { Metadata } from "next";
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
  const page = getDictionary(locale).terms;
  return localeMetadata(locale, "/terms", page.metaTitle, page.metaDescription);
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const page = getDictionary(locale).terms;
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(locale, page.metaTitle, "/terms")} />
      <article className="mx-auto max-w-3xl space-y-4 px-6 py-12">
        <h1 className="font-serif text-4xl text-foreground">{page.title}</h1>
        {page.paragraphs.map((paragraph) => (
          <p key={paragraph} className="text-muted-foreground">
            {paragraph}
          </p>
        ))}
      </article>
    </>
  );
}
