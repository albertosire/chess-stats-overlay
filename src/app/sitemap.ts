import type { MetadataRoute } from "next";
import { LOCALES, localePath } from "@/lib/i18n";
import { siteUrl } from "@/lib/site";

const PATHS = ["", "/create", "/about", "/privacy", "/terms", "/changelog", "/docs"];

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteUrl();

  return LOCALES.flatMap((locale) =>
    PATHS.map((path) => ({
      url: `${origin}${localePath(locale, path)}`,
      lastModified: new Date(),
      changeFrequency: path === "" ? "weekly" : "monthly",
      priority: path === "" ? 1 : 0.6,
      alternates: {
        languages: Object.fromEntries(
          LOCALES.map((entry) => [entry, `${origin}${localePath(entry, path)}`]),
        ),
      },
    })),
  );
}
