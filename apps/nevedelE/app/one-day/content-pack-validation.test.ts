import packAEn from "./content/packs/pack-a.en.json";
import packASk from "./content/packs/pack-a.sk.json";
import packBEn from "./content/packs/pack-b.en.json";
import packBSk from "./content/packs/pack-b.sk.json";
import { describe, expect, it } from "vitest";
import { parsePackToRuntime, validateRuntimePack } from "./copy.sk";
import { createTranslator } from "./localization";

describe("content packs across languages", () => {
  it("all sk/en packs pass validation", () => {
    const cases = [
      { raw: packASk, t: createTranslator("sk") },
      { raw: packAEn, t: createTranslator("en") },
      { raw: packBSk, t: createTranslator("sk") },
      { raw: packBEn, t: createTranslator("en") },
    ];

    for (const item of cases) {
      const runtime = parsePackToRuntime(item.raw, item.t);
      expect(validateRuntimePack(runtime)).toEqual([]);
    }
  });
});
