const fs = require("fs");
const path = require("path");

function readUtf8(p) {
  return fs.readFileSync(p, "utf8");
}

function writeUtf8NoBom(p, s) {
  // Node píše UTF-8 bez BOM defaultne
  fs.writeFileSync(p, s, "utf8");
}

function stripNonAscii(s) {
  // necháme whitespace + bežné ASCII; všetko ostatné preč (toto zabije ďž…/�/mojibake)
  return s.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "");
}

function replaceOrThrow(s, re, repl, label) {
  const out = s.replace(re, repl);
  if (out === s) {
    throw new Error("Patch failed (no change): " + label);
  }
  return out;
}

function replaceIfPresent(s, re, repl) {
  const out = s.replace(re, repl);
  return out;
}

// -------- ui.tsx fix --------
const uiPath = path.join("apps","nevedelE","app","builder","ui.tsx");
let ui = readUtf8(uiPath);

// Najprv zahoď všetko ne-ASCII (zabije rozbité tokeny v stringoch)
ui = stripNonAscii(ui);

// 1) buildPrompt: definujeme stabilnú ASCII verziu, ktorá berie string[] slugs
ui = replaceOrThrow(
  ui,
  /function\s+buildPrompt\s*\([\s\S]*?\)\s*\{\s*[\s\S]*?\]\.join\("\\n"\);\s*\}\s*/m,
  [
    'function buildPrompt(existingSlugs: string[]) {',
    '  const deployed = existingSlugs.map((s) => `- ${s}`).join("\\n");',
    '',
    '  return [',
    '    "ROLE: You are a content generator for COSO editions (task-based, paywall).",',
    '    "",',
    '    "GOAL:",',
    '    "- Generate a NEW edition for the same web-app template.",',
    '    "- It must be unique (no copies).",',
    '    "",',
    '    "OUTPUT:",',
    '    "Return exactly 1 JSON object (no markdown).",',
    '    "Schema (must match):",',
    '    "{",',
    '    \'  "slug": "lowercase-hyphen-slug (3-64 chars, unique)",\',',
    '    \'  "title": "Human readable edition title",\',',
    '    \'  "engine": { "subject": "snake_case_subject", "locale": "sk" },\',',
    '    \'  "content": {\',',
    '    \'    "heroTitle": "...",\',',
    '    \'    "heroSubtitle": "...",\',',
    '    \'    "intro": { "title": "...", "text": "..." },\',',
    '    \'    "form": { "title": "...", "nameLabel": "...", "birthDateLabel": "...", "submitLabel": "..." },\',',
    '    \'    "result": { "teaserTitle": "...", "teaserNote": "...", "unlockHint": "..." },\',',
    '    \'    "paywall": { "headline": "...", "bullets": ["..."], "cta": "..." }\',',
    '    \'  },\',',
    '    \'  "tasks": {\',',
    '    \'    "pickPerCategory": 25,\',',
    '    \'    "categories": [ ... 5 categories, each exactly 50 tasks ... ]\',',
    '    \'  }\',',
    '    "}",',
    '    "",',
    '    "Already deployed editions:",',
    '    deployed,',
    '  ].join("\\n");',
    '}',
    '',
  ].join("\n"),
  "ui.tsx buildPrompt"
);

// 2) v BuilderClient chceme existingSlugs + basePrompt postavený z existingSlugs
ui = replaceOrThrow(
  ui,
  /const\s+\[existingSlugs,\s*setExistingSlugs\]\s*=\s*useState<\s*string\[\]\s*>\s*\([\s\S]*?\);\s*/m,
  '  const [existingSlugs, setExistingSlugs] = useState<string[]>(editions.map((e) => e.slug));\n',
  "ui.tsx existingSlugs state"
);

ui = replaceOrThrow(
  ui,
  /const\s+basePrompt\s*=\s*useMemo\s*\(\s*\(\)\s*=>\s*buildPrompt\([\s\S]*?\)\s*,\s*\[[\s\S]*?\]\s*\)\s*;\s*/m,
  '  const basePrompt = useMemo(() => buildPrompt(existingSlugs), [existingSlugs]);\n',
  "ui.tsx basePrompt useMemo"
);

// 3) onCopyPrompt a onRefreshSlugs prepíšeme na čisté ASCII hlášky (a správne uzatvorkované)
ui = replaceOrThrow(
  ui,
  /async\s+function\s+onCopyPrompt\(\)\s*\{[\s\S]*?\n\s*\}\s*/m,
  [
    "  async function onCopyPrompt() {",
    "    try {",
    "      await navigator.clipboard.writeText(prompt);",
    '      setStatus({ kind: "ok", msg: "Prompt copied." });',
    "    } catch {",
    '      setStatus({ kind: "err", msg: "Copy failed." });',
    "    }",
    "  }",
    "",
  ].join("\n"),
  "ui.tsx onCopyPrompt"
);

ui = replaceOrThrow(
  ui,
  /async\s+function\s+onRefreshSlugs\(\)\s*\{[\s\S]*?\n\s*\}\s*/m,
  [
    "  async function onRefreshSlugs() {",
    '    setStatus({ kind: "idle", msg: "Refreshing slugs from GitHub..." });',
    "    try {",
    '      const res = await fetch("/api/editions/slugs", { cache: "no-store" as any });',
    "      const data = await res.json().catch(() => null);",
    "      if (!res.ok || !data?.ok || !Array.isArray(data?.slugs)) {",
    '        setStatus({ kind: "err", msg: `Refresh failed: ${data?.error ?? res.status}`.trim() });',
    "        return;",
    "      }",
    "      const slugs = data.slugs.map((x: any) => String(x)).filter(Boolean);",
    "      setExistingSlugs(slugs);",
    "      setPrompt(buildPrompt(slugs));",
    '      setStatus({ kind: "ok", msg: `Refresh OK. Slugs loaded: ${slugs.length}` });',
    "    } catch (e: any) {",
    '      setStatus({ kind: "err", msg: `Refresh failed: ${String(e?.message ?? e)}` });',
    "    }",
    "  }",
    "",
  ].join("\n"),
  "ui.tsx onRefreshSlugs"
);

// 4) posledná poistka: vyhoď znovu ne-ASCII (keby regex nechal bordel)
ui = stripNonAscii(ui);

writeUtf8NoBom(uiPath, ui);

// -------- dispatch route fix --------
const dispatchPath = path.join("apps","nevedelE","app","api","factory","dispatch","route.ts");
let d = readUtf8(dispatchPath);
d = stripNonAscii(d);

// odstráň alias import ak existuje
d = replaceIfPresent(
  d,
  /^\s*import\s+\{\s*persistEditionLocally\s*\}\s+from\s+"@\/lib\/editions-store"\s*;\s*\r?\n/m,
  ""
);

// ak ešte existuje persistEditionLocally(edition); -> nahraď blokom pre GitHub persist
if (d.match(/persistEditionLocally\s*\(\s*edition\s*\)\s*;/)) {
  d = d.replace(
    /^\s*(?:await\s+)?persistEditionLocally\(\s*edition\s*\)\s*;\s*$/m,
    [
      '      const token = (process.env.GITHUB_TOKEN || "").trim();',
      '      if (!token) throw new Error("Missing GITHUB_TOKEN");',
      "      const { owner, repo } = resolveRepoParts();",
      '      const ref = (process.env.GITHUB_REF || "main").trim();',
      "      await persistEditionInGithub({ owner, repo, token, ref, edition });",
    ].join("\n")
  );
}

d = stripNonAscii(d);
writeUtf8NoBom(dispatchPath, d);

console.log("OK: ui.tsx + dispatch route sanitized and rebuilt blocks.");
