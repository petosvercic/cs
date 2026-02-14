import { describe, expect, it } from "vitest";
import { compute } from "../src";

describe("compute()", () => {
  it("returns stable deterministic output for the same input (exact match)", () => {
    const input = {
      subject: "nevedel",
      birthDate: "1991-02-14",
      name: "Piti",
      locale: "sk" as const
    };

    const result = compute(input);

    expect(result).toEqual({
      subject: "nevedel",
      score: 68,
      verdict: "Silný signál. Základ pôsobí nezvyčajne stabilne.",
      facts: [
        "subject:nevedel",
        "birthDate:1991-02-14",
        "weekdayUTC:Thu",
        "dayOfYear:45",
        "leapYear:false",
        "seedHash:2497939845",
        "score:68"
      ],
      meta: {
        engineVersion: "1.0.0",
        computedAt: "1970-01-01T00:00:00.000Z"
      }
    });
  });
});
