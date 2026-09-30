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
  const page = getDictionary(locale).changelog;
  return localeMetadata(locale, "/changelog", page.metaTitle, page.metaDescription);
}

export default async function ChangelogPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const page = getDictionary(locale).changelog;
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(locale, page.metaTitle, "/changelog")} />
      <article className="mx-auto max-w-3xl space-y-8 px-6 py-12">
        <h1 className="font-serif text-4xl text-foreground">{page.title}</h1>
        {page.entries.map((entry) => (
          <section key={entry.version}>
            <h2 className="font-serif text-2xl text-foreground">{entry.version}</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
              {entry.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </article>
    </>
  );
}
