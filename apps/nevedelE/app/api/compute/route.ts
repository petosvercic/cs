export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { compute } from "coso-engine";
import { EngineInputSchema } from "coso-contract";

function hashStr(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function makeRng(seed: number) {
  let x = seed >>> 0;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 4294967296;
  };
}

function pickVariant(variants: any[], value: number) {
  for (const v of variants) {
    const w = v?.when;
    if (!w) continue;
    if (typeof w.lte === "number" && value <= w.lte) return v;
    if (Array.isArray(w.between) && w.between.length === 2) {
      const [a, b] = w.between;
      if (typeof a === "number" && typeof b === "number" && value >= a && value <= b) return v;
    }
    if (typeof w.gte === "number" && value >= w.gte) return v;
  }
  return variants?.[0] ?? null;
}

function normalizeTask(task: any, catIndex: number, taskIndex: number) {
  if (typeof task === "string") {
    const title = task.trim() || `Task ${taskIndex + 1}`;
    return {
      id: `t${catIndex + 1}-${taskIndex + 1}`,
      title,
      metricKey: `m_${catIndex + 1}_${taskIndex + 1}`,
      variants: [
        { when: { lte: 33 }, text: title },
        { when: { between: [34, 66] }, text: `${title} (stred)` },
        { when: { gte: 67 }, text: `${title} (silné)` },
      ],
    };
  }

  return task;
}

function readEdition(slug: string) {
  const edPath = path.join(process.cwd(), "data", "editions", `${slug}.json`);
  if (!fs.existsSync(edPath)) return null;
  const raw = fs.readFileSync(edPath, "utf8").replace(/^\uFEFF/, "");
  return JSON.parse(raw);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const editionSlug = typeof body?.editionSlug === "string" ? body.editionSlug : null;
    if (editionSlug) {
      const edition = readEdition(editionSlug);
      if (!edition) return NextResponse.json({ ok: false, error: "EDITION_NOT_FOUND" }, { status: 404 });

      const birthDate = typeof body?.birthDate === "string" ? body.birthDate : null;
      const name = typeof body?.name === "string" ? body.name : "";
      const locale = typeof body?.locale === "string" ? body.locale : "sk";

      if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
        return NextResponse.json({ ok: false, error: "BAD_BIRTHDATE" }, { status: 400 });
      }

      const engineInput = { subject: edition?.engine?.subject ?? editionSlug, birthDate, name, locale };
      const parsed = (EngineInputSchema as any).safeParse
        ? (EngineInputSchema as any).safeParse(engineInput)
        : { success: true, data: (EngineInputSchema as any).parse(engineInput) };

      if (!parsed.success) {
        return NextResponse.json(
          { ok: false, error: "INVALID_INPUT", details: parsed.error?.issues ?? null },
          { status: 400 }
        );
      }

      const base = await compute(parsed.data);
      const seed = hashStr(JSON.stringify(base)) ^ hashStr(`${editionSlug}|${birthDate}|${locale}`);
      const rng = makeRng(seed);

      const cats = edition?.tasks?.categories;
      if (!Array.isArray(cats) || cats.length !== 5) {
        return NextResponse.json({ ok: false, error: "TASKS_MISSING_OR_NOT_5_CATEGORIES" }, { status: 400 });
      }

      const pickPerCategoryRaw = Number((edition as any)?.tasks?.pickPerCategory ?? 3);
      const pickPerCategory = Number.isFinite(pickPerCategoryRaw)
        ? Math.max(1, Math.min(5, Math.floor(pickPerCategoryRaw)))
        : 3;

      const outCats = cats.map((cat: any, ci: number) => {
        const poolRaw = Array.isArray(cat?.pool) ? cat.pool : [];
        const pool = poolRaw.map((t: any, tidx: number) => normalizeTask(t, ci, tidx));
        if (pool.length < pickPerCategory) {
          throw new Error(`CATEGORY_${ci + 1}_POOL_TOO_SMALL`);
        }

        const idx = pool.map((_: any, i: number) => i);
        for (let i = idx.length - 1; i > 0; i--) {
          const j = Math.floor(rng() * (i + 1));
          [idx[i], idx[j]] = [idx[j], idx[i]];
        }

        const chosen = idx.slice(0, pickPerCategory).map((i) => pool[i]);

        const items = chosen.map((t: any) => {
          const tid = String(t?.id ?? "");
          const title = String(t?.title ?? "Task");
          const metricKey = String(t?.metricKey ?? "");
          const variants = Array.isArray(t?.variants) ? t.variants : [];

          const vSeed = hashStr(`${seed}|${metricKey}|${tid}|${ci}`);
          const value = vSeed % 101;

          const picked = pickVariant(variants, value);
          const text = typeof picked?.text === "string" ? picked.text : "";

          return { id: tid, title, value, text };
        });

        return { key: String(cat?.key ?? `cat${ci + 1}`), title: String(cat?.title ?? `Kategória ${ci + 1}`), items };
      });

      return NextResponse.json({ ok: true, result: { categories: outCats } }, { status: 200 });
    }

    // legacy
    const candidate =
      body && typeof body === "object" && body !== null && "input" in (body as any)
        ? (body as any).input
        : body;

    const parsed = (EngineInputSchema as any).safeParse
      ? (EngineInputSchema as any).safeParse(candidate)
      : { success: true, data: (EngineInputSchema as any).parse(candidate) };

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "INVALID_INPUT", details: parsed.error?.issues ?? parsed.error ?? null },
        { status: 400 }
      );
    }

    const result = await compute(parsed.data);
    return NextResponse.json({ ok: true, result }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR", message: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
