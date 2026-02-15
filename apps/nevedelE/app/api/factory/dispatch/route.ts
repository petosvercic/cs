export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { validateEditionJson } from "../../../../lib/edition-json";
import { listEditions } from "../../../../lib/editions-store";

function resolveRepoParts() {
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
  const content =
    typeof json?.content === "string"
      ? Buffer.from(String(json.content).replace(/\n/g, ""), "base64").toString("utf8")
      : "";
  return { sha: String(json?.sha || ""), content };
}

async function ghPutContent(args: {
  owner: string;
  repo: string;
  token: string;
  path: string;
  ref: string;
  message: string;
  content: string;
  sha?: string;
}) {
  const u = `https://api.github.com/repos/${args.owner}/${args.repo}/contents/${args.path}`;
  const body: any = {
    message: args.message,
    branch: args.ref,
    content: Buffer.from(args.content, "utf8").toString("base64"),
  };
  if (args.sha) body.sha = args.sha;

  const res = await fetch(u, {
    method: "PUT",
    headers: ghHeaders(args.token),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GITHUB_CONTENT_PUT_FAILED:${res.status}:${text.slice(0, 200)}`);
  }
}

async function persistEditionInGithub(args: { owner: string; repo: string; token: string; ref: string; edition: any }) {
  const now = new Date().toISOString();
  const edition = { ...args.edition, createdAt: args.edition.createdAt || now };
  const slug = String(edition.slug);

  const idxPath = "apps/nevedelE/data/editions.json";
  const edPath = `apps/nevedelE/data/editions/${slug}.json`;

  const idxCurrent = await ghGetContent({ ...args, path: idxPath });
  const idxSha = idxCurrent?.sha;

  let idx: any = { editions: [] };
  if (idxCurrent?.content) {
    try {
      idx = JSON.parse(idxCurrent.content.replace(/^\uFEFF/, ""));
    } catch {
      idx = { editions: [] };
    }
  }
  if (!Array.isArray(idx.editions)) idx.editions = [];

  if (!idx.editions.some((e: any) => e?.slug === slug)) {
    idx.editions.unshift({ slug, title: String(edition.title || slug), createdAt: edition.createdAt });
  }

  await ghPutContent({
    ...args,
    path: idxPath,
    sha: idxSha,
    message: `chore(factory): update index for ${slug}`,
    content: JSON.stringify(idx, null, 2) + "\n",
  });

  const existingEdition = await ghGetContent({ ...args, path: edPath });
  await ghPutContent({
    ...args,
    path: edPath,
    sha: existingEdition?.sha,
    message: `chore(factory): add edition ${slug}`,
    content: JSON.stringify(edition, null, 2) + "\n",
  });

  return { slug };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const rawEditionJsonInput = (body as any)?.rawEditionJson;
    const rawEditionJson =
      typeof rawEditionJsonInput === "string"
        ? rawEditionJsonInput
        : rawEditionJsonInput
          ? JSON.stringify(rawEditionJsonInput)
          : "";

    const editionInBody = (body as any)?.edition;
    const inputJson = rawEditionJson || JSON.stringify(editionInBody ?? {});

    // default slugs = z lokalneho store
    let existingSlugs = listEditions().map((e) => e.slug);

    // source of truth slugs = GitHub index (aby neboli duplicity)
    try {
      const tokenForSlugs = (process.env.GITHUB_TOKEN || "").trim();
      if (tokenForSlugs) {
        const { owner, repo } = resolveRepoParts();
        const refForSlugs = (process.env.GITHUB_REF || "main").trim();
        const idx = await ghGetContent({
          owner,
          repo,
          token: tokenForSlugs,
          path: "apps/nevedelE/data/editions.json",
          ref: refForSlugs,
        });
        if (idx?.content) {
          const parsed = JSON.parse(idx.content.replace(/^\uFEFF/, ""));
          const arr = Array.isArray(parsed?.editions) ? parsed.editions : [];
          const slugs = arr.map((x: any) => String(x?.slug || "")).filter(Boolean);
          if (slugs.length) existingSlugs = slugs;
        }
      }
    } catch {
      // ignore, fallback na local
    }

    const validated = validateEditionJson(inputJson, existingSlugs);
    if (!validated.ok) {
      return NextResponse.json(
        { ok: false, error: validated.error, details: (validated as any).details, debug: (validated as any).debug },
        { status: 400 }
      );
    }

    const token = (process.env.GITHUB_TOKEN || "").trim();
    if (!token) throw new Error("Missing env: GITHUB_TOKEN");

    const { owner, repo } = resolveRepoParts();
    const ref = (process.env.GITHUB_REF || "main").trim();

    // REZIM B: iba persist do GitHubu, ziadne Actions
    const { slug } = await persistEditionInGithub({ owner, repo, token, ref, edition: validated.obj });

    const indexUrl = `https://github.com/${owner}/${repo}/blob/${ref}/apps/nevedelE/data/editions.json`;
    const editionUrl = `https://github.com/${owner}/${repo}/blob/${ref}/apps/nevedelE/data/editions/${encodeURIComponent(slug)}.json`;

    return NextResponse.json(
      {
        ok: true,
        slug,
        mode: "github-contents-only",
        indexUrl,
        editionUrl,
        message: "Edition persisted directly to GitHub (no Actions). Vercel deploy will follow from main.",
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR", message: String(e?.message ?? e) }, { status: 500 });
  }
}
