import { afterEach, describe, expect, it } from "vitest";
import { chessComAffiliateHref } from "./chesscom-affiliate";

describe("chessComAffiliateHref", () => {
  const original = process.env.NEXT_PUBLIC_CHESSCOM_AFFILIATE_URL;

  afterEach(() => {
    if (original === undefined) delete process.env.NEXT_PUBLIC_CHESSCOM_AFFILIATE_URL;
    else process.env.NEXT_PUBLIC_CHESSCOM_AFFILIATE_URL = original;
  });

  it("omits the link when the env var is unset, empty, or whitespace", () => {
    delete process.env.NEXT_PUBLIC_CHESSCOM_AFFILIATE_URL;
    expect(chessComAffiliateHref("footer")).toBeNull();
    expect(chessComAffiliateHref("faq", "")).toBeNull();
    expect(chessComAffiliateHref("faq", "   ")).toBeNull();
  });

  it("omits the link for an invalid or non-http URL", () => {
    expect(chessComAffiliateHref("footer", "not a url")).toBeNull();
    expect(chessComAffiliateHref("footer", "javascript:alert(1)")).toBeNull();
    expect(chessComAffiliateHref("footer", "/relative")).toBeNull();
  });

  it("adds UTM parameters and tags the placement", () => {
    const href = chessComAffiliateHref(
      "footer",
      "https://www.chess.com/register?ref_id=example",
    );

    expect(href).not.toBeNull();
    const url = new URL(href!);
    expect(url.origin + url.pathname).toBe("https://www.chess.com/register");
    expect(url.searchParams.get("ref_id")).toBe("example");
    expect(url.searchParams.get("utm_source")).toBe("chesstats");
    expect(url.searchParams.get("utm_medium")).toBe("affiliate");
    expect(url.searchParams.get("utm_campaign")).toBe("chesscom");
    expect(url.searchParams.get("utm_content")).toBe("footer");
  });

  it("uses a different utm_content for the FAQ line", () => {
    const href = chessComAffiliateHref("faq", "https://www.chess.com/register");
    expect(new URL(href!).searchParams.get("utm_content")).toBe("faq");
  });

  it("keeps UTM values already present on the affiliate URL", () => {
    const href = chessComAffiliateHref(
      "faq",
      "https://www.chess.com/register?utm_source=network&utm_medium=partner&utm_campaign=spring#signup",
    );
    const url = new URL(href!);
    expect(url.searchParams.get("utm_source")).toBe("network");
    expect(url.searchParams.get("utm_medium")).toBe("partner");
    expect(url.searchParams.get("utm_campaign")).toBe("spring");
    expect(url.searchParams.get("utm_content")).toBe("faq");
    expect(url.hash).toBe("#signup");
  });

  it("reads NEXT_PUBLIC_CHESSCOM_AFFILIATE_URL when no URL is passed", () => {
    process.env.NEXT_PUBLIC_CHESSCOM_AFFILIATE_URL = "https://www.chess.com/play";
    const href = chessComAffiliateHref("footer");
    expect(new URL(href!).searchParams.get("utm_campaign")).toBe("chesscom");
  });
});
