import fs from "node:fs";
import path from "node:path";

export type EditionIndexEntry = { slug: string; title: string; createdAt?: string };
export type EditionDocument = {
  slug: string;
  title: string;
  createdAt?: string;
  engine?: { subject?: string; locale?: "sk" | "cz" | "en" };
  content?: Record<string, any>;
  tasks?: any;
};

function readJsonNoBom(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function resolveDataRoot() {
  const cwd = process.cwd();
  const envRoot = (process.env.EDITIONS_ROOT || "").trim();
  const roots = [
    ...(envRoot ? [envRoot] : []),
    cwd,
    path.resolve(cwd, ".."),
    path.resolve(cwd, "..", ".."),
  ];

  for (const root of roots) {
    const direct = path.join(root, "data", "editions.json");
    if (fs.existsSync(direct)) return path.join(root, "data");

    const appScoped = path.join(root, "apps", "nevedelE", "data", "editions.json");
    if (fs.existsSync(appScoped)) return path.join(root, "apps", "nevedelE", "data");
  }

  return path.join(cwd, "data");
}

export function getDataPaths() {
  const dataRoot = resolveDataRoot();
  return {
    dataRoot,
    indexPath: path.join(dataRoot, "editions.json"),
    editionsDir: path.join(dataRoot, "editions"),
  };
}

export function persistEditionLocally(edition: EditionDocument): void {
  const { indexPath, editionsDir } = getDataPaths();
  fs.mkdirSync(editionsDir, { recursive: true });

  const now = new Date().toISOString();
  const normalizedEdition = { ...edition, createdAt: edition.createdAt || now };

  const edPath = path.join(editionsDir, `${edition.slug}.json`);
  fs.writeFileSync(edPath, JSON.stringify(normalizedEdition, null, 2) + "\n", "utf8");

  let idx: { editions: EditionIndexEntry[] } = { editions: [] };
  if (fs.existsSync(indexPath)) {
    idx = readJsonNoBom(indexPath);
  }
  if (!Array.isArray(idx.editions)) idx.editions = [];

  if (!idx.editions.some((e) => e?.slug === edition.slug)) {
    idx.editions.unshift({
      slug: edition.slug,
      title: edition.title,
      createdAt: normalizedEdition.createdAt,
    });
  }

  fs.writeFileSync(indexPath, JSON.stringify(idx, null, 2) + "\n", "utf8");
}

export function listEditions(): EditionIndexEntry[] {
  const { indexPath, editionsDir } = getDataPaths();

  try {
    const idx = readJsonNoBom(indexPath);
    if (Array.isArray(idx?.editions)) {
      return idx.editions
        .filter((e: any) => e && typeof e.slug === "string" && typeof e.title === "string")
        .map((e: any) => ({ slug: e.slug, title: e.title, createdAt: e.createdAt }));
    }
  } catch {
    // fallback below
  }

  if (!fs.existsSync(editionsDir)) return [];

  return fs
    .readdirSync(editionsDir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => {
      const doc = readJsonNoBom(path.join(editionsDir, name));
      return {
        slug: String(doc.slug || name.replace(/\.json$/, "")),
        title: String(doc.title || doc.slug || name),
        createdAt: typeof doc.createdAt === "string" ? doc.createdAt : undefined,
      } as EditionIndexEntry;
    });
}

export function loadEditionBySlug(slug: string): EditionDocument | null {
  const safeSlug = String(slug || "").trim();
  if (!safeSlug) return null;

  const { editionsDir } = getDataPaths();
  const filePath = path.join(editionsDir, `${safeSlug}.json`);
  if (!fs.existsSync(filePath)) return null;

  try {
    return readJsonNoBom(filePath) as EditionDocument;
  } catch {
    return null;
  }
}
