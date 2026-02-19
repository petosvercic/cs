import { describe, expect, it } from "vitest";
import { validateEditionPackJson } from "./edition-pack";

function makeValidDoc() {
  return {
    slug: "test-edition",
    title: "Test Edition",
    pack: {
      uiCopy: {
        heroTitle: "Tichý test",
        heroSubtitle: "Krátky podnadpis",
        unlockCta: "Odomknúť",
      },
      categories: Array.from({ length: 5 }, (_, cIdx) => ({
        id: `cat-${cIdx + 1}`,
        title: `Cat ${cIdx + 1}`,
        intro: "Intro text",
        lockedIntro: "Locked intro",
        items: Array.from({ length: 8 }, (_, iIdx) => ({
          id: `item-${cIdx + 1}-${iIdx + 1}`,
          title: `Item ${iIdx + 1}`,
          template: "Text s {tool} a {clarity}.",
        })),
      })),
    },
  };
}

describe("validateEditionPackJson", () => {
  it("rejects extra keys", () => {
    const doc = makeValidDoc() as any;
    doc.hacker = true;
    const out = validateEditionPackJson(doc, []);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.errors.some((e) => e.includes("UNKNOWN_KEY:root.hacker"))).toBe(true);
  });

  it("rejects {name} placeholder", () => {
    const doc = makeValidDoc();
    doc.pack.categories[0].items[0].template = "Ahoj {name}";
    const out = validateEditionPackJson(doc, []);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.errors.some((e) => e.includes("INVALID_TEMPLATE_TOKEN:name"))).toBe(true);
  });

  it("rejects unknown token", () => {
    const doc = makeValidDoc();
    doc.pack.categories[0].items[0].template = "Ahoj {unknownToken}";
    const out = validateEditionPackJson(doc, []);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.errors.some((e) => e.includes("INVALID_TEMPLATE_TOKEN:unknownToken"))).toBe(true);
  });

  it("rejects fewer than 5 categories", () => {
    const doc = makeValidDoc();
    doc.pack.categories = doc.pack.categories.slice(0, 4);
    const out = validateEditionPackJson(doc, []);
    expect(out.ok).toBe(false);
  });

  it("accepts valid sample", () => {
    const out = validateEditionPackJson(makeValidDoc(), []);
    expect(out.ok).toBe(true);
  });
});
