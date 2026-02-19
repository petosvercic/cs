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

const LEGACY_KEYS = ["tasks", "pickPerCategory", "variants", "engine"] as const;
const PLACEHOLDER_RE = /\{(\w+)\}/g;
const ALLOWED_PLACEHOLDERS = new Set(["name", "birthYear", "age", "day", "month", "year"]);

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function hasLegacyKeys(raw: string): boolean {
  return LEGACY_KEYS.some((k) => new RegExp(`(^|[\\s\\"'])${k}[\\s\\"]*:`).test(raw));
}

function nonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function isKebabCase(v: string, min = 1, max = 64): boolean {
  if (v.length < min || v.length > max) return false;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v);
}

export function parseEditionPackDocument(input: string | unknown):
  | { ok: true; data: EditionPackDocument }
  | { ok: false; error: string; details?: string } {
  const raw = typeof input === "string" ? input : JSON.stringify(input ?? {});
  if (hasLegacyKeys(raw)) return { ok: false, error: "LEGACY_SCHEMA_NOT_ALLOWED" };

  let parsed: unknown;
  try {
    parsed = typeof input === "string" ? JSON.parse(String(input).replace(/^\uFEFF/, "")) : input;
  } catch {
    return { ok: false, error: "INVALID_JSON" };
  }

  if (!isRecord(parsed)) return { ok: false, error: "INVALID_SCHEMA", details: "root" };
  const doc = parsed as Record<string, unknown>;

  if (!nonEmptyString(doc.slug) || !isKebabCase(doc.slug, 3, 64)) {
    return { ok: false, error: "INVALID_SCHEMA", details: "slug" };
  }
  if (!nonEmptyString(doc.title)) return { ok: false, error: "INVALID_SCHEMA", details: "title" };
  if (!isRecord(doc.pack)) return { ok: false, error: "INVALID_SCHEMA", details: "pack" };

  const pack = doc.pack as Record<string, unknown>;
  if (!isRecord(pack.uiCopy)) return { ok: false, error: "INVALID_SCHEMA", details: "pack.uiCopy" };
  const uiCopy = pack.uiCopy as Record<string, unknown>;

  for (const key of ["heroTitle", "heroSubtitle", "unlockCta"] as const) {
    if (!nonEmptyString(uiCopy[key])) return { ok: false, error: "INVALID_SCHEMA", details: `pack.uiCopy.${key}` };
  }

  if (pack.theme !== undefined) {
    if (!isRecord(pack.theme)) return { ok: false, error: "INVALID_SCHEMA", details: "pack.theme" };
    const theme = pack.theme as Record<string, unknown>;
    if (theme.backgroundImageUrl !== undefined && typeof theme.backgroundImageUrl !== "string") {
      return { ok: false, error: "INVALID_SCHEMA", details: "pack.theme.backgroundImageUrl" };
    }
    if (
      theme.backgroundOverlay !== undefined &&
      theme.backgroundOverlay !== "none" &&
      theme.backgroundOverlay !== "soft" &&
      theme.backgroundOverlay !== "strong"
    ) {
      return { ok: false, error: "INVALID_SCHEMA", details: "pack.theme.backgroundOverlay" };
    }
  }

  if (!Array.isArray(pack.categories) || pack.categories.length < 1) {
    return { ok: false, error: "INVALID_SCHEMA", details: "pack.categories" };
  }

  for (let i = 0; i < pack.categories.length; i++) {
    const category = pack.categories[i];
    if (!isRecord(category)) return { ok: false, error: "INVALID_SCHEMA", details: `pack.categories.${i}` };
    for (const key of ["id", "title", "intro", "lockedIntro"] as const) {
      if (!nonEmptyString(category[key])) {
        return { ok: false, error: "INVALID_SCHEMA", details: `pack.categories.${i}.${key}` };
      }
    }
    if (!isKebabCase(String(category.id))) {
      return { ok: false, error: "INVALID_SCHEMA", details: `pack.categories.${i}.id` };
    }

    const items = category.items;
    if (!Array.isArray(items) || items.length < 5) {
      return { ok: false, error: "INVALID_SCHEMA", details: `pack.categories.${i}.items` };
    }

    for (let j = 0; j < items.length; j++) {
      const item = items[j];
      if (!isRecord(item)) return { ok: false, error: "INVALID_SCHEMA", details: `pack.categories.${i}.items.${j}` };
      for (const key of ["id", "title", "template"] as const) {
        if (!nonEmptyString(item[key])) {
          return { ok: false, error: "INVALID_SCHEMA", details: `pack.categories.${i}.items.${j}.${key}` };
        }
      }
      if (!isKebabCase(String(item.id))) {
        return { ok: false, error: "INVALID_SCHEMA", details: `pack.categories.${i}.items.${j}.id` };
      }

      const placeholders = [...String(item.template).matchAll(PLACEHOLDER_RE)].map((m) => m[1]);
      if (placeholders.length < 1 || placeholders.some((name) => !ALLOWED_PLACEHOLDERS.has(name))) {
        return { ok: false, error: "INVALID_SCHEMA", details: `pack.categories.${i}.items.${j}.template` };
      }
    }
  }

  return { ok: true, data: parsed as EditionPackDocument };
}
