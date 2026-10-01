import { afterEach, describe, expect, it } from "vitest";
import { localeMetadata } from "./seo";
import { siteUrl } from "./site";

describe("siteUrl", () => {
  const original = process.env.NEXT_PUBLIC_SITE_URL;

  afterEach(() => {
    if (original === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = original;
  });

  it("rewrites the apex domain to www", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://chesstats.online";
    expect(siteUrl()).toBe("https://www.chesstats.online");
  });

  it("keeps an existing www host", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://www.chesstats.online/";
    expect(siteUrl()).toBe("https://www.chesstats.online");
  });
});

describe("localeMetadata", () => {
  it("publishes an absolute www canonical", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://chesstats.online";
    const metadata = localeMetadata("en", "/create", "Create", "Subtitle");
    expect(metadata.alternates?.canonical).toBe("https://www.chesstats.online/en/create");
  });
});
