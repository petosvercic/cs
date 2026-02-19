export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { validateEditionPackJson } from "../../../../lib/edition-pack";
import { listEditions, persistEditionLocally } from "../../../../lib/editions-store";

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
    "content-type": "application/json",
  };
}

async function ghGetContent(args: { owner: string; repo: string; token: string; path: string; ref: string }) {
  const u = `https://api.github.com/repos/${args.owner}/${args.repo}/contents/${args.path}?ref=${encodeURIComponent(args.ref)}`;
  const res = await fetch(u, { headers: ghHeaders(args.token) });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GITHUB_CONTENT_GET_FAILED:${res.status}`);
  const json: any = await res.json();
  const content = typeof json?.content === "string" ? Buffer.from(String(json.content).replace(/\n/g, ""), "base64").toString("utf8") : "";
  return { sha: String(json?.sha || ""), content };
}

async function ghPutContent(args: { owner: string; repo: string; token: string; path: string; ref: string; message: string; content: string; sha?: string }) {
  const u = `https://api.github.com/repos/${args.owner}/${args.repo}/contents/${args.path}`;
  const body: any = { message: args.message, branch: args.ref, content: Buffer.from(args.content, "utf8").toString("base64") };
  if (args.sha) body.sha = args.sha;
  const res = await fetch(u, { method: "PUT", headers: ghHeaders(args.token), body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`GITHUB_CONTENT_PUT_FAILED:${res.status}`);
}

async function persistEditionInGithub(args: { owner: string; repo: string; token: string; ref: string; edition: any }) {
  const now = new Date().toISOString();
  const edition = { ...args.edition, createdAt: args.edition.createdAt || now, updatedAt: now };
  const slug = String(edition.slug);

  const idxPath = "apps/nevedelE/data/editions.json";
  const edPath = `apps/nevedelE/data/editions/${slug}.json`;

  const idxCurrent = await ghGetContent({ ...args, path: idxPath });
  let idx: any = { editions: [] };
  if (idxCurrent?.content) idx = JSON.parse(idxCurrent.content.replace(/^\uFEFF/, ""));
  if (!Array.isArray(idx.editions)) idx.editions = [];

  const existingIdx = idx.editions.findIndex((e: any) => e?.slug === slug);
  const isNew = existingIdx === -1;
  const nextEntry = {
    slug,
    title: String(edition.title || slug),
    createdAt: isNew ? edition.createdAt : idx.editions[existingIdx]?.createdAt || edition.createdAt,
    updatedAt: now,
  };
  if (isNew) idx.editions.unshift(nextEntry);
  else idx.editions[existingIdx] = nextEntry;

  await ghPutContent({ ...args, path: idxPath, sha: idxCurrent?.sha, message: isNew ? `chore(factory): add edition ${slug}` : `chore(factory): update edition ${slug}`, content: JSON.stringify(idx, null, 2) + "\n" });
  const existingEdition = await ghGetContent({ ...args, path: edPath });
  await ghPutContent({ ...args, path: edPath, sha: existingEdition?.sha, message: isNew ? `chore(factory): add edition ${slug}` : `chore(factory): update edition ${slug}`, content: JSON.stringify(edition, null, 2) + "\n" });

  return { slug };
}

function requireFactoryAuth(req: Request) {
  const expected = (process.env.FACTORY_TOKEN || "").trim();
  if (!expected) return { ok: false as const, status: 401, error: "FACTORY_TOKEN_MISSING" };
  const hdr = (req.headers.get("x-factory-token") || "").trim();
  if (hdr && hdr === expected) return { ok: true as const };
  const cookie = req.headers.get("cookie") || "";
  if (/(?:^|;\s*)factory=1(?:;|$)/.test(cookie)) return { ok: true as const };
  return { ok: false as const, status: 401, error: "UNAUTHORIZED" };
}

export async function POST(req: Request) {
  try {
    const auth = requireFactoryAuth(req);
    if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

    const body: any = await req.json().catch(() => null);
    const raw = typeof body?.rawEditionJson === "string" ? body.rawEditionJson : JSON.stringify(body?.edition ?? {});

    const validated = validateEditionPackJson(raw, listEditions().map((e) => e.slug));
    if ("errors" in validated) {
      return NextResponse.json({ ok: false, error: validated.error, errors: validated.errors }, { status: 400 });
    }

    const exists = listEditions().some((e) => e.slug === validated.data.slug);
    const token = (process.env.GITHUB_TOKEN || "").trim();

    if (token) {
      const { owner, repo } = resolveRepoParts();
      const ref = (process.env.GITHUB_REF || "main").trim();
      const { slug } = await persistEditionInGithub({ owner, repo, token, ref, edition: validated.data });
      return NextResponse.json({ ok: true, slug, mode: "github-contents-only", message: exists ? `chore(factory): update edition ${slug}` : `chore(factory): add edition ${slug}` });
    }

    persistEditionLocally(validated.data);
    return NextResponse.json({ ok: true, slug: validated.data.slug, mode: "local", message: exists ? `chore(factory): update edition ${validated.data.slug}` : `chore(factory): add edition ${validated.data.slug}` });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR", message: String(e?.message ?? e) }, { status: 500 });
  }
}
