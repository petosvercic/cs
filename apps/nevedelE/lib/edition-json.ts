export type EditionPayload = {
  slug: string;
  title: string;
  content: Record<string, any>;
  [k: string]: any;
};

// ---- task V2 normalization (builder-friendly) ----
function toAsciiSafe(s: string) {
  // keep original text as-is; but ensure it's a string and trim
  return String(s ?? "").trim();
}

function mkId(prefix: string, n: number) {
  return `${prefix}-${String(n).padStart(3,"0")}`;
}

function mkMetricKey(catIndex: number, taskIndex: number) {
  return `c${catIndex+1}_t${taskIndex+1}`;
}

function ensure3Variants(title: string, variants: any) {
  const base = toAsciiSafe(title) || "Task";
  let v = Array.isArray(variants) ? variants.map(toAsciiSafe).filter(Boolean) : [];
  if(v.length === 0){
    v = [
      base,
      base + " (quick)",
      base + " (deep)"
    ];
  }
  // pad / trim to exactly 3
  while(v.length < 3) v.push(v[v.length-1]);
  if(v.length > 3) v = v.slice(0,3);
  return v;
}

function ensureTaskV2(catIndex: number, taskIndex: number, t: any) {
  // Accept:
  // - string => convert
  // - object => fill missing fields, fix variants length
  if(typeof t === "string"){
    const title = toAsciiSafe(t);
    return {
      id: mkId(`c${catIndex+1}t${taskIndex+1}`, 1),
      title,
      metricKey: mkMetricKey(catIndex, taskIndex),
      variants: ensure3Variants(title, null),
    };
  }
  const title = toAsciiSafe(t?.title ?? t?.name ?? t?.text ?? "");
  return {
    id: toAsciiSafe(t?.id) || mkId(`c${catIndex+1}t${taskIndex+1}`, 1),
    title: title || "Task",
    metricKey: toAsciiSafe(t?.metricKey) || mkMetricKey(catIndex, taskIndex),
    variants: ensure3Variants(title || "Task", t?.variants),
  };
}

function normalizeTasksToV2(edition: any) {
  if(!edition?.tasks?.categories || !Array.isArray(edition.tasks.categories)) return edition;
  edition.tasks.categories = edition.tasks.categories.map((c: any, ci: number) => {
    const title = toAsciiSafe(c?.title ?? `Category ${ci+1}`) || `Category ${ci+1}`;
    const tasksRaw = Array.isArray(c?.tasks) ? c.tasks : [];
    const tasks = tasksRaw.map((t: any, ti: number) => ensureTaskV2(ci, ti, t));
    return { ...c, title, tasks };
  });
  return edition;
}
// ---- end task V2 normalization ----

function sanitizeRaw(raw: string) {
  return String(raw ?? "")
    .replace(/^\uFEFF/, "")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function unwrapCodeFence(input: string) {
  const fence = input.match(/^```(?:json)?\s*\n([\s\S]*?)\n```$/i);
  return fence ? fence[1].trim() : input;
}

function extractJSONObject(input: string) {
  const start = input.indexOf("{");
  const end = input.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return input;
  return input.slice(start, end + 1);
}

function slugify(input: string) {
  const base = String(input || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const clipped = base.slice(0, 64);
  if (/^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/.test(clipped)) return clipped;
  return "generated-edition";
}

function normalizeGroupsFixture(out: any) {
  if (!Array.isArray(out?.groups) || out?.tasks) return out;

  const groups = out.groups.filter((g: any) => typeof g === "string" && g.trim());
  const baseTasks = Array.isArray(out?.tasks) ? out.tasks : [];

  out.categories = groups.map((g: string, idx: number) => ({
    id: `cat-${idx + 1}`,
    title: g,
    tasks: baseTasks,
  }));

  return out;
}

function fallbackContent(title: string) {
  return {
    heroTitle: title,
    heroSubtitle: "Personalizovaný prehľad",
    intro: { title: "Úvod", text: "Vyplň krátky formulár a získaj výsledok." },
    form: { title: "Vyhodnotenie", nameLabel: "Meno", birthDateLabel: "Dátum narodenia", submitLabel: "Vyhodnotiť" },
    result: { teaserTitle: "Náhľad", teaserNote: "Zobrazený je len teaser.", unlockHint: "Odomkni celý výsledok." },
    paywall: {
      headline: "Odomkni celý výsledok",
      bullets: ["Všetky kategórie", "Plný text", "Personalizované výstupy"],
      cta: "Pokračovať na platbu",
    },
  };
}

function normalizeFixture(obj: any) {
  const out = normalizeGroupsFixture({ ...obj });

  if (!out.tasks && Array.isArray(out.categories)) {
    out.tasks = {
      pickPerCategory: 3,
      categories: out.categories.map((cat: any, cidx: number) => {
        const tasks = Array.isArray(cat?.tasks) ? cat.tasks : [];
        return {
          key: String(cat?.id || cat?.key || `cat-${cidx + 1}`),
          title: String(cat?.title || `Kategória ${cidx + 1}`),
          pool: tasks.map((t: any, tidx: number) => {
            const v = t?.variants || {};
            return {
              id: String(t?.id || `t${cidx + 1}-${tidx + 1}`),
              title: String(t?.title || `Úloha ${tidx + 1}`),
              metricKey: String(t?.metricKey || t?.id || `m_${cidx + 1}_${tidx + 1}`),
              variants: [
                { when: { lte: 33 }, text: String(v?.lte || "") },
                { when: { between: [34, 66] }, text: String(v?.between || "") },
                { when: { gte: 67 }, text: String(v?.gte || "") },
              ],
            };
          }),
        };
      }),
    };
  }

  if (!out.title || typeof out.title !== "string" || !out.title.trim()) {
    if (Array.isArray(out.groups) && out.groups.length > 0) {
      out.title = String(out.groups[0] || "").trim() || "Generovaná edícia";
    } else if (Array.isArray(out.categories) && out.categories.length > 0) {
      out.title = String(out.categories[0]?.title || "").trim() || "Generovaná edícia";
    } else {
      out.title = "Generovaná edícia";
    }
  }

  if (!out.slug || typeof out.slug !== "string" || !out.slug.trim()) {
    out.slug = slugify(out.title || "generated-edition");
  }

  if (!out.content || typeof out.content !== "object" || Array.isArray(out.content)) {
    out.content = fallbackContent(String(out.title || out.slug || "Edícia"));
  }

  if (!out.engine || typeof out.engine !== "object") {
    out.engine = { subject: String(out.slug || "edition").replace(/-/g, "_"), locale: "sk" };
  }

  // ---- tasks schema hardening (accept aliases + multiple task shapes) ----
  if (out.tasks && Array.isArray(out.tasks.categories)) {
    const clampInt = (n: any, lo: number, hi: number, fallback: number) => {
      const x = Number(n);
      if (!Number.isFinite(x)) return fallback;
      return Math.max(lo, Math.min(hi, Math.floor(x)));
    };

    const toText = (x: any) => String(x ?? "").trim();

    const pad3 = (arr: string[]) => {
      const a = arr.filter(Boolean);
      if (a.length === 0) return ["", "", ""]; 
      while (a.length < 3) a.push(a[a.length - 1]);
      return a.slice(0, 3);
    };

    const normalizeVariantTriplet = (variantsAny: any, title: string): Array<{ when: any; text: string }> => {
      // Allowed input shapes:
      // 1) [{when:{lte|between|gte}, text:"..."}, ...] (already final)
      // 2) ["text1","text2","text3"] (simple)
      // 3) { lte:"", between:"", gte:"" } (legacy object)
      if (Array.isArray(variantsAny) && variantsAny.every((v) => typeof v?.when === "object" && typeof v?.text === "string")) {
        const vv = variantsAny.slice(0, 3);
        if (vv.length === 3) return vv;
      }

      let texts: string[] = [];
      if (Array.isArray(variantsAny)) {
        texts = variantsAny.map(toText);
      } else if (variantsAny && typeof variantsAny === "object") {
        texts = [toText(variantsAny.lte), toText(variantsAny.between), toText(variantsAny.gte)];
      }

      const base = toText(title) || "Task";
      const [a, b, c] = pad3(texts.length ? texts : [base, base, base]);

      return [
        { when: { lte: 33 }, text: a || base },
        { when: { between: [34, 66] }, text: b || a || base },
        { when: { gte: 67 }, text: c || b || a || base },
      ];
    };

    out.tasks = {
      ...out.tasks,
      // allow 1..5 (canonical pick range); compute mirrors this clamp
      pickPerCategory: clampInt(out.tasks.pickPerCategory, 1, 5, 3),
      categories: out.tasks.categories.map((cat: any, cidx: number) => {
        const key = String(cat?.key || cat?.id || `cat-${cidx + 1}`);
        const title = String(cat?.title || `Kategória ${cidx + 1}`);

        // accept both `pool` and legacy `tasks`
        const rawPool = Array.isArray(cat?.pool) ? cat.pool : Array.isArray(cat?.tasks) ? cat.tasks : [];

        const pool = rawPool.map((t: any, tidx: number) => {
          // accept task as string
          if (typeof t === "string") {
            const txt = toText(t);
            return {
              id: `t${cidx + 1}-${tidx + 1}`,
              title: txt || `Task ${tidx + 1}`,
              metricKey: `m_${cidx + 1}_${tidx + 1}`,
              variants: normalizeVariantTriplet([txt], txt || `Task ${tidx + 1}`),
            };
          }

          // accept object (or even variants-only array)
          const taskTitle = String(t?.title ?? t?.name ?? t?.text ?? `Task ${tidx + 1}`);
          const variantsIn = (t && typeof t === "object" && "variants" in t) ? (t as any).variants : t;

          return {
            id: String(t?.id || `t${cidx + 1}-${tidx + 1}`),
            title: String(taskTitle),
            metricKey: String(t?.metricKey || `m_${cidx + 1}_${tidx + 1}`),
            variants: normalizeVariantTriplet(variantsIn, taskTitle),
          };
        });

        return { key, title, pool };
      }),
    };
  }

  return out;
}


// ---- tolerant JSON extractor (LLM-proof) ----
function extractFirstJsonObject(input: string): string | null {
  const s = String(input ?? "");
  const start = s.indexOf("{");
  if (start < 0) return null;

  let inStr = false;
  let esc = false;
  let depth = 0;

  for (let i = start; i < s.length; i++) {
    const ch = s[i];

    if (inStr) {
      if (esc) { esc = false; continue; }
      if (ch === "\\") { esc = true; continue; }
      if (ch === '"') { inStr = false; continue; }
      continue;
    } else {
      if (ch === '"') { inStr = true; continue; }
      if (ch === "{") depth++;
      if (ch === "}") {
        depth--;
        if (depth === 0) {
          const candidate = s.slice(start, i + 1).trim();
          try {
            JSON.parse(candidate);
            return candidate;
          } catch {
            // if this candidate is not parseable, keep scanning (rare but possible)
          }
        }
      }
    }
  }
  return null;
}
// ---- end tolerant JSON extractor ----

export function normalizeEditionJsonRaw(raw: string) {
  const base = sanitizeRaw(raw);
  const noFence = unwrapCodeFence(base);
  return extractJSONObject(noFence).trim();
}


export function normalizeEditionJsonForBuilder(raw: string) {
  let normalized = normalizeEditionJsonRaw(raw);
  try {
    const parsed = JSON.parse(normalized);
    const shaped = normalizeFixture(parsed);
    return JSON.stringify(shaped, null, 2);
  } catch {
  // If LLM returned JSON plus junk/trailing braces/text, extract the first valid JSON object
  const extracted = extractFirstJsonObject(normalized);
    return (extracted ?? normalized);
  }
}


export function validateEditionJson(raw: string, existingSlugs: string[] = []) {
  let normalized = normalizeEditionJsonRaw(raw);
  let obj: any;

  try {
    obj = JSON.parse(normalized);
    // tolerate multiple task input shapes (string / simple variants / full V2)
    normalizeTasksToV2(obj);
  } catch (e: any) {

return {
      ok: false as const,
      error: "INVALID_JSON",
      details: String(e?.message ?? e),
      debug: {
        rawStart: String(raw ?? "").slice(0, 120),
        normalizedStart: normalized.slice(0, 120),
        foundRootKeys: [],
      },
    };
  }

  obj = normalizeFixture(obj);
  const foundRootKeys = obj && typeof obj === "object" && !Array.isArray(obj) ? Object.keys(obj) : [];

  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return { ok: false as const, error: "NOT_OBJECT", debug: { foundRootKeys, normalizedStart: normalized.slice(0, 120) } };
  }
  if (typeof obj.slug !== "string" || !obj.slug.trim()) {
    return { ok: false as const, error: "MISSING_SLUG", debug: { foundRootKeys, normalizedStart: normalized.slice(0, 120) } };
  }
  if (typeof obj.title !== "string" || !obj.title.trim()) {
    return { ok: false as const, error: "MISSING_TITLE", debug: { foundRootKeys, normalizedStart: normalized.slice(0, 120) } };
  }
  if (!obj.content || typeof obj.content !== "object" || Array.isArray(obj.content)) {
    return { ok: false as const, error: "MISSING_CONTENT_OBJECT", debug: { foundRootKeys, normalizedStart: normalized.slice(0, 120) } };
  }

  const slug = obj.slug.trim();
  if (!/^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/.test(slug)) {
    return { ok: false as const, error: "BAD_SLUG", details: slug, debug: { foundRootKeys, normalizedStart: normalized.slice(0, 120) } };
  }
  if (existingSlugs.includes(slug)) {
    return { ok: false as const, error: "DUPLICATE_SLUG", details: slug, debug: { foundRootKeys, normalizedStart: normalized.slice(0, 120) } };
  }

  // ---- tasks validation (if present) ----
  if (obj.tasks !== undefined) {
    const tasks = obj.tasks;
    if (!tasks || typeof tasks !== "object" || Array.isArray(tasks)) {
      return { ok: false as const, error: "TASKS_NOT_OBJECT", debug: { foundRootKeys } };
    }

    // allow any sane number; compute/UI will clamp as needed
    const pick = Number((tasks as any).pickPerCategory ?? 3);
    if (!Number.isFinite(pick) || pick < 1 || pick > 5) {
      return { ok: false as const, error: "TASKS_PICK_OUT_OF_RANGE", details: (tasks as any).pickPerCategory, debug: { foundRootKeys } };
    }

    if (!Array.isArray(tasks.categories) || tasks.categories.length !== 5) {
      return { ok: false as const, error: "TASKS_NOT_5_CATEGORIES", details: Array.isArray(tasks.categories) ? tasks.categories.length : null, debug: { foundRootKeys } };
    }

    for (let ci = 0; ci < tasks.categories.length; ci++) {
      const cat = tasks.categories[ci];
      const pool = Array.isArray(cat?.pool) ? cat.pool : Array.isArray(cat?.tasks) ? cat.tasks : null;
      if (!Array.isArray(pool)) {
        return { ok: false as const, error: "CATEGORY_POOL_MISSING", details: `cat#${ci + 1}`, debug: { foundRootKeys } };
      }
      const minPool = Math.max(5, Math.floor(pick));
      if (pool.length < minPool) {
        return { ok: false as const, error: "CATEGORY_POOL_TOO_SMALL", details: `cat#${ci + 1} len=${pool.length} (min ${minPool})`, debug: { foundRootKeys } };
      }

      for (let ti = 0; ti < pool.length; ti++) {
        const tsk = pool[ti];
        if (typeof tsk?.id !== "string" || !tsk.id.trim()) return { ok: false as const, error: "TASK_ID_MISSING", details: `cat#${ci + 1} task#${ti + 1}` };
        if (typeof tsk?.title !== "string" || !tsk.title.trim()) return { ok: false as const, error: "TASK_TITLE_MISSING", details: `cat#${ci + 1} task#${ti + 1}` };
        if (typeof tsk?.metricKey !== "string" || !tsk.metricKey.trim()) return { ok: false as const, error: "TASK_METRICKEY_MISSING", details: `cat#${ci + 1} task#${ti + 1}` };

        const variants = Array.isArray(tsk?.variants) ? tsk.variants : null;
        if (!variants || variants.length !== 3) return { ok: false as const, error: "TASK_VARIANTS_NOT_3", details: `cat#${ci + 1} task#${ti + 1}` };

        const hasLte = variants.some((v: any) => typeof v?.when?.lte === "number" && typeof v?.text === "string");
        const hasBetween = variants.some((v: any) => Array.isArray(v?.when?.between) && v.when.between.length === 2 && typeof v?.text === "string");
        const hasGte = variants.some((v: any) => typeof v?.when?.gte === "number" && typeof v?.text === "string");

        if (!hasLte || !hasBetween || !hasGte) {
          return { ok: false as const, error: "TASK_VARIANTS_BAD_SHAPE", details: `cat#${ci + 1} task#${ti + 1}` };
        }
      }
    }
  }



  return { ok: true as const, obj: { ...obj, slug, title: obj.title.trim() } as EditionPayload };
}
