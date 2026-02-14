import { describe, expect, it } from "vitest";
import { createTranslator, detectLanguage } from "./localization";

describe("localization", () => {
  it("falls back to sk when locale is unknown", () => {
    expect(detectLanguage("de-DE")).toBe("sk");
  });

  it("translator falls back to sk then key", () => {
    const t = createTranslator("en");
    expect(t("spectrum.a.left")).toBe("Light");
    expect(t("non.existing.key")).toBe("non.existing.key");
  });
});
