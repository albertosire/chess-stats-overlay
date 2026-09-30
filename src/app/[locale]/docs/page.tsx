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
  const page = getDictionary(locale).docs;
  return localeMetadata(locale, "/docs", page.metaTitle, page.metaDescription);
}

export default async function DocsPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const page = getDictionary(locale).docs;
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(locale, page.metaTitle, "/docs")} />
      <article className="mx-auto max-w-3xl space-y-4 px-6 py-12">
        <h1 className="font-serif text-4xl text-foreground">{page.title}</h1>
        <p className="text-muted-foreground">{page.intro}</p>
        <ol className="list-decimal space-y-2 pl-5 text-muted-foreground">
          {page.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="text-muted-foreground">{page.note}</p>
      </article>
    </>
  );
}
