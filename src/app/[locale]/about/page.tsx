import type { Metadata } from "next";
import { JsonLd } from "@/components/landing/JsonLd";
import { getDictionary } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale";
import { breadcrumbJsonLd, localeMetadata } from "@/lib/seo";

function Article({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl space-y-4 px-6 py-12">
      <h1 className="font-serif text-4xl text-foreground">{title}</h1>
      {children}
    </article>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const page = getDictionary(locale).about;
  return localeMetadata(locale, "/about", page.metaTitle, page.metaDescription);
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const page = getDictionary(locale).about;
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(locale, page.metaTitle, "/about")} />
      <Article title={page.title}>
        {page.paragraphs.map((paragraph) => (
          <p key={paragraph} className="text-muted-foreground">
            {paragraph}
          </p>
        ))}
        <section id="attribution" className="scroll-mt-8 space-y-3 pt-4">
          <h2 className="font-serif text-2xl text-foreground">{page.attributionTitle}</h2>
          {page.attribution.map((paragraph) => (
            <p key={paragraph} className="text-muted-foreground">
              {paragraph}
            </p>
          ))}
        </section>
      </Article>
    </>
  );
}
