import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

function fail(msg) {
  console.error("FACTORY-APPEND ERROR:", msg);
  process.exit(1);
}

function normalizeJsonLike(input) {
  const cleaned = String(input)
    .replace(/^\uFEFF/, "")
    .replace(/[\uFEFF\u200B\u200C\u200D\u2060]/g, "")
    .replace(/^[\x00-\x08\x0B\x0C\x0E-\x1F]+/, "")
    .trim();

  const fence = cleaned.match(/^```(?:json)?\s*\n([\s\S]*?)\n```$/i);
  const noFence = fence ? fence[1].trim() : cleaned;

  const start = noFence.indexOf("{");
  const end = noFence.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) return noFence.slice(start, end + 1).trim();

  return noFence;
}

function resolveRawInput() {
  const gz = String(process.env.EDITION_JSON_GZIP_B64 || "").trim();
  if (gz) {
    try {
      const buf = Buffer.from(gz, "base64");
      return zlib.gunzipSync(buf).toString("utf8");
    } catch (e) {
      fail(`Failed to decode EDITION_JSON_GZIP_B64: ${String(e?.message || e)}`);
    }
  }

  const raw = process.env.EDITION_JSON;
  if (!raw) fail("Missing EDITION_JSON/EDITION_JSON_GZIP_B64 env var");
  return raw;
}

const raw0 = resolveRawInput();

const raw = normalizeJsonLike(raw0);

let edition;
try {
  edition = JSON.parse(raw);
} catch (e) {
  console.error("EDITION_JSON first 200 chars:\n", raw.slice(0, 200));
  console.error("JSON.parse error:", e?.message || String(e));
  fail("EDITION_JSON is not valid JSON");
}

if (!edition || typeof edition !== "object" || Array.isArray(edition)) fail("Edition JSON must be an object");
if (typeof edition.slug !== "string" || !edition.slug.trim()) fail("Edition JSON must include non-empty string: slug");
if (typeof edition.title !== "string" || !edition.title.trim()) fail("Edition JSON must include non-empty string: title");
if (!edition.content || typeof edition.content !== "object" || Array.isArray(edition.content)) {
  fail("Edition JSON must include object: content");
}

const slug = edition.slug.trim();
if (!/^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/.test(slug)) {
  fail(`Invalid slug "${slug}". Use lowercase letters/numbers and hyphens only, 3-64 chars, no leading/trailing hyphen.`);
}

const root = path.join("apps", "nevedelE", "data");
const idxPath = path.join(root, "editions.json");
const dir = path.join(root, "editions");

fs.mkdirSync(dir, { recursive: true });
if (!fs.existsSync(idxPath)) fail("Missing editions.json at " + idxPath);

let idx;
try {
  const idxRaw = fs.readFileSync(idxPath, "utf8").replace(/^\uFEFF/, "");
  idx = JSON.parse(idxRaw);
} catch (e) {
  fail("editions.json exists but is not valid JSON: " + (e?.message || String(e)));
}

if (!idx || typeof idx !== "object" || Array.isArray(idx)) fail("editions.json must be an object");
idx.editions ||= [];
if (!Array.isArray(idx.editions)) fail("editions.json field 'editions' must be an array");

if (idx.editions.some((e) => e && typeof e === "object" && e.slug === slug)) fail("Duplicate slug: " + slug);

const now = new Date().toISOString();
idx.editions.unshift({ slug, title: edition.title.trim(), createdAt: now });
fs.writeFileSync(idxPath, JSON.stringify(idx, null, 2) + "\n", "utf8");

const edPath = path.join(dir, `${slug}.json`);
fs.writeFileSync(edPath, JSON.stringify({ ...edition, slug, title: edition.title.trim(), createdAt: now }, null, 2) + "\n", "utf8");

console.log("OK: appended edition", slug);
console.log("Index:", idxPath);
console.log("Edition:", edPath);
