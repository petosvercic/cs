export type EditionPackItem = { id: string; title: string; template: string };
export type EditionPackCategory = {
  id: string;
  title: string;
  intro: string;
  lockedIntro: string;
  items: EditionPackItem[];
};

export type EditionPackDocument = {
  slug: string;
  title: string;
  pack: {
    uiCopy: { heroTitle: string; heroSubtitle: string; unlockCta: string };
    theme?: { backgroundImageUrl?: string; backgroundOverlay?: "none" | "soft" | "strong" };
    categories: EditionPackCategory[];
  };
  createdAt?: string;
  updatedAt?: string;
};

export type CopyPayload = {
  heroTitle: string;
  heroSubtitle: string;
  categories: Array<{
    title: string;
    intro: string;
    lockedIntro: string;
    items: Array<{ title: string; template: string }>;
  }>;
};

const LEGACY_KEYS = ["tasks", "engine", "pickPerCategory", "variants", "paywall", "result", "theme"] as const;
const TOKEN_RE = /\{([a-zA-Z0-9_]+)\}/g;

// Derived from packages/coso-template/template-root/app/page.tsx fillTemplate pools keys.
export const ALLOWLIST_TOKENS = [
  "anchor","autonomyArea","clarity","collaborationTrait","condition","confidenceTrigger","conflictA","conflictB","coreValue",
  "deadlineType","decisionBase","delay","distractionType","disturbance","drainActivity","efficiencyView","energySource",
  "errorView","feedbackStyle","focusPoint","function","impactArea","limitFactor","meaning","missingInfo","mode",
  "motivationType","orderForm","pace","polarity","preference","priorityRule","reserveFor","responsibilityTarget",
  "riskJustification","routineBenefit","selfMetric","sensitiveArea","timeView","tool"
].sort();

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function nonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function isKebabCase(v: string, min = 1, max = 64): boolean {
  return v.length >= min && v.length <= max && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v);
}

function hasLegacyKeys(raw: string): boolean {
  return LEGACY_KEYS.some((k) => new RegExp(`(^|[\\s\\"'])${k}[\\s\\"]*:`).test(raw));
}

function parseJson(input: string | unknown): unknown {
  if (typeof input === "string") return JSON.parse(String(input).replace(/^\uFEFF/, ""));
  return input;
}

function assertOnlyKeys(target: Record<string, unknown>, keys: string[], path: string, errors: string[]) {
  const allowed = new Set(keys);
  for (const key of Object.keys(target)) {
    if (!allowed.has(key)) errors.push(`UNKNOWN_KEY:${path}.${key}`);
  }
}

function extractTemplateTokens(template: string): string[] {
  return [...template.matchAll(TOKEN_RE)].map((m) => m[1]);
}

export function validateCopyPayloadJson(input: string | unknown): { ok: true; data: CopyPayload } | { ok: false; error: string; errors: string[] } {
  let parsed: unknown;
  try {
    parsed = parseJson(input);
  } catch {
    return { ok: false, error: "INVALID_JSON", errors: ["INVALID_JSON"] };
  }

  const errors: string[] = [];
  if (!isRecord(parsed)) return { ok: false, error: "INVALID_SCHEMA", errors: ["INVALID_SCHEMA:root"] };

  assertOnlyKeys(parsed, ["heroTitle", "heroSubtitle", "categories"], "root", errors);
  if (!nonEmptyString(parsed.heroTitle)) errors.push("INVALID_FIELD:heroTitle");
  if (!nonEmptyString(parsed.heroSubtitle)) errors.push("INVALID_FIELD:heroSubtitle");
  if (!Array.isArray(parsed.categories) || parsed.categories.length !== 5) errors.push("INVALID_FIELD:categories_count");

  const allow = new Set(ALLOWLIST_TOKENS);
  if (Array.isArray(parsed.categories)) {
    parsed.categories.forEach((cat, cIdx) => {
      if (!isRecord(cat)) return errors.push(`INVALID_FIELD:categories.${cIdx}`);
      assertOnlyKeys(cat, ["title", "intro", "lockedIntro", "items"], `categories.${cIdx}`, errors);
      if (!nonEmptyString(cat.title)) errors.push(`INVALID_FIELD:categories.${cIdx}.title`);
      if (!nonEmptyString(cat.intro)) errors.push(`INVALID_FIELD:categories.${cIdx}.intro`);
      if (!nonEmptyString(cat.lockedIntro)) errors.push(`INVALID_FIELD:categories.${cIdx}.lockedIntro`);
      if (!Array.isArray(cat.items) || cat.items.length < 8) errors.push(`INVALID_FIELD:categories.${cIdx}.items`);

      if (Array.isArray(cat.items)) {
        cat.items.forEach((item, iIdx) => {
          if (!isRecord(item)) return errors.push(`INVALID_FIELD:categories.${cIdx}.items.${iIdx}`);
          assertOnlyKeys(item, ["title", "template"], `categories.${cIdx}.items.${iIdx}`, errors);
          if (!nonEmptyString(item.title)) errors.push(`INVALID_FIELD:categories.${cIdx}.items.${iIdx}.title`);
          if (!nonEmptyString(item.template)) errors.push(`INVALID_FIELD:categories.${cIdx}.items.${iIdx}.template`);
          const tokens = extractTemplateTokens(String(item.template || ""));
          if (!tokens.length) errors.push(`INVALID_TEMPLATE:NO_TOKEN:categories.${cIdx}.items.${iIdx}`);
          tokens.forEach((t) => {
            if (!allow.has(t)) errors.push(`INVALID_TEMPLATE_TOKEN:${t}:categories.${cIdx}.items.${iIdx}`);
          });
        });
      }
    });
  }

  return errors.length ? { ok: false, error: "INVALID_SCHEMA", errors } : { ok: true, data: parsed as CopyPayload };
}

export function validateEditionPackJson(
  input: string | unknown,
  existingSlugs: string[] = [],
  opts: { enforceUniqueSlug?: boolean } = {}
): { ok: true; data: EditionPackDocument } | { ok: false; error: string; errors: string[] } {
  const raw = typeof input === "string" ? input : JSON.stringify(input ?? {});
  if (hasLegacyKeys(raw)) return { ok: false, error: "LEGACY_SCHEMA_NOT_ALLOWED", errors: ["LEGACY_SCHEMA_NOT_ALLOWED"] };

  let parsed: unknown;
  try {
    parsed = parseJson(input);
  } catch {
    return { ok: false, error: "INVALID_JSON", errors: ["INVALID_JSON"] };
  }

  const errors: string[] = [];
  if (!isRecord(parsed)) return { ok: false, error: "INVALID_SCHEMA", errors: ["INVALID_SCHEMA:root"] };

  assertOnlyKeys(parsed, ["slug", "title", "pack", "createdAt", "updatedAt"], "root", errors);
  if (!nonEmptyString(parsed.slug) || !isKebabCase(parsed.slug, 3, 64)) errors.push("INVALID_FIELD:slug");
  if (opts.enforceUniqueSlug !== false && typeof parsed.slug === "string" && existingSlugs.includes(parsed.slug)) {
    errors.push("SLUG_ALREADY_EXISTS");
  }
  if (!nonEmptyString(parsed.title)) errors.push("INVALID_FIELD:title");
  if (!isRecord(parsed.pack)) errors.push("INVALID_FIELD:pack");

  const allow = new Set(ALLOWLIST_TOKENS);
  if (isRecord(parsed.pack)) {
    assertOnlyKeys(parsed.pack, ["uiCopy", "categories"], "pack", errors);

    if (!isRecord(parsed.pack.uiCopy)) {
      errors.push("INVALID_FIELD:pack.uiCopy");
    } else {
      assertOnlyKeys(parsed.pack.uiCopy, ["heroTitle", "heroSubtitle", "unlockCta"], "pack.uiCopy", errors);
      if (!nonEmptyString(parsed.pack.uiCopy.heroTitle)) errors.push("INVALID_FIELD:pack.uiCopy.heroTitle");
      if (!nonEmptyString(parsed.pack.uiCopy.heroSubtitle)) errors.push("INVALID_FIELD:pack.uiCopy.heroSubtitle");
      if (!nonEmptyString(parsed.pack.uiCopy.unlockCta)) errors.push("INVALID_FIELD:pack.uiCopy.unlockCta");
    }

    if (!Array.isArray(parsed.pack.categories) || parsed.pack.categories.length !== 5) {
      errors.push("INVALID_FIELD:pack.categories_count");
    }

    if (Array.isArray(parsed.pack.categories)) {
      parsed.pack.categories.forEach((cat, cIdx) => {
        if (!isRecord(cat)) return errors.push(`INVALID_FIELD:pack.categories.${cIdx}`);
        assertOnlyKeys(cat, ["id", "title", "intro", "lockedIntro", "items"], `pack.categories.${cIdx}`, errors);
        if (!nonEmptyString(cat.id)) errors.push(`INVALID_FIELD:pack.categories.${cIdx}.id`);
        if (!nonEmptyString(cat.title)) errors.push(`INVALID_FIELD:pack.categories.${cIdx}.title`);
        if (!nonEmptyString(cat.intro)) errors.push(`INVALID_FIELD:pack.categories.${cIdx}.intro`);
        if (!nonEmptyString(cat.lockedIntro)) errors.push(`INVALID_FIELD:pack.categories.${cIdx}.lockedIntro`);
        if (!Array.isArray(cat.items) || cat.items.length < 8) errors.push(`INVALID_FIELD:pack.categories.${cIdx}.items`);

        if (Array.isArray(cat.items)) {
          cat.items.forEach((item, iIdx) => {
            if (!isRecord(item)) return errors.push(`INVALID_FIELD:pack.categories.${cIdx}.items.${iIdx}`);
            assertOnlyKeys(item, ["id", "title", "template"], `pack.categories.${cIdx}.items.${iIdx}`, errors);
            if (!nonEmptyString(item.id)) errors.push(`INVALID_FIELD:pack.categories.${cIdx}.items.${iIdx}.id`);
            if (!nonEmptyString(item.title)) errors.push(`INVALID_FIELD:pack.categories.${cIdx}.items.${iIdx}.title`);
            if (!nonEmptyString(item.template)) errors.push(`INVALID_FIELD:pack.categories.${cIdx}.items.${iIdx}.template`);
            const tokens = extractTemplateTokens(String(item.template || ""));
            if (!tokens.length) errors.push(`INVALID_TEMPLATE:NO_TOKEN:pack.categories.${cIdx}.items.${iIdx}`);
            tokens.forEach((t) => {
              if (!allow.has(t)) errors.push(`INVALID_TEMPLATE_TOKEN:${t}:pack.categories.${cIdx}.items.${iIdx}`);
            });
          });
        }
      });
    }
  }

  return errors.length ? { ok: false, error: "INVALID_SCHEMA", errors } : { ok: true, data: parsed as EditionPackDocument };
}

export function parseEditionPackDocument(input: string | unknown):
  | { ok: true; data: EditionPackDocument }
  | { ok: false; error: string; details?: string } {
  const result = validateEditionPackJson(input, [], { enforceUniqueSlug: false });
  if ("errors" in result) return { ok: false, error: result.error, details: result.errors[0] };
  return { ok: true, data: result.data };
}
