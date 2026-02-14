import fs from "node:fs";
import path from "node:path";

export type VariantRule =
  | { when: { lte: number }; text: string }
  | { when: { gte: number }; text: string }
  | { when: { between: [number, number] }; text: string }
  | { when: { any: true }; text: string };

export type TaskDef = {
  id: string;
  title: string;
  metricKey: string;
  variants: VariantRule[];
};

export type TaskCategoryDef = {
  key: string;
  title: string;
  pool: TaskDef[]; // expected >= 25 (you want 50)
};

export type EditionV2 = {
  slug: string;
  title: string;
  createdAt?: string;
  engine?: { subject?: string; locale?: "sk" | "cz" | "en" };
  content?: Record<string, any>;
  tasks?: {
    categories: TaskCategoryDef[]; // expected 5
    pickPerCategory?: number; // default 25
  };
};

export type ComputeItem = {
  id: string;
  title: string;
  metricKey: string;
  value: number;
  text: string;
};

export type ComputeCategory = {
  key: string;
  title: string;
  items: ComputeItem[];
};

export type EditionComputeResult = {
  subject: string;
  seedHash: number;
  score: number;
  categories: ComputeCategory[];
};

function readJsonNoBom(filePath: string) {
  const raw = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  return JSON.parse(raw);
}

export function loadEdition(slug: string): EditionV2 {
  const p = path.join(process.cwd(), "data", "editions", `${slug}.json`);
  if (!fs.existsSync(p)) throw new Error("EDITION_NOT_FOUND");
  return readJsonNoBom(p) as EditionV2;
}

// FNV-1a 32-bit
function fnv1a32(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function xorshift32(seed: number) {
  let x = seed >>> 0;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return x >>> 0;
  };
}

function pickWithoutReplacement<T>(arr: T[], n: number, rand: () => number): T[] {
  const copy = arr.slice();
  // Fisher–Yates shuffle partial
  for (let i = copy.length - 1; i > 0; i--) {
    const j = rand() % (i + 1);
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy.slice(0, Math.min(n, copy.length));
}

function matchRule(rule: VariantRule, value: number): boolean {
  const w: any = (rule as any).when;
  if (!w || typeof w !== "object") return false;
  if (w.any === true) return true;
  if (typeof w.lte === "number") return value <= w.lte;
  if (typeof w.gte === "number") return value >= w.gte;
  if (Array.isArray(w.between) && w.between.length === 2) {
    const a = Number(w.between[0]);
    const b = Number(w.between[1]);
    return value >= Math.min(a, b) && value <= Math.max(a, b);
  }
  return false;
}

function pickVariantText(variants: VariantRule[], value: number): string {
  if (!Array.isArray(variants) || variants.length === 0) return "";
  const hit = variants.find((v) => matchRule(v, value));
  if (hit && typeof (hit as any).text === "string") return (hit as any).text;
  // fallback: first text
  const first = variants[0] as any;
  return typeof first?.text === "string" ? first.text : "";
}

export function computeEditionResult(args: {
  edition: EditionV2;
  birthDate: string;
  name?: string;
  locale?: "sk" | "cz" | "en";
}): EditionComputeResult {
  const { edition, birthDate } = args;
  const name = (args.name ?? "").trim();
  const locale = (args.locale ?? edition.engine?.locale ?? "sk") as "sk" | "cz" | "en";
  const subject = (edition.engine?.subject ?? edition.slug).trim();

  const seed = `${subject}|${birthDate}|${name}|${locale}`;
  const seedHash = fnv1a32(seed);
  const score = (seedHash % 101) >>> 0;

  const cats = edition.tasks?.categories ?? [];
  const pickPerCategory = edition.tasks?.pickPerCategory ?? 25;

  const categories: ComputeCategory[] = cats.map((cat, idx) => {
    const rng = xorshift32(seedHash ^ fnv1a32(`${cat.key}|${idx}`));
    const picked = pickWithoutReplacement(cat.pool ?? [], pickPerCategory, rng);
    const items: ComputeItem[] = picked.map((t) => {
      const value = (fnv1a32(`${seed}|${t.id}|${t.metricKey}`) % 101) >>> 0;
      const text = pickVariantText(t.variants ?? [], value);
      return { id: t.id, title: t.title, metricKey: t.metricKey, value, text };
    });
    return { key: cat.key, title: cat.title, items };
  });

  return { subject, seedHash, score, categories };
}
