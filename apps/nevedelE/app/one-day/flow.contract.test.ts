import { describe, expect, it } from "vitest";
import { hasInteractiveAffordances, isAllowedTransition, transition } from "./flow.contract";

describe("flow contract", () => {
  it("IMPULSE cannot jump directly to RESULT", () => {
    expect(isAllowedTransition("IMPULSE", "RESULT")).toBe(false);
    expect(() => transition("IMPULSE", "RESULT")).toThrow();
  });

  it("SPECTRUM cannot be skipped", () => {
    expect(isAllowedTransition("IMPULSE", "SPECTRUM")).toBe(true);
    expect(isAllowedTransition("SPECTRUM", "RESULT")).toBe(true);
    expect(isAllowedTransition("IMPULSE", "SILENCE")).toBe(false);
  });

  it("RESULT always enters SILENCE", () => {
    expect(transition("RESULT", "SILENCE")).toBe("SILENCE");
    expect(() => transition("RESULT", "CLOSED")).toThrow();
  });

  it("SILENCE has no CTA elements rendered", () => {
    expect(hasInteractiveAffordances("SILENCE")).toBe(false);
  });

  it("CLOSED has no outgoing transitions", () => {
    expect(isAllowedTransition("CLOSED", "IMPULSE")).toBe(false);
    expect(() => transition("CLOSED", "IMPULSE")).toThrow();
  });
});
