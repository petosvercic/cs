import fs from "node:fs";
import path from "node:path";

// Minimal type used by store + factory.
// Keep it loose to avoid cross-file type import breakage during builds.
export type EditionPackDocument = {
  slug: string;
  title: string;
  createdAt?: string;
  updatedAt?: string;
  // optional payload
  content?: unknown;
  [key: string]: unknown;
};

export type EditionIndexEntry = {
  slug: string;
  title: string;
  createdAt?: string;
  updatedAt?: string;
};

function readJsonNoBom(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function getCanonicalDataRoot() {
  const cwd = process.cwd();
  if (cwd.endsWith(path.join("apps", "nevedelE"))) return path.join(cwd, "data");
  return path.resolve(cwd, "apps", "nevedelE", "data");
}

export function getDataPaths() {
  const dataRoot = getCanonicalDataRoot();
  return {
    dataRoot,
    indexPath: path.join(dataRoot, "editions.json"),
    editionsDir: path.join(dataRoot, "editions"),
  };
}

export function persistEditionLocally(edition: EditionPackDocument): void {
  const { indexPath, editionsDir } = getDataPaths();
  fs.mkdirSync(editionsDir, { recursive: true });

  const now = new Date().toISOString();
  const normalizedEdition: EditionPackDocument = {
    ...edition,
    createdAt: edition.createdAt || now,
    updatedAt: now,
  };

  fs.writeFileSync(
    path.join(editionsDir, `${edition.slug}.json`),
    JSON.stringify(normalizedEdition, null, 2) + "\n",
    "utf8"
  );

  let idx: { editions: EditionIndexEntry[] } = { editions: [] };
  if (fs.existsSync(indexPath)) idx = readJsonNoBom(indexPath);
  if (!Array.isArray(idx.editions)) idx.editions = [];

  const existingIndex = idx.editions.findIndex((e) => e?.slug === edition.slug);
  const nextEntry: EditionIndexEntry = {
    slug: edition.slug,
    title: edition.title,
    createdAt:
      existingIndex >= 0
        ? (idx.editions[existingIndex]?.createdAt || normalizedEdition.createdAt)
        : normalizedEdition.createdAt,
    updatedAt: now,
  };

  if (existingIndex === -1) idx.editions.unshift(nextEntry);
  else idx.editions[existingIndex] = nextEntry;

  fs.writeFileSync(indexPath, JSON.stringify(idx, null, 2) + "\n", "utf8");
}

export function listEditions(): EditionIndexEntry[] {
  const { indexPath } = getDataPaths();
  if (!fs.existsSync(indexPath)) return [];

  try {
    const idx = readJsonNoBom(indexPath);
    if (!Array.isArray(idx?.editions)) return [];
    return idx.editions
      .filter((e: any) => e && typeof e.slug === "string" && typeof e.title === "string")
      .map((e: any) => ({
        slug: e.slug,
        title: e.title,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      }));
  } catch {
    return [];
  }
}

export function loadEditionBySlug(slug: string): EditionPackDocument | null {
  const safeSlug = String(slug || "").trim();
  if (!safeSlug) return null;

  const { editionsDir } = getDataPaths();
  const filePath = path.join(editionsDir, `${safeSlug}.json`);
  if (!fs.existsSync(filePath)) return null;

  try {
    return readJsonNoBom(filePath) as EditionPackDocument;
  } catch {
    return null;
  }
}
