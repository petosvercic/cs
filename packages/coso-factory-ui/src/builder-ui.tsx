"use client";

import { useMemo, useState } from "react";
import {
  ALLOWLIST_TOKENS,
  type CopyPayload,
  type EditionPackDocument,
  validateCopyPayloadJson,
  validateEditionPackJson,
} from "../../../apps/nevedelE/lib/edition-pack";
import type { EditionIndexEntry } from "./types";

const SKELETON_CATEGORY_IDS = ["cat-1", "cat-2", "cat-3", "cat-4", "cat-5"] as const;
const FIXED_UNLOCK_CTA = "Odomknúť";
const ITEMS_PER_CATEGORY = 9;

const PROMPT_TEMPLATE = `You are a copywriting assistant. Output ONLY valid JSON (no markdown).
Return a JSON object with this EXACT shape and NO extra keys:

{
  "heroTitle": "string",
  "heroSubtitle": "string",
  "categories": [
    {
      "title": "string",
      "intro": "string",
      "lockedIntro": "string",
      "items": [
        { "title": "string", "template": "string" }
      ]
    }
  ]
}

Rules:
- Language: Slovak.
- This is NOT a horoscope. Do not create “life advice” categories like work/relationships/money/health as a theme. Keep categories abstract/neutral.
- Do NOT include user data placeholders like {name}, {age}, {day}, {month}, {year}.
- Each item.template must be a single sentence and must contain 1–3 placeholders in curly braces.
- Allowed placeholders ONLY from this allowlist:
{{ALLOWLIST_TOKENS}}
- No other placeholders allowed.
- heroTitle max 6 words.
- heroSubtitle max 140 characters.
- intro max 240 characters.
- lockedIntro max 160 characters.
- Exactly 5 categories.
- Each category must include 9 items.

Return ONLY the JSON object.`;

function buildPrompt() {
  return PROMPT_TEMPLATE.replace("{{ALLOWLIST_TOKENS}}", ALLOWLIST_TOKENS.join(", "));
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function buildEditionFromCopy(slug: string, title: string, copy: CopyPayload): EditionPackDocument {
  return {
    slug,
    title,
    pack: {
      uiCopy: {
        heroTitle: copy.heroTitle,
        heroSubtitle: copy.heroSubtitle,
        unlockCta: FIXED_UNLOCK_CTA,
      },
      categories: SKELETON_CATEGORY_IDS.map((catId, catIdx) => {
        const fromCopy = copy.categories[catIdx];
        const normalizedItems = fromCopy.items.slice(0, ITEMS_PER_CATEGORY).map((item, itemIdx) => ({
          id: `item-${catIdx + 1}-${itemIdx + 1}`,
          title: item.title,
          template: item.template,
        }));

        return {
          id: catId,
          title: fromCopy.title,
          intro: fromCopy.intro,
          lockedIntro: fromCopy.lockedIntro,
          items: normalizedItems,
        };
      }),
    },
  };
}

export function FactoryBuilder({ editions }: { editions: EditionIndexEntry[] }) {
  const existingSlugs = useMemo(() => editions.map((e) => e.slug), [editions]);
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState(buildPrompt());
  const [copyPayloadJson, setCopyPayloadJson] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [previewJson, setPreviewJson] = useState("");
  const [status, setStatus] = useState("");

  function onGeneratePrompt() {
    setPrompt(buildPrompt());
  }

  function onValidateAndPreview() {
    const nextErrors: string[] = [];
    const normalizedSlug = slugify(slug || title);
    if (!normalizedSlug) nextErrors.push("Slug is required (or inferable from title).");
    if (!title.trim()) nextErrors.push("Title is required.");

    const payload = validateCopyPayloadJson(copyPayloadJson);
    if ("errors" in payload) nextErrors.push(...payload.errors);

    if ("errors" in payload || nextErrors.length > 0) {
      setErrors(nextErrors);
      setPreviewJson("");
      return;
    }

    const edition = buildEditionFromCopy(normalizedSlug, title.trim(), payload.data);
    const validatedEdition = validateEditionPackJson(edition, existingSlugs);
    if ("errors" in validatedEdition) {
      setErrors(validatedEdition.errors);
      setPreviewJson("");
      return;
    }

    setErrors([]);
    setPreviewJson(JSON.stringify(validatedEdition.data, null, 2));
  }

  async function onDispatch() {
    if (!previewJson) {
      setStatus("Preview first (Validate & Build). ");
      return;
    }

    const res = await fetch("/api/factory/dispatch", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ rawEditionJson: previewJson }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      setStatus(`Dispatch failed: ${data?.error ?? res.status}`);
      return;
    }

    setStatus(String(data?.message || `OK (${data?.slug})`));
  }

  return (
    <main className="min-h-screen px-4 py-10 text-neutral-100" style={{ backgroundImage: "url(/brand/bg.png)", backgroundSize: "cover" }}>
      <div className="mx-auto w-full max-w-5xl rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6">
        <h1 className="text-3xl font-semibold">Factory Builder</h1>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Edition title" className="rounded border border-neutral-700 bg-neutral-950/80 p-2 text-sm" />
          <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="edition-slug (optional, auto from title)" className="rounded border border-neutral-700 bg-neutral-950/80 p-2 text-sm" />
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={onGeneratePrompt} className="rounded bg-neutral-100 px-3 py-2 text-sm font-semibold text-neutral-950">Generate prompt</button>
        </div>
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={16} className="mt-3 w-full rounded border border-neutral-700 bg-neutral-950/80 p-3 font-mono text-sm" />

        <h2 className="mt-6 text-lg font-semibold">Paste LLM copy payload JSON</h2>
        <textarea value={copyPayloadJson} onChange={(e) => setCopyPayloadJson(e.target.value)} rows={14} className="mt-2 w-full rounded border border-neutral-700 bg-neutral-950/80 p-3 font-mono text-sm" />

        <div className="mt-3 flex gap-3">
          <button onClick={onValidateAndPreview} className="rounded bg-neutral-100 px-3 py-2 text-sm font-semibold text-neutral-950">Validate & Build</button>
          <button onClick={onDispatch} className="rounded bg-emerald-300 px-3 py-2 text-sm font-semibold text-emerald-950" disabled={!previewJson}>Dispatch / Publish</button>
        </div>

        {errors.length > 0 ? (
          <ul className="mt-4 list-disc rounded border border-red-500/60 bg-red-950/30 p-4 pl-8 text-sm text-red-200">
            {errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        ) : null}

        {previewJson ? (
          <>
            <h3 className="mt-6 text-lg font-semibold">Final EditionPackDocument preview</h3>
            <textarea value={previewJson} readOnly rows={16} className="mt-2 w-full rounded border border-neutral-700 bg-neutral-950/80 p-3 font-mono text-sm" />
          </>
        ) : null}

        {status ? <p className="mt-4 text-sm text-neutral-200">{status}</p> : null}
      </div>
    </main>
  );
}

export default FactoryBuilder;
