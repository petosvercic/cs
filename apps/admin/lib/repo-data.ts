import fs from "node:fs/promises";
import path from "node:path";

export type ProductItem = {
  id: string;
  title: string;
  path: string;
  exists: boolean;
};

export type ProductDetail = {
  id: string;
  name: string;
  title: string;
  path: string;
  exists: boolean;
  scripts: Record<string, string>;
  dependenciesSummary: {
    count: number;
    names: string[];
  };
  lastModified: string | null;
};

export type EditionItem = {
  slug: string;
  title: string;
  updatedAt?: string;
};

export type EditionsResult = {
  product: string;
  items: EditionItem[];
  sourceNotFound: boolean;
  sourcePath: string | null;
  searchedPaths: string[];
};

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function resolveRepoRoot(): Promise<string> {
  let cursor = process.cwd();

  for (let i = 0; i < 6; i += 1) {
    const packageJsonPath = path.join(cursor, "package.json");
    const packageJson = await readJsonFile<{ workspaces?: string[] }>(packageJsonPath);

    if (packageJson?.workspaces?.includes("apps/*")) {
      return cursor;
    }

    const parent = path.dirname(cursor);
    if (parent === cursor) {
      break;
    }
    cursor = parent;
  }

  return process.cwd();
}

async function appLooksLikeNextApp(appDir: string): Promise<boolean> {
  const packageJsonPath = path.join(appDir, "package.json");
  const appRouterDir = path.join(appDir, "app");
  return (await pathExists(packageJsonPath)) && (await pathExists(appRouterDir));
}

export async function listProducts(): Promise<ProductItem[]> {
  const repoRoot = await resolveRepoRoot();
  const appsDir = path.join(repoRoot, "apps");

  const entries = await fs.readdir(appsDir, { withFileTypes: true }).catch(() => []);
  const products: ProductItem[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const appDir = path.join(appsDir, entry.name);
    const isNextApp = await appLooksLikeNextApp(appDir);
    if (!isNextApp) {
      continue;
    }

    products.push({
      id: entry.name,
      title: entry.name,
      path: path.relative(repoRoot, appDir).replace(/\\/g, "/"),
      exists: true
    });
  }

  products.sort((a, b) => a.id.localeCompare(b.id));
  return products;
}

export async function getProductDetail(productId: string): Promise<ProductDetail | null> {
  const repoRoot = await resolveRepoRoot();
  const appDir = path.join(repoRoot, "apps", productId);
  const packageJsonPath = path.join(appDir, "package.json");

  const exists = await appLooksLikeNextApp(appDir);
  if (!exists) {
    return null;
  }

  const pkg =
    (await readJsonFile<{
      name?: string;
      scripts?: Record<string, string>;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    }>(packageJsonPath)) ?? {};

  const deps = {
    ...(pkg.dependencies ?? {}),
    ...(pkg.devDependencies ?? {})
  };

  const stats = await fs.stat(packageJsonPath).catch(() => null);

  return {
    id: productId,
    name: pkg.name ?? productId,
    title: productId,
    path: path.relative(repoRoot, appDir).replace(/\\/g, "/"),
    exists,
    scripts: pkg.scripts ?? {},
    dependenciesSummary: {
      count: Object.keys(deps).length,
      names: Object.keys(deps).sort()
    },
    lastModified: stats?.mtime.toISOString() ?? null
  };
}

function normalizeEditionRecord(value: unknown): EditionItem | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const item = value as Record<string, unknown>;
  const slug =
    (typeof item.slug === "string" && item.slug) ||
    (typeof item.id === "string" && item.id) ||
    (typeof item.code === "string" && item.code) ||
    "";

  if (!slug) {
    return null;
  }

  const title =
    (typeof item.title === "string" && item.title) ||
    (typeof item.name === "string" && item.name) ||
    slug;

  const updatedAt =
    (typeof item.updatedAt === "string" && item.updatedAt) ||
    (typeof item.updated_at === "string" && item.updated_at) ||
    undefined;

  return { slug, title, updatedAt };
}

function normalizeEditionsPayload(payload: unknown): EditionItem[] {
  if (Array.isArray(payload)) {
    return payload.map(normalizeEditionRecord).filter((item): item is EditionItem => Boolean(item));
  }

  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;

    if (Array.isArray(obj.editions)) {
      return obj.editions
        .map(normalizeEditionRecord)
        .filter((item): item is EditionItem => Boolean(item));
    }

    return Object.entries(obj)
      .map(([slug, raw]) => {
        if (raw && typeof raw === "object") {
          const source = raw as Record<string, unknown>;
          return normalizeEditionRecord({ slug, ...source });
        }

        if (typeof raw === "string") {
          return { slug, title: raw };
        }

        return null;
      })
      .filter((item): item is EditionItem => Boolean(item));
  }

  return [];
}

export async function listEditionsForProduct(productId: string): Promise<EditionsResult> {
  const repoRoot = await resolveRepoRoot();
  const productDir = path.join(repoRoot, "apps", productId);

  const candidates = [
    "data/editions.json",
    "data/editions/index.json",
    "lib/editions.json",
    "lib/editions/index.json",
    "public/editions.json",
    "public/editions/index.json",
    "app/editions/data.json",
    "app/editions/index.json"
  ];

  const searchedPaths = candidates.map((candidate) =>
    path.join(productDir, candidate).replace(/\\/g, "/")
  );

  for (const candidate of candidates) {
    const absolutePath = path.join(productDir, candidate);
    const payload = await readJsonFile<unknown>(absolutePath);

    if (payload === null) {
      continue;
    }

    return {
      product: productId,
      items: normalizeEditionsPayload(payload),
      sourceNotFound: false,
      sourcePath: path.relative(repoRoot, absolutePath).replace(/\\/g, "/"),
      searchedPaths
    };
  }

  return {
    product: productId,
    items: [],
    sourceNotFound: true,
    sourcePath: null,
    searchedPaths
  };
}

export async function getRootBuildCommands(): Promise<string[]> {
  const repoRoot = await resolveRepoRoot();
  const rootPackage =
    (await readJsonFile<{ scripts?: Record<string, string> }>(path.join(repoRoot, "package.json"))) ?? {};

  const scripts = rootPackage.scripts ?? {};
  return Object.entries(scripts)
    .map(([name, command]) => `npm run ${name}  # ${command}`)
    .slice(0, 12);
}
