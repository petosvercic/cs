import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { EngineInputSchema, EngineResultSchema } from "../src/index";

function readJson(relPath: string) {
  const p = resolve(process.cwd(), relPath);
  return JSON.parse(readFileSync(p, "utf8"));
}

describe("coso-contract schema validation", () => {
  it("validates examples/engine-input.nevedel.json", () => {
    const inputExample = readJson("examples/engine-input.nevedel.json");
    expect(() => EngineInputSchema.parse(inputExample)).not.toThrow();
  });

  it("validates examples/engine-result.nevedel.json", () => {
    const resultExample = readJson("examples/engine-result.nevedel.json");
    expect(() => EngineResultSchema.parse(resultExample)).not.toThrow();
  });
});
