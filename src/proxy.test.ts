import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { LOCALE_COOKIE } from "@/lib/i18n";
import { proxy } from "./proxy";

function request(path: string, headers?: HeadersInit) {
  return new NextRequest(new URL(path, "https://www.chesstats.online"), { headers });
}

function location(response: Response) {
  return new URL(response.headers.get("location") ?? "", "https://www.chesstats.online");
}

describe("pt locale alias", () => {
  it.each([
    ["/pt", "/pt-BR"],
    ["/pt/create", "/pt-BR/create"],
    ["/pt/about", "/pt-BR/about"],
    ["/pt/changelog", "/pt-BR/changelog"],
    ["/pt/docs", "/pt-BR/docs"],
    ["/pt/privacy", "/pt-BR/privacy"],
    ["/pt/terms", "/pt-BR/terms"],
  ])("308s %s to %s before locale prefixing", (path, destination) => {
    const response = proxy(
      request(path, {
        cookie: `${LOCALE_COOKIE}=en`,
        "accept-language": "pt-BR,pt;q=0.9",
      }),
    );

    expect(response.status).toBe(308);
    expect(location(response).pathname).toBe(destination);
  });

  it("keeps the query string, matching the other proxy redirects", () => {
    const response = proxy(request("/pt/create?theme=dark&src=nav"));

    expect(response.status).toBe(308);
    const target = location(response);
    expect(target.pathname).toBe("/pt-BR/create");
    expect(target.search).toBe("?theme=dark&src=nav");
  });

  it("does not invent a redirect for unknown /pt paths", () => {
    const response = proxy(request("/pt/missing", { cookie: `${LOCALE_COOKIE}=en` }));

    expect(response.status).toBe(307);
    expect(location(response).pathname).toBe("/en/pt/missing");
  });

  it("leaves the real pt-BR locale untouched", () => {
    const response = proxy(request("/pt-BR/create"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});
