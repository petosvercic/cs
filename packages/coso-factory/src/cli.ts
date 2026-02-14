import process from "node:process";
import { initFactory } from "./factory";

type Args = {
  command?: string;
  productSlug?: string;
  editionSlug?: string;
  locale?: "sk" | "cz" | "en";
  title?: string;
  outDir?: string;
  templateDir?: string;
};

function parseArgs(argv: string[]): Args {
  const args: Args = {};
  const rest = argv.slice(2);
  args.command = rest[0];

  for (let i = 1; i < rest.length; i++) {
    const k = rest[i];
    const v = rest[i + 1];
    if (!k?.startsWith("--")) continue;

    if (k === "--product") { args.productSlug = v; i++; continue; }
    if (k === "--edition") { args.editionSlug = v; i++; continue; }
    if (k === "--locale") { args.locale = v as any; i++; continue; }
    if (k === "--title") { args.title = v; i++; continue; }
    if (k === "--out") { args.outDir = v; i++; continue; }
    if (k === "--template") { args.templateDir = v; i++; continue; }
  }

  return args;
}

function usage(): string {
  return [
    "coso-factory init --product <productSlug> --edition <editionSlug> --locale <sk|cz|en> --title \"<title>\"",
    "  [--out apps]",
    "  [--template <ABS_PATH>]"
  ].join("\n");
}

async function main(): Promise<number> {
  const a = parseArgs(process.argv);

  if (a.command !== "init") {
    process.stderr.write(usage() + "\n");
    return 2;
  }

  if (!a.productSlug || !a.editionSlug || !a.locale || !a.title) {
    process.stderr.write(usage() + "\n");
    return 2;
  }

  const config = {
    productSlug: a.productSlug,
    editionSlug: a.editionSlug,
    locale: a.locale,
    title: a.title
  };

  try {
    await initFactory(config, {
      cwd: process.cwd(),
      outDir: a.outDir ?? "apps",
      templateDir: a.templateDir
    });
    return 0;
  } catch (e: any) {
    process.stderr.write((e?.message ? String(e.message) : "Unknown error") + "\n");
    return 1;
  }
}

main().then((code) => process.exit(code));
