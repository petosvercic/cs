export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

function resolveRepoParts() {
  const repoRaw = (process.env.GITHUB_REPO || "").trim();
  const ownerRaw = (process.env.GITHUB_OWNER || "").trim();

  if (repoRaw.includes("/")) {
    const [owner, repo] = repoRaw.split("/").map((x) => x.trim()).filter(Boolean);
    if (owner && repo) return { owner, repo };
  }
  if (ownerRaw && repoRaw) return { owner: ownerRaw, repo: repoRaw };

  throw new Error("Missing env: GITHUB_REPO (use <owner>/<repo> or set GITHUB_OWNER + GITHUB_REPO)");
}

function ghHeaders(token: string) {
  return {
    accept: "application/vnd.github+json",
    authorization: `Bearer ${token}`,
    "x-github-api-version": "2022-11-28",
  };
}

async function ghListDir(args: { owner: string; repo: string; token: string; path: string; ref: string }) {
  const u = `https://api.github.com/repos/${args.owner}/${args.repo}/contents/${args.path}?ref=${encodeURIComponent(args.ref)}`;
  const res = await fetch(u, { headers: ghHeaders(args.token), cache: "no-store" });
  if (!res.ok) throw new Error(`GITHUB_DIR_LIST_FAILED:${res.status}`);
  return res.json();
}

export async function GET() {
  try {
    const token = (process.env.GITHUB_TOKEN || "").trim();
    const ref = (process.env.GITHUB_REF || process.env.GITHUB_BRANCH || "main").trim();
    if (!token) return NextResponse.json({ ok: false, error: "Missing env: GITHUB_TOKEN" }, { status: 500 });

    const { owner, repo } = resolveRepoParts();
    const items = await ghListDir({ owner, repo, token, ref, path: "apps/nevedelE/data/editions" });

    const slugs: string[] = Array.isArray(items)
      ? items
          .filter((x: any) => x?.type === "file" && typeof x?.name === "string" && x.name.endsWith(".json"))
          .map((x: any) => x.name.replace(/\.json$/i, ""))
      : [];

    slugs.sort();
    return NextResponse.json({ ok: true, slugs }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Unknown error" }, { status: 500 });
  }
}
