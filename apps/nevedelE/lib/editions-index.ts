import { listEditions, type EditionIndexEntry } from "./editions-store";

type RepoParts = { owner: string; repo: string };

function resolveRepoParts(): RepoParts {
  const repoRaw = (process.env.GITHUB_REPO || "").trim();
  const ownerRaw = (process.env.GITHUB_OWNER || "").trim();

  if (repoRaw.includes("/")) {
    const [owner, repo] = repoRaw
      .split("/")
      .map((x) => x.trim())
      .filter(Boolean);
    if (owner && repo) return { owner, repo };
  }

  if (ownerRaw && repoRaw) return { owner: ownerRaw, repo: repoRaw };

  throw new Error("Missing env: GITHUB_REPO (use <owner>/<repo> or set GITHUB_OWNER + GITHUB_REPO)");
}

function ghHeaders(token: string) {
  return {
    accept: "application/vnd.github+json",
    authorization: `Bearer ${token}`,
    "x-github-api-version": "2022-11-28"
  };
}

async function readIndexFromGithub(): Promise<EditionIndexEntry[]> {
  const token = (process.env.GITHUB_TOKEN || "").trim();
  if (!token) return [];

  const { owner, repo } = resolveRepoParts();
  const ref = (process.env.GITHUB_REF || process.env.GITHUB_BRANCH || "main").trim();
  const path = "apps/nevedelE/data/editions.json";

  const u = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(ref)}`;
  const res = await fetch(u, { headers: ghHeaders(token), cache: "no-store" });
  if (!res.ok) {
    throw new Error(`GITHUB_CONTENT_GET_FAILED:${res.status}`);
  }

  const json: any = await res.json();
  const raw =
    typeof json?.content === "string"
      ? Buffer.from(String(json.content).replace(/\n/g, ""), "base64").toString("utf8")
      : "";

  const parsed = JSON.parse(raw.replace(/^\uFEFF/, ""));
  const entries = Array.isArray(parsed?.editions) ? parsed.editions : [];

  return entries
    .filter((item: any) => item && typeof item.slug === "string" && typeof item.title === "string")
    .map((item: any) => ({
      slug: item.slug,
      title: item.title,
      createdAt: typeof item.createdAt === "string" ? item.createdAt : undefined,
      updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : undefined
    }));
}

export async function getEditionsIndex(): Promise<EditionIndexEntry[]> {
  const hasGithubToken = Boolean((process.env.GITHUB_TOKEN || "").trim());

  if (hasGithubToken) {
    return readIndexFromGithub();
  }

  return listEditions();
}
