import { HeroPreview } from "@/components/landing/HeroPreview";
import { LegacyCreateRedirect } from "@/components/landing/LegacyCreateRedirect";
import { localePath, type Dictionary, type Locale } from "@/lib/i18n";
import { GITHUB_URL } from "@/lib/site";

export function HomeLanding({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const createHref = localePath(locale, "/create");

  return (
    <>
      <LegacyCreateRedirect href={createHref} />
      <a
        href={createHref}
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2"
      >
        {dict.nav.skip}
      </a>

      <section className="mx-auto grid max-w-5xl gap-10 px-6 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-5">
          <h1 className="font-serif text-5xl leading-tight text-foreground">{dict.hero.title}</h1>
          <p className="max-w-xl text-lg text-muted-foreground">{dict.hero.subtitle}</p>
          <p className="text-sm text-foreground">{dict.hero.points}</p>
          <div className="flex flex-wrap gap-3">
            <a
              href={createHref}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              {dict.hero.cta}
            </a>
            <a
              href={`${createHref}#preview`}
              className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:border-foreground/40"
            >
              {dict.hero.demo}
            </a>
          </div>
          <p className="text-sm text-muted-foreground">
            {dict.hero.free} · {dict.hero.noAccount} · {dict.hero.openSource}
          </p>
        </div>
        <div id="demo" className="preview-checkered rounded-2xl border border-border p-6">
          <h2 className="mb-4 font-serif text-2xl text-foreground">{dict.demo.title}</h2>
          <HeroPreview locale={locale} labels={dict.demo.labels} title="BLITZ SESSION" />
          <p className="mt-4 text-sm text-muted-foreground">{dict.demo.caption}</p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-8" aria-labelledby="features-heading">
        <h2 id="features-heading" className="font-serif text-3xl text-foreground">
          {dict.features.title}
        </h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dict.features.items.map((item) => (
            <li key={item.title} className="rounded-2xl border border-border bg-card p-4">
              <h3 className="font-medium text-foreground">{item.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-8" aria-labelledby="how-heading">
        <h2 id="how-heading" className="font-serif text-3xl text-foreground">
          {dict.how.title}
        </h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {dict.how.steps.map((step, index) => (
            <li key={step.title} className="rounded-2xl border border-border bg-card p-5">
              <p className="font-serif text-3xl text-accent">{index + 1}</p>
              <h3 className="mt-2 font-medium text-foreground">{step.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-8" aria-labelledby="gallery-heading">
        <a
          href={`${createHref}#display`}
          className="block rounded-2xl border border-border bg-card p-5 transition hover:border-foreground/40"
        >
          <h2 id="gallery-heading" className="font-serif text-3xl text-foreground">
            {dict.gallery.title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{dict.gallery.intro}</p>
        </a>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-8" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="font-serif text-3xl text-foreground">
          {dict.faq.title}
        </h2>
        <div className="mt-4 divide-y divide-border border-y border-border">
          {dict.faq.items.map((item) => (
            <details key={item.q} className="group py-1">
              <summary className="cursor-pointer py-3 font-medium text-foreground">{item.q}</summary>
              <p className="pb-4 text-sm text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-10" aria-labelledby="oss-heading">
        <h2 id="oss-heading" className="font-serif text-3xl text-foreground">
          {dict.opensource.title}
        </h2>
        <p className="mt-3 text-muted-foreground">{dict.opensource.body}</p>
        <a
          href={GITHUB_URL}
          className="mt-4 inline-flex text-sm text-accent underline-offset-4 hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          {dict.opensource.github}
        </a>
      </section>
    </>
  );
}
