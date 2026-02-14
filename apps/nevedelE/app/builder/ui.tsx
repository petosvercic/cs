"use client";
import { useMemo, useState } from "react";
import { normalizeEditionJsonForBuilder, normalizeEditionJsonRaw, validateEditionJson } from "../../lib/edition-json";
 
type EditionIndexEntry = { slug: string; title: string; createdAt?: string };

function buildPrompt(existingSlugs: string[]) {
  const deployed = existingSlugs.map((s) => `- ${s}`).join("\n");

  // Canonical universal production prompt (ASCII-only).
  // Only dynamic part is the deployed slugs list appended at the end.
  const base = [
    "ROLE: You generate COSO edition JSON for a deployed Next.js app.",
    "",
    "YOU MUST RETURN:",
    "- Exactly ONE JSON object.",
    "- No markdown, no code fences, no comments, no explanations, no trailing text.",
    "- Output must be strict JSON (double quotes only, no trailing commas).",
    "",
    "GOAL:",
    "- Invent a NEW coherent edition concept by yourself (theme, title, tasks) that fits the product.",
    "- Make it safe, practical, and usable as a daily/self-reflection tool.",
    "",
    "PRODUCT CONTEXT:",
    "- Each edition is a page at /e/<slug>.",
    "- User enters optional name and birthDate (YYYY-MM-DD).",
    "- Engine computes result from engine.subject + inputs.",
    "- Without payment show only teaser; full result behind paywall (Stripe).",
    "",
    "HARD REQUIREMENTS (MUST PASS):",
    "1) slug:",
    "- lowercase-hyphen, 3-64 chars",
    "- MUST be unique and MUST NOT be in the deployed list provided below",
    "",
    "2) engine.locale:",
    '- must be "sk"',
    "",
    "3) engine.subject:",
    "- snake_case, 3-40 chars",
    "- should match the theme (unique per edition idea)",
    "",
    "4) content:",
    '- ALL fields must be filled with real text (NO "..." placeholders anywhere)',
    "- language: Slovak preferred BUT ASCII ONLY (no diacritics) to avoid encoding issues",
    "",
    "5) tasks:",
    "- pickPerCategory must be 25",
    "- categories must be EXACTLY 5 items",
    "- each category.tasks must be EXACTLY 50 strings",
    "- every task string must be non-empty, actionable, and unique within its category",
    "- avoid duplicates across categories if possible",
    "",
    "SAFETY:",
    "- No medical diagnosis, no therapy claims, no hate, no violence, no illegal instructions.",
    "- Keep it reflective/productive: habits, focus, communication, planning, creativity, boundaries, self-awareness.",
    "",
    "QUALITY RULES:",
    "- Make the edition concept coherent: title + hero + intro + tasks must match one clear theme.",
    "- Paywall bullets must describe what user unlocks (more depth, breakdowns, personalized output).",
    "- Teaser should be meaningful but incomplete.",
    "",
    "JSON SCHEMA (MUST MATCH EXACTLY THESE KEYS):",
    "{",
    '  "slug": "...",',
    '  "title": "...",',
    '  "engine": { "subject": "...", "locale": "sk" },',
    '  "content": {',
    '    "heroTitle": "...",',
    '    "heroSubtitle": "...",',
    '    "intro": { "title": "...", "text": "..." },',
    '    "form": { "title": "...", "nameLabel": "...", "birthDateLabel": "...", "submitLabel": "..." },',
    '    "result": { "teaserTitle": "...", "teaserNote": "...", "unlockHint": "..." },',
    '    "paywall": { "headline": "...", "bullets": ["...", "...", "...", "..."], "cta": "..." }',
    "  },",
    '  "tasks": {',
    '    "pickPerCategory": 25,',
    '    "categories": [',
    '      { "title": "...", "tasks": [50 strings] },',
    '      { "title": "...", "tasks": [50 strings] },',
    '      { "title": "...", "tasks": [50 strings] },',
    '      { "title": "...", "tasks": [50 strings] },',
    '      { "title": "...", "tasks": [50 strings] }',
    "    ]",
    "  }",
    "}",
    "",
    "FINAL SELF-CHECK (DO THIS SILENTLY BEFORE OUTPUT):",
    "- Is slug unique vs deployed list?",
    "- Are there exactly 5 categories?",
    "- Does each category have exactly 50 tasks?",
    "- pickPerCategory is 25?",
    '- No "..." anywhere?',
    "- Strict JSON only?",
    "",
    "Already deployed editions (MUST AVOID):",
    deployed || "- (none)",
  ].join("\n");

  return base;
}
export default function BuilderClient({ editions }: { editions: EditionIndexEntry[] }) {
   const [existingSlugs, setExistingSlugs] = useState<string[]>(editions.map((e) => e.slug));
  const basePrompt = useMemo(() => buildPrompt(existingSlugs), [existingSlugs]);
const [prompt, setPrompt] = useState(basePrompt);
 const [editionJson, setEditionJson] = useState("");
 const [status, setStatus] = useState<{ kind: "idle" | "ok" | "err"; msg: string }>({ kind: "idle", msg: "" });
      async function onCopyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt);
      setStatus({ kind: "ok", msg: "Prompt copied." });
    } catch (e) {
      setStatus({ kind: "err", msg: "Copy failed." });
    }
  }

  async function onRefreshSlugs() {
    setStatus({ kind: "idle", msg: "Starting factory workflow..." });
    try {
      const res = await fetch("/api/editions/slugs", { cache: "no-store" });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok || !Array.isArray(data?.slugs)) {
        setStatus({ kind: "err", msg: `Refresh failed: ${data?.error ?? res.status}`.trim() });
        return;
      }

      const slugs = data.slugs.map((x: any) => String(x)).filter(Boolean);
      setExistingSlugs(slugs);
      setPrompt(buildPrompt(slugs));
      setStatus({ kind: "ok", msg: `Refresh OK. Slugs loaded: ${slugs.length}` });
    } catch (e) {
      setStatus({ kind: "err", msg: "Refresh failed." });
    }
  }

  async function onDispatch() {
 const v = validateEditionJson(editionJson, existingSlugs);
 if (!v.ok) {
 setStatus({ kind: "err", msg: `Neplatn , ?zA? , L? , ?a a " JSON: ${v.error}${v.details ? ` (${v.details})` : ""}; found root keys: ${((v as any)?.debug?.foundRootKeys ?? []).join(", ") || "(none)"}; first 120 chars of normalized input: ${((v as any)?.debug?.normalizedStart ?? "").replace(/\s+/g, " ")}` });
 return;
 }

 setStatus({ kind: "idle", msg: "Starting factory workflow..." });

 const res = await fetch("/api/factory/dispatch", {
 method: "POST",
 headers: { "content-type": "application/json" },
 body: JSON.stringify({ edition: v.obj, rawEditionJson: editionJson }),
 });

 const data = await res.json().catch(() => null);
 if (!res.ok || !data?.ok) {
 setStatus({ kind: "err", msg: `Dispatch zlyhal: ${data?.error ?? res.status} ${data?.message ?? ""}`.trim() });
 return;
 }

 setStatus({ kind: "ok", msg: `Workflow spusten , ?zA? , L? , ?a a ". ${data?.runUrl ? "Run: " + data.runUrl : ""}`.trim() });
 setEditionJson("");
 }

 return (
 <main className="min-h-screen bg-neutral-950 px-4 py-8 text-neutral-100">
 <div className="mx-auto w-full max-w-4xl rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-xl">
 <h1 className="text-3xl font-semibold tracking-tight">Factory Builder</h1>
 <p className="mt-2 text-sm leading-6 text-neutral-400">Prompt and list of editions (slugs) are used as input context.</p>

 <section className="mt-8 space-y-2">
 <h2 className="text-xl font-semibold">1) Prompt pre LLM</h2>
 <textarea
 value={prompt}
 onChange={(e) => setPrompt(e.target.value)}
 rows={18}
 className="w-full rounded-xl border border-neutral-700 bg-neutral-950 p-3 font-mono text-sm leading-6 outline-none focus:border-neutral-500"
 />
 <div className="mt-2 flex flex-wrap gap-3">
 <button className="rounded-lg bg-neutral-100 px-3 py-2 text-sm font-semibold text-neutral-950" onClick={onCopyPrompt}>Copy prompt</button>
 <button className="rounded-lg bg-neutral-100 px-3 py-2 text-sm font-semibold text-neutral-950" onClick={onRefreshSlugs}>Refresh</button>
 <button className="rounded-lg bg-neutral-100 px-3 py-2 text-sm font-semibold text-neutral-950" onClick={() => setPrompt(basePrompt)}>Reset prompt</button>
 <a href="/list" className="rounded-lg border border-neutral-700 px-3 py-2 text-sm text-neutral-200">View deployed editions</a>
 </div>
 </section>

 <section className="mt-8 space-y-2">
 <h2 className="text-xl font-semibold">2) Paste LLM JSON and build the edition</h2>
 <textarea
 value={editionJson}
 onChange={(e) => setEditionJson(e.target.value)}
 rows={12}
 placeholder='You can paste plain JSON, a `json ... ` block, or text that contains a JSON object.'
 className="w-full rounded-xl border border-neutral-700 bg-neutral-950 p-3 font-mono text-sm leading-6 outline-none focus:border-neutral-500"
 />
 <div className="mt-2 flex flex-wrap gap-3">
 <button
 className="rounded-lg bg-neutral-100 px-3 py-2 text-sm font-semibold text-neutral-950"
 onClick={() => {
 const v = validateEditionJson(editionJson, existingSlugs);

 setStatus(v.ok ? { kind: "ok", msg: "JSON looks valid." } : { kind: "err", msg: `Invalid JSON: ${v.error}` });

 }}
 >
 Validate
 </button>
 <button className="rounded-lg bg-emerald-300 px-3 py-2 text-sm font-semibold text-emerald-950" onClick={onDispatch}>Dispatch build</button>
 <button
 className="rounded-lg border border-neutral-700 px-3 py-2 text-sm"

 onClick={() => { const n = normalizeEditionJsonForBuilder(editionJson); setEditionJson(n); setStatus({ kind: "ok", msg: `JSON normalized (${n.length} chars). Missing title/slug/content were auto-filled.` }); }}

 >
 Normalize JSON
 </button>
 </div>

 {status.msg && (
 <p className={`mt-3 rounded-xl border p-3 text-sm ${status.kind === "err" ? "border-red-500 text-red-300" : status.kind === "ok" ? "border-green-500 text-green-300" : "border-neutral-700 text-neutral-300"}`}>
 <strong>{status.kind === "err" ? "Error" : status.kind === "ok" ? "OK" : "Info"}:</strong> {status.msg}
 </p>
 )}
 </section>
 </div>
 </main>
 );
}

