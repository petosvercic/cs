import { describe, expect, it } from "vitest";
import { getSessionConfig, selectDayType, selectImpulseIndex, selectSpectrumType } from "./session";

describe("session rhythm", () => {
  it("selects deterministic day type", () => {
    const date = new Date("2026-02-10T10:00:00Z");
    expect(selectDayType(date)).toBe(selectDayType(date));
  });

  it("selects exactly one deterministic spectrum", () => {
    const evenDate = new Date("2026-02-10T10:00:00Z");
    const oddDate = new Date("2026-02-11T10:00:00Z");

    expect(selectSpectrumType(evenDate)).toBe("A");
    expect(selectSpectrumType(oddDate)).toBe("B");
  });

  it("selects deterministic impulse index", () => {
    const date = new Date("2026-02-11T10:00:00Z");
    expect(selectImpulseIndex(date, 5)).toBe(selectImpulseIndex(date, 5));
  });

  it("falls back safely when date access fails", () => {
    const brokenDate = {
      getFullYear: () => {
        throw new Error("broken");
      },
    } as unknown as Date;

    expect(getSessionConfig(brokenDate)).toEqual({ dayType: "NEUTRAL", spectrumType: "A", impulseIndex: 0 });
  });
});
