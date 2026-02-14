import path from "node:path";
import fs from "node:fs";

export function resolveOutRoot(cwd: string, outDir: string): string {
  return path.isAbsolute(outDir) ? outDir : path.join(cwd, outDir);
}

export function resolveProductDir(outRootAbs: string, productSlug: string): string {
  return path.join(outRootAbs, productSlug);
}

function existsDir(p: string): boolean {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

export function defaultTemplateDir(): string {
  // dist/src/*.js => __dirname = <pkg>/dist/src
  // dist/*.js     => __dirname = <pkg>/dist
  // dist-test/src => __dirname = <pkg>/dist-test/src
  const candidates = [
    path.resolve(__dirname, "..", "template"),
    path.resolve(__dirname, "..", "..", "template"),
    path.resolve(process.cwd(), "template")
  ];

  for (const c of candidates) {
    if (existsDir(c)) return c;
  }

  // posledný fallback: package root odvodíme z __dirname
  const pkgRoot = path.resolve(__dirname, "..", "..", "..");
  const c = path.join(pkgRoot, "template");
  if (existsDir(c)) return c;

  throw new Error(`Template dir not found. Tried: ${candidates.join(", ")} and ${c}`);
}
