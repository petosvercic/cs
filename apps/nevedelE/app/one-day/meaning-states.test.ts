import { describe, expect, it } from "vitest";
import { getValidatedContentPack } from "./copy.sk";
import { getAllowedStateIds, selectMeaningState, validateMeaningPool } from "./meaning-states";

const pack = getValidatedContentPack();

describe("meaning state selector", () => {
  it("is deterministic for the same date input", () => {
    const date = new Date("2026-03-14T10:00:00Z");
    const a = selectMeaningState(date, "A", "MID", "NEUTRAL", pack.meaningStates);
    const b = selectMeaningState(date, "A", "MID", "NEUTRAL", pack.meaningStates);
    expect(a.id).toBe(b.id);
  });

  it("returns state within the allowed subset for zone", () => {
    const date = new Date("2026-03-15T10:00:00Z");
    const selected = selectMeaningState(date, "B", "LOW", "LIGHT", pack.meaningStates);
    expect(getAllowedStateIds(pack.meaningStates, "B", "LOW")).toContain(selected.id);
  });

  it("all pool copy passes validator and space budget checks", () => {
    const validation = validateMeaningPool(pack.meaningStates);
    expect(validation.ok).toBe(true);
    expect(validation.errors).toEqual([]);
  });

  it("can reach all 8 states across date rotation", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 365; i += 1) {
      const date = new Date(Date.UTC(2026, 0, 1 + i));
      (["A", "B"] as const).forEach((spectrum) => {
        (["LOW", "MID", "HIGH"] as const).forEach((zone) => {
          (["LIGHT", "NEUTRAL", "HEAVY"] as const).forEach((dayType) => {
            seen.add(selectMeaningState(date, spectrum, zone, dayType, pack.meaningStates).id);
          });
        });
      });
    }

    expect(seen.size).toBe(8);
  });
});
