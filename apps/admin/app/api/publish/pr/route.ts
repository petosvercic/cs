import { NextResponse } from "next/server";

function json(status: number, payload: any) {
  return NextResponse.json(payload, { status });
}

function getHeader(req: Request, name: string): string {
  return req.headers.get(name) ?? "";
}

function isSlug(s: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+){0,63}$/.test(s) && s.length >= 3 && s.length <= 64;
}

function isProductId(s: string): boolean {
  return /^[a-zA-Z0-9_-]{2,64}$/.test(s);
}

async function readJson(req: Request): Promise<any> {
  const text = await req.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return null; }
}

async function gh(apiBase: string, token: string, path: string, init?: RequestInit) {
  const res = await fetch(apiBase + path, {
    ...init,
    headers: {
      "authorization": `Bearer ${token}`,
      "accept": "application/vnd.github+json",
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const txt = await res.text();
  let data: any = null;
  try { data = txt ? JSON.parse(txt) : null; } catch { data = null; }
  return { ok: res.ok, status: res.status, text: txt, data };
}

function toBase64Utf8(s: string): string {
  return Buffer.from(s, "utf8").toString("base64");
}

function resolveEditionPath(productId: string, slug: string): string | null {
  if (productId !== "nevedelE") return null;
  return `apps/nevedelE/data/editions/${slug}.json`;
}

export async function POST(req: Request) {
  const token = process.env.ADMIN_TOKEN ?? "";
  const provided = getHeader(req, "x-admin-token");

  if (!token || provided !== token) {
    return json(401, { ok: false, error: { status: 401, message: "unauthorized" } });
  }

  const body = await readJson(req);
  if (!body || typeof body !== "object") {
    return json(400, { ok: false, error: { status: 400, message: "invalid-json-body" } });
  }

  const productId = String(body.productId ?? "");
  if (!isProductId(productId)) {
    return json(400, { ok: false, error: { status: 400, message: "invalid-productId" } });
  }

  const editionRaw = body.edition;
  let edition: any = editionRaw;

  if (typeof editionRaw === "string") {
    try { edition = JSON.parse(editionRaw); } catch {
      return json(400, { ok: false, error: { status: 400, message: "edition-string-not-json" } });
    }
  }

  if (!edition || typeof edition !== "object") {
    return json(400, { ok: false, error: { status: 400, message: "invalid-edition" } });
  }

  const slug = String(edition.slug ?? "");
  if (!isSlug(slug)) {
    return json(400, { ok: false, error: { status: 400, message: "invalid-slug" } });
  }

  const filePath = resolveEditionPath(productId, slug);
  if (!filePath) {
    return json(400, { ok: false, error: { status: 400, message: `unsupported-product:${productId}` } });
  }

  const ghToken = process.env.GITHUB_TOKEN ?? "";
  const repo = process.env.GITHUB_REPO ?? "petosvercic/cs";
  const base = process.env.GITHUB_BASE_BRANCH ?? "main";

  if (!ghToken) {
    return json(500, { ok: false, error: { status: 500, message: "missing-github-token" } });
  }

  const apiBase = "https://api.github.com";
  const branch = `admin/publish-${productId}-${slug}-${Date.now()}`;

  // 1) get base sha
  const refBase = await gh(apiBase, ghToken, `/repos/${repo}/git/ref/heads/${base}`);
  if (!refBase.ok) {
    return json(502, { ok: false, error: { status: 502, message: `github-base-ref-failed:${refBase.status}`, details: refBase.text } });
  }
  const baseSha = refBase.data?.object?.sha;
  if (!baseSha) {
    return json(502, { ok: false, error: { status: 502, message: "github-base-sha-missing" } });
  }

  // 2) create branch
  const createRef = await gh(apiBase, ghToken, `/repos/${repo}/git/refs`, {
    method: "POST",
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: baseSha }),
  });
  if (!createRef.ok) {
    return json(502, { ok: false, error: { status: 502, message: `github-create-branch-failed:${createRef.status}`, details: createRef.text } });
  }

  // 3) check if file exists (to get sha)
  const getFile = await gh(apiBase, ghToken, `/repos/${repo}/contents/${encodeURIComponent(filePath)}?ref=${encodeURIComponent(branch)}`, {
    method: "GET",
  });
  const existingSha = getFile.ok ? getFile.data?.sha : undefined;

  // 4) put file
  const pretty = JSON.stringify(edition, null, 2) + "\n";
  const putFile = await gh(apiBase, ghToken, `/repos/${repo}/contents/${encodeURIComponent(filePath)}`, {
    method: "PUT",
    body: JSON.stringify({
      message: `nevedelE: add edition ${slug}`,
      content: toBase64Utf8(pretty),
      branch,
      sha: existingSha,
    }),
  });

  if (!putFile.ok) {
    return json(502, { ok: false, error: { status: 502, message: `github-put-file-failed:${putFile.status}`, details: putFile.text } });
  }

  // 5) open PR
  const prRes = await gh(apiBase, ghToken, `/repos/${repo}/pulls`, {
    method: "POST",
    body: JSON.stringify({
      title: `nevedelE: publish edition ${slug}`,
      head: branch,
      base,
      body: `Automated PR from cs-admin for product ${productId}.\n\nFile: ${filePath}`,
    }),
  });

  if (!prRes.ok) {
    return json(502, { ok: false, error: { status: 502, message: `github-pr-failed:${prRes.status}`, details: prRes.text } });
  }

  return json(200, { ok: true, prUrl: prRes.data?.html_url, branch, path: filePath });
}

export async function GET() {
  return json(405, { ok: false, error: { status: 405, message: "method-not-allowed" } });
}