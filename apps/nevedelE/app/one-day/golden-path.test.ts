import { describe, expect, it } from "vitest";
import { getValidatedContentPack } from "./copy.sk";
import { hasInteractiveAffordances, transition } from "./flow.contract";
import { selectMeaningState } from "./meaning-states";

describe("golden path smoke", () => {
  it("walks through impulse -> spectrum -> result -> silence and keeps silence non-interactive", () => {
    const pack = getValidatedContentPack();

    const spectrum = transition("IMPULSE", "SPECTRUM");
    const result = transition(spectrum, "RESULT");
    const silence = transition(result, "SILENCE");

    expect(silence).toBe("SILENCE");
    expect(hasInteractiveAffordances(silence)).toBe(false);

    const chosen = selectMeaningState(new Date("2026-02-10T10:00:00Z"), "A", "MID", "NEUTRAL", pack.meaningStates);
    expect(chosen.title.length).toBeGreaterThan(0);
    expect(chosen.body.length).toBeGreaterThan(0);
  });

  it("uses non-empty impulse and spectrum labels", () => {
    const pack = getValidatedContentPack();
    expect(pack.impulses.NEUTRAL[0]).toBeTruthy();
    expect(pack.spectrum.A.leftLabel).toBeTruthy();
    expect(pack.spectrum.A.rightLabel).toBeTruthy();
  });
});
