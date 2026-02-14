import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { initFactory } from "../src/factory";

async function exists(p: string): Promise<boolean> {
  try {
    await fs.stat(p);
    return true;
  } catch (e: any) {
    if (e?.code === "ENOENT") return false;
    throw e;
  }
}

test("init vytvorí očakávané súbory do dočasného priečinka", async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "coso-factory-"));
  const config = {
    productSlug: "nevedel",
    editionSlug: "nevedel",
    locale: "sk" as const,
    title: "coso-nevedel"
  };

  const { productDir } = await initFactory(config, { cwd: tmp, outDir: "apps" });

  assert.equal(productDir, path.join(tmp, "apps", "nevedel"));

  assert.equal(await exists(path.join(productDir, "product.config.json")), true);
  assert.equal(await exists(path.join(productDir, "package.json")), true);
  assert.equal(await exists(path.join(productDir, "app", "layout.tsx")), true);
  assert.equal(await exists(path.join(productDir, "app", "page.tsx")), true);
  assert.equal(await exists(path.join(productDir, "public")), true);

  const cfgRaw = await fs.readFile(path.join(productDir, "product.config.json"), "utf8");
  const cfg = JSON.parse(cfgRaw);

  assert.deepEqual(cfg, {
    productSlug: "nevedel",
    editionSlug: "nevedel",
    locale: "sk",
    title: "coso-nevedel"
  });
});

test("druhé spustenie na rovnaký slug failne", async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "coso-factory-"));
  const config = {
    productSlug: "nevedel",
    editionSlug: "nevedel",
    locale: "sk" as const,
    title: "coso-nevedel"
  };

  await initFactory(config, { cwd: tmp, outDir: "apps" });

  await assert.rejects(
    () => initFactory(config, { cwd: tmp, outDir: "apps" }),
    (err: any) => err?.code === "EEXIST"
  );
});
