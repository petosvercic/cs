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
    const pkg = await readJsonFile<{ workspaces?: string[] }>(packageJsonPath);
    if (pkg?.workspaces?.includes("apps/*")) return cursor;

    const parent = path.dirname(cursor);
    if (parent === cursor) break;
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

  let entries: string[] = [];
  try {
    entries = await fs.readdir(appsDir);
  } catch {
    // admin-only deploy môže byť izolovaný -> vráť prázdno (alebo neskôr registry)
    return [];
  }

  const items: ProductItem[] = [];

  for (const entry of entries) {
    const fullPath = path.join(appsDir, entry);
    if (!(await appLooksLikeNextApp(fullPath))) continue;

    items.push({
      id: entry,
      title: entry,
      path: path.relative(repoRoot, fullPath).replace(/\\/g, "/"),
      exists: true
    });
  }

  return items.sort((a, b) => a.id.localeCompare(b.id));
}

export async function getProductDetail(productId: string): Promise<ProductDetail | null> {
  const repoRoot = await resolveRepoRoot();
  const productDir = path.join(repoRoot, "apps", productId);

  const exists = await pathExists(productDir);
  if (!exists) return null;

  const packageJsonPath = path.join(productDir, "package.json");
  const packageJson =
    (await readJsonFile<{
      name?: string;
      scripts?: Record<string, string>;
      dependencies?: Record<string, string>;
    }>(packageJsonPath)) ?? {};

  let lastModified: string | null = null;
  try {
    const stat = await fs.stat(packageJsonPath);
    lastModified = stat.mtime.toISOString();
  } catch {
    lastModified = null;
  }

  const deps = packageJson.dependencies ? Object.keys(packageJson.dependencies) : [];

  return {
    id: productId,
    name: packageJson.name ?? productId,
    title: productId,
    path: path.relative(repoRoot, productDir).replace(/\\/g, "/"),
    exists: true,
    scripts: packageJson.scripts ?? {},
    dependenciesSummary: {
      count: deps.length,
      names: deps.sort((a, b) => a.localeCompare(b))
    },
    lastModified
  };
}

function normalizeEditionsPayload(payload: unknown): EditionItem[] {
  if (!payload) return [];
  const obj = payload as any;

  // SUPPORT: { editions: [...] } (your current format)
  // ALSO: { items: [...] } (older/admin format)
  // ALSO: [ ... ] (raw array)
  const list = Array.isArray(obj)
    ? obj
    : Array.isArray(obj.editions)
      ? obj.editions
      : Array.isArray(obj.items)
        ? obj.items
        : [];

  return list
    .map((item: any) => {
      const slug = String(item?.slug ?? item?.id ?? "").trim();
      const title = String(item?.title ?? item?.name ?? "").trim();
      const updatedAt =
        item?.updatedAt ? String(item.updatedAt) : item?.updated ? String(item.updated) : undefined;
      if (!slug || !title) return null;
      return { slug, title, updatedAt } as EditionItem;
    })
    .filter(Boolean) as EditionItem[];
}

function getGithubEnv() {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const ref = process.env.GITHUB_BASE_BRANCH ?? "main";
  if (!token || !owner || !repo) return null;
  return { token, owner, repo, ref };
}

async function readGithubJsonFile<T>(repoPath: string): Promise<T | null> {
  const env = getGithubEnv();
  if (!env) return null;

  const url = `https://api.github.com/repos/${env.owner}/${env.repo}/contents/${repoPath}?ref=${encodeURIComponent(env.ref)}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `token ${env.token}`,
      Accept: "application/vnd.github+json"
    },
    cache: "no-store"
  });

  if (!res.ok) return null;

  const data: any = await res.json();
  if (!data?.content || data?.encoding !== "base64") return null;

  const raw = Buffer.from(data.content, "base64").toString("utf8");
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
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

  const localSearchedPaths = candidates.map((c) => path.join(productDir, c).replace(/\\/g, "/"));

  // 1) Local FS (dev / monorepo root deploy)
  for (const candidate of candidates) {
    const absolutePath = path.join(productDir, candidate);
    const payload = await readJsonFile<unknown>(absolutePath);
    if (payload === null) continue;

    return {
      product: productId,
      items: normalizeEditionsPayload(payload),
      sourceNotFound: false,
      sourcePath: path.relative(repoRoot, absolutePath).replace(/\\/g, "/"),
      searchedPaths: localSearchedPaths
    };
  }

  // 2) GitHub fallback (admin-only deploy)
  const githubSearchedPaths = candidates.map((c) => `apps/${productId}/${c}`);
  for (const candidate of candidates) {
    const repoPath = `apps/${productId}/${candidate}`;
    const payload = await readGithubJsonFile<unknown>(repoPath);
    if (payload === null) continue;

    return {
      product: productId,
      items: normalizeEditionsPayload(payload),
      sourceNotFound: false,
      sourcePath: repoPath,
      searchedPaths: [...localSearchedPaths, ...githubSearchedPaths]
    };
  }

  return {
    product: productId,
    items: [],
    sourceNotFound: true,
    sourcePath: null,
    searchedPaths: [...localSearchedPaths, ...githubSearchedPaths]
  };
}

export async function getRootBuildCommands(): Promise<string[]> {
  const repoRoot = await resolveRepoRoot();
  const rootPkg = await readJsonFile<{ scripts?: Record<string, string> }>(path.join(repoRoot, "package.json"));
  const scripts = rootPkg?.scripts ?? {};
  return Object.entries(scripts).map(([name, cmd]) => `${name}  # ${cmd}`);
}
