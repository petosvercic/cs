export const dynamic = "force-dynamic";

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { NextResponse } from "next/server";
import { validateEditionJson } from "../../../../lib/edition-json";
import { getDataPaths, listEditions } from "../../../../lib/editions-store";
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
  const content = typeof json?.content === "string" ? Buffer.from(json.content.replace(/\n/g, ""), "base64").toString("utf8") : "";
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
      idx = JSON.parse(idxCurrent.content.replace(/^ÄŹÂ»ĹĽ/, ""));
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
}


async function dispatchWorkflow(args: {
  owner: string;
  repo: string;
  token: string;
  workflow: string;
  ref: string;
  inputs: Record<string, string>;
}) {
  const url = `https://api.github.com/repos/${args.owner}/${args.repo}/actions/workflows/${args.workflow}/dispatches`;
  return fetch(url, {
    method: "POST",
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${args.token}`,
      "x-github-api-version": "2022-11-28",
      "content-type": "application/json",
    },
    body: JSON.stringify({ ref: args.ref, inputs: args.inputs }),
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const rawEditionJsonInput = (body as any)?.rawEditionJson;
    const rawEditionJson = typeof rawEditionJsonInput === "string" ? rawEditionJsonInput : rawEditionJsonInput ? JSON.stringify(rawEditionJsonInput) : "";

    const editionInBody = (body as any)?.edition;

    const inputJson = rawEditionJson || JSON.stringify(editionInBody ?? {});
    let existingSlugs = listEditions().map((e) => e.slug);

    // Source of truth = GitHub index (aby sme nechytili duplicitu kvĂ´li stale deploy)
    try {
      const tokenForSlugs = (process.env.GITHUB_TOKEN || "").trim();
      if (tokenForSlugs) {
        const { owner, repo } = resolveRepoParts();
        const refForSlugs = (process.env.GITHUB_REF || "main").trim();
        const idx = await ghGetContent({ owner, repo, token: tokenForSlugs, path: "apps/nevedelE/data/editions.json", ref: refForSlugs });
        if (idx?.content) {
          const parsed = JSON.parse(idx.content.replace(/^\uFEFF/, ""));
          const arr = Array.isArray(parsed?.editions) ? parsed.editions : [];
          const slugs = arr.map((x: any) => String(x?.slug || "")).filter(Boolean);
          if (slugs.length) existingSlugs = slugs;
        }
      }
    } catch {}

    const validated = validateEditionJson(inputJson, existingSlugs);

    if (!validated.ok) {
      console.error("dispatch validation failed", {
        error: validated.error,
        details: (validated as any).details,
        debug: (validated as any).debug,
      });
      return NextResponse.json({ ok: false, error: validated.error, details: (validated as any).details, debug: (validated as any).debug }, { status: 400 });
     
    }

    const edition = validated.obj;

    try {
      const token = (process.env.GITHUB_TOKEN || "").trim();
      if (!token) throw new Error("Missing GITHUB_TOKEN");
      const { owner, repo } = resolveRepoParts();
      const ref = (process.env.GITHUB_REF || "main").trim();
      await persistEditionInGithub({ owner, repo, token, ref, edition });
    } catch (e: any) {
      console.warn("local persist skipped", String(e?.message ?? e));
    }

    const { owner, repo } = resolveRepoParts();
    const token = (process.env.GITHUB_TOKEN || "").trim();
    if (!token) throw new Error("Missing env: GITHUB_TOKEN");

    const workflow = process.env.GITHUB_WORKFLOW ?? "factory.yml";
    const ref = process.env.GITHUB_REF ?? "main";
    const plainPayload = JSON.stringify(edition);
    let res = await dispatchWorkflow({
      owner,
      repo,
      token,
      workflow,
      ref,
      inputs: { edition_json: plainPayload },
 });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const isTooLarge = res.status === 422 && /inputs are too large/i.test(text);

      if (isTooLarge) {
        const gz = zlib.gzipSync(Buffer.from(plainPayload, "utf8")).toString("base64");
        res = await dispatchWorkflow({
          owner,
          repo,
          token,
          workflow,
          ref,
          inputs: { edition_json_gzip_b64: gz },
        });

        if (res.ok) {
          const runUrl = `https://github.com/${owner}/${repo}/actions/workflows/${workflow}`;
          return NextResponse.json({ ok: true, runUrl, slug: edition.slug, mode: "workflow-dispatch-gzip" }, { status: 200 });
        }

        const text2 = await res.text().catch(() => "");
        try {
          await persistEditionInGithub({ owner, repo, token, ref, edition });
          return NextResponse.json(
            {
              ok: true,
              slug: edition.slug,
              mode: "github-contents-fallback",
              message: "Workflow inputs too large; persisted directly via GitHub Contents API.",
            },
            { status: 200 }
          );
        } catch (e: any) {
          const fallbackErr = String(e?.message ?? e);
          const isTokenPerm = /GITHUB_CONTENT_PUT_FAILED:403/.test(fallbackErr);
          return NextResponse.json(
            {
              ok: false,
              error: isTokenPerm ? "GITHUB_TOKEN_CONTENTS_PERMISSION_REQUIRED" : "GITHUB_FALLBACK_PERSIST_FAILED",
              status: res.status,
              message: `${text.slice(0, 200)} | gzip: ${text2.slice(0, 200)} | fallback: ${fallbackErr}`,
              hint: isTokenPerm
                ? "PAT must include repository Contents write access (or use a token with repo:contents write)."
                : undefined,
            },
            { status: 500 }
          );
        }
      }

      return NextResponse.json(
        { ok: false, error: "GITHUB_DISPATCH_FAILED", status: res.status, message: text.slice(0, 500) },
        { status: 500 }
      );
    }

    const runUrl = `https://github.com/${owner}/${repo}/actions/workflows/${workflow}`;
    return NextResponse.json({ ok: true, runUrl, slug: edition.slug, mode: "workflow-dispatch" }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR", message: String(e?.message ?? e) }, { status: 500 });
  }
}


