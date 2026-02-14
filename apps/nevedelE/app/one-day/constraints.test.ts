import { describe, expect, it } from "vitest";
import { validateCopy } from "./constraints";

describe("validateCopy", () => {
  it("accepts valid text", () => {
    const result = validateCopy("Dnes veci idú ľahšie.");
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rejects question marks", () => {
    const result = validateCopy("Ako sa máš?");
    expect(result.ok).toBe(false);
    expect(result.errors).toContain("contains question mark");
  });

  it("rejects future-binding language", () => {
    const result = validateCopy("Zajtra sa to zlepší.");
    expect(result.ok).toBe(false);
    expect(result.errors).toContain("contains future-binding language");
  });

  it("rejects CTA language", () => {
    const result = validateCopy("Pokračuj ďalej.");
    expect(result.ok).toBe(false);
    expect(result.errors).toContain("contains CTA language");
  });

  it("rejects identity language", () => {
    const result = validateCopy("Ty si pripravený.");
    expect(result.ok).toBe(false);
    expect(result.errors).toContain("contains identity language");
  });
});
