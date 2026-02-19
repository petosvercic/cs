"use client";

import { useMemo, useState } from "react";
import { parseEditionPackDocument } from "../../../apps/nevedelE/lib/edition-pack";
import type { EditionIndexEntry } from "./types";

const BASE_PROMPT = `You are generating a single JSON document called EditionPackDocument.
It will be committed into the repository at:
- apps/nevedelE/data/editions/<slug>.json

This JSON MUST match the schema below EXACTLY. Do not add extra keys.
Do not include markdown. Output ONLY valid JSON.

SCHEMA (EditionPackDocument):
{
  "slug": string,                 // kebab-case, 3-64 chars, lowercase letters/numbers/hyphens
  "title": string,                // human readable title, non-empty
  "pack": {
    "uiCopy": {
      "heroTitle": string,        // main headline (short, strong)
      "heroSubtitle": string,     // supportive line (1 sentence)
      "unlockCta": string         // CTA button label (2-4 words)
    },
    "theme": {
      "backgroundImageUrl": string,          // optional, either "/backgrounds/<file>" or absolute URL
      "backgroundOverlay": "none" | "soft" | "strong"
    },
    "categories": [
      {
        "id": string,             // kebab-case identifier (e.g. "work", "love", "health"...)
        "title": string,          // category title shown in UI
        "intro": string,          // 1-2 sentences shown before unlocked results
        "lockedIntro": string,    // 1 sentence shown when locked
        "items": [
          {
            "id": string,         // kebab-case identifier unique within category
            "title": string,      // short label shown as row title
            "template": string    // template string with placeholders
          }
        ]
      }
    ]
  }
}

TEMPLATE RULES
- Each category MUST have at least 5 items (recommended 8-12).
- Each item.template MUST be a single sentence and MUST use placeholders in curly braces.
- Allowed placeholders: {name}, {birthYear}, {age}, {day}, {month}, {year}.
- Each template should produce a believable personalized line when placeholders are replaced.
- Do NOT use any other placeholder names.
- Do NOT include profanity, hate, sexual content, or medical diagnoses. Keep it playful but safe.

STYLE RULES
- Language: Slovak.
- Tone: witty, slightly mysterious, not cringe, not spiritual cultish.
- heroTitle: max 7 words.
- heroSubtitle: max 140 characters.
- intros: max 240 characters each.
- unlockCta: 2-4 words, action oriented.

LEGACY BAN (IMPORTANT)
- DO NOT output keys like: "engine", "tasks", "pickPerCategory", "variants", "result", "paywall".
- If you include any banned keys, the JSON will be rejected.

OUTPUT
Return ONLY the JSON document.`;

function withExistingSlugs(existingSlugs: string[]) {
  if (!existingSlugs.length) return BASE_PROMPT;
  return `${BASE_PROMPT}\n\nAlready used slugs:\n${existingSlugs.map((s) => `- ${s}`).join("\n")}`;
}

export function FactoryBuilder({ editions }: { editions: EditionIndexEntry[] }) {
  const existingSlugs = useMemo(() => editions.map((e) => e.slug), [editions]);
  const [prompt, setPrompt] = useState(withExistingSlugs(existingSlugs));
  const [editionJson, setEditionJson] = useState("");
  const [backgroundImageUrl, setBackgroundImageUrl] = useState("");
  const [backgroundOverlay, setBackgroundOverlay] = useState<"none" | "soft" | "strong">("soft");
  const [status, setStatus] = useState("");

  async function onDispatch() {
    let candidate = editionJson.trim();
    if (!candidate) return;

    try {
      const obj = JSON.parse(candidate);
      if (backgroundImageUrl.trim()) {
        obj.pack = obj.pack || {};
        obj.pack.theme = obj.pack.theme || {};
        obj.pack.theme.backgroundImageUrl = backgroundImageUrl.trim();
        obj.pack.theme.backgroundOverlay = backgroundOverlay;
        candidate = JSON.stringify(obj, null, 2);
      }
    } catch {
      setStatus("Invalid JSON");
      return;
    }

    const parsed = parseEditionPackDocument(candidate);
    if ("error" in parsed) {
      setStatus(`Invalid JSON: ${parsed.error}${parsed.details ? ` (${parsed.details})` : ""}`);
      return;
    }

    const res = await fetch("/api/factory/dispatch", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ edition: parsed.data, rawEditionJson: candidate }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      setStatus(`Dispatch failed: ${data?.error ?? res.status}`);
      return;
    }
    setStatus(String(data?.message || `OK (${data?.slug})`));
    setEditionJson("");
  }

  return (
    <main className="min-h-screen px-4 py-10 text-neutral-100" style={{ backgroundImage: "url(/brand/bg.png)", backgroundSize: "cover" }}>
      <div className="mx-auto w-full max-w-4xl rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6">
        <h1 className="text-3xl font-semibold">Factory Builder</h1>
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={16} className="mt-4 w-full rounded border border-neutral-700 bg-neutral-950/80 p-3 font-mono text-sm" />

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input value={backgroundImageUrl} onChange={(e) => setBackgroundImageUrl(e.target.value)} placeholder="/backgrounds/my-bg.jpg or https://..." className="rounded border border-neutral-700 bg-neutral-950/80 p-2 text-sm" />
          <select value={backgroundOverlay} onChange={(e) => setBackgroundOverlay(e.target.value as any)} className="rounded border border-neutral-700 bg-neutral-950/80 p-2 text-sm">
            <option value="none">Overlay: none</option>
            <option value="soft">Overlay: soft</option>
            <option value="strong">Overlay: strong</option>
          </select>
        </div>

        <textarea value={editionJson} onChange={(e) => setEditionJson(e.target.value)} rows={14} className="mt-4 w-full rounded border border-neutral-700 bg-neutral-950/80 p-3 font-mono text-sm" placeholder="Paste EditionPackDocument JSON" />
        <button onClick={onDispatch} className="mt-3 rounded bg-emerald-300 px-3 py-2 text-sm font-semibold text-emerald-950">Dispatch build</button>
        {status ? <p className="mt-3 text-sm text-neutral-200">{status}</p> : null}
      </div>
    </main>
  );
}

export default FactoryBuilder;
