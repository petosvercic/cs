import fs from "node:fs";
import path from "node:path";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const idxPath = path.join("apps", "nevedelE", "data", "editions.json");

const idx = JSON.parse(fs.readFileSync(idxPath, "utf8").replace(/^\uFEFF/, ""));
const editions = Array.isArray(idx?.editions) ? idx.editions : [];

if (editions.length === 0) {
  console.log("No editions found; smoke skipped.");
  process.exit(0);
}

for (const e of editions) {
  const slug = String(e.slug || "").trim();
  if (!slug) throw new Error("Edition without slug in editions.json");

  const res = await fetch(`${baseUrl}/e/${slug}`);
  if (!res.ok) {
    throw new Error(`Route /e/${slug} failed with ${res.status}`);
  }

  const body = await res.text();
  if (body.includes("Edícia") && body.includes("neexistuje")) {
    throw new Error(`Route /e/${slug} rendered 404 content`);
  }

  console.log(`OK /e/${slug}`);
}
