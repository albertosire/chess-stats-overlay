import { describe, expect, it } from "vitest";
import { DEFAULT_OVERLAY_CONFIG, validateOverlayConfig } from "./build-url";

describe("validateOverlayConfig", () => {
  it("requires the primary username", () => {
    expect(validateOverlayConfig(DEFAULT_OVERLAY_CONFIG)).toContain("missing_username");
  });

  it("does not require Start counter for a live session", () => {
    expect(
      validateOverlayConfig({
        ...DEFAULT_OVERLAY_CONFIG,
        username: "hikaru",
        periodMode: "session",
      }),
    ).toEqual([]);
  });
});
