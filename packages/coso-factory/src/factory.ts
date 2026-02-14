import fs from "node:fs/promises";
import path from "node:path";
import { ProductConfigSchema, type ProductConfig } from "./schema";
import { defaultTemplateDir, resolveOutRoot, resolveProductDir } from "./paths";

export type InitOptions = {
  cwd: string;
  outDir?: string;
  templateDir?: string;
};

export async function initFactory(rawConfig: unknown, opts: InitOptions): Promise<{ productDir: string }> {
  const config: ProductConfig = ProductConfigSchema.parse(rawConfig);

  const outDir = opts.outDir ?? "apps";
  const outRootAbs = resolveOutRoot(opts.cwd, outDir);
  const productDirAbs = resolveProductDir(outRootAbs, config.productSlug);

  try {
    const st = await fs.stat(productDirAbs);
    if (st.isDirectory() || st.isFile()) {
      const err: any = new Error(`Target already exists: ${productDirAbs}`);
      err.code = "EEXIST";
      throw err;
    }
  } catch (e: any) {
    if (e && e.code !== "ENOENT") throw e;
  }

  await fs.mkdir(outRootAbs, { recursive: true });

  const templateDir = opts.templateDir ?? defaultTemplateDir();
  const templateAbs = path.isAbsolute(templateDir) ? templateDir : path.join(opts.cwd, templateDir);

  await fs.cp(templateAbs, productDirAbs, { recursive: true, errorOnExist: true });

  await fs.writeFile(
    path.join(productDirAbs, "product.config.json"),
    JSON.stringify(config, null, 2) + "\n",
    "utf8"
  );

  return { productDir: productDirAbs };
}
