"use client";

import { useMemo, useState } from "react";
import EditionClient from "../e/[slug]/ui";
import { validateEditionJson } from "../../lib/edition-json";

type EditionIndexEntry = { slug: string; title: string; createdAt?: string };

type BuilderUiProps = {
  initialEditions: EditionIndexEntry[];
};

const FIXED_PROMPT_TEMPLATE = [
  "ROLE: Generate exactly one valid COSO edition JSON object.",
  "",
  "OUTPUT RULES:",
  "- Return only ONE JSON object.",
  "- No markdown/code fences/comments/explanations.",
  "- Strict JSON with double quotes.",
  "",
  "SCHEMA RULES:",
  "- Required keys: slug, title, engine, content.",
  "- slug must be lowercase-hyphen, 3-64 chars.",
  "- engine.locale must be 'sk'.",
  "- content must contain real non-empty strings.",
  "",
  "EXISTING SLUGS (DO NOT USE):"
].join("\n");

function isSlugValid(slug: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length >= 3 && slug.length <= 64;
}

function formatPrompt(existingSlugs: string[]) {
  const list = existingSlugs.length ? existingSlugs.join(", ") : "(none)";
  return `${FIXED_PROMPT_TEMPLATE} ${list}`;
}

export default function BuilderUi({ initialEditions }: BuilderUiProps) {
  const [editions, setEditions] = useState<EditionIndexEntry[]>(initialEditions);
  const [existingSlugs, setExistingSlugs] = useState<string[]>(initialEditions.map((item) => item.slug));
  const [jsonInput, setJsonInput] = useState("");
  const [previewEdition, setPreviewEdition] = useState<any | null>(null);
  const [status, setStatus] = useState<{ kind: "idle" | "ok" | "err"; msg: string }>({ kind: "idle", msg: "" });
  const [publishBusy, setPublishBusy] = useState(false);

  const prompt = useMemo(() => formatPrompt(existingSlugs), [existingSlugs]);

  async function refreshSlugs() {
    setStatus({ kind: "idle", msg: "Refreshing slugs..." });

    try {
      const response = await fetch("/api/editions/slugs", { cache: "no-store" });
      const json = await response.json().catch(() => null);

      if (!response.ok || !json?.ok || !Array.isArray(json?.editions)) {
        setStatus({ kind: "err", msg: `Refresh failed: ${json?.error ?? response.status}` });
        return false;
      }

      const nextEditions: EditionIndexEntry[] = json.editions;
      setEditions(nextEditions);
      setExistingSlugs(nextEditions.map((item) => item.slug));
      setStatus({ kind: "ok", msg: `Refresh OK (${nextEditions.length} slugs).` });
      return true;
    } catch (error: any) {
      setStatus({ kind: "err", msg: String(error?.message ?? "Refresh failed") });
      return false;
    }
  }

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt);
      setStatus({ kind: "ok", msg: "Prompt copied." });
    } catch {
      setStatus({ kind: "err", msg: "Copy failed." });
    }
  }

  function validateInput() {
    const trimmed = jsonInput.trim();
    if (!trimmed) {
      setStatus({ kind: "err", msg: "Input JSON is empty." });
      return null;
    }

    const parsed = validateEditionJson(trimmed, existingSlugs);
    if (!parsed.ok) {
      setStatus({ kind: "err", msg: `Validation failed: ${parsed.error}${parsed.details ? ` (${parsed.details})` : ""}` });
      return null;
    }

    const slug = parsed.obj.slug.trim();
    if (!isSlugValid(slug)) {
      setStatus({ kind: "err", msg: "Validation failed: BAD_SLUG_FORMAT" });
      return null;
    }

    setPreviewEdition(parsed.obj);
    setStatus({ kind: "ok", msg: `Validation OK for slug '${slug}'.` });
    return parsed.obj;
  }

  async function publishEdition() {
    const edition = validateInput();
    if (!edition) return;

    setPublishBusy(true);
    setStatus({ kind: "idle", msg: "Publishing..." });

    try {
      const response = await fetch("/api/factory/dispatch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ edition, rawEditionJson: jsonInput })
      });

      const json = await response.json().catch(() => null);
      if (!response.ok || !json?.ok) {
        setStatus({ kind: "err", msg: `Publish failed: ${json?.error ?? response.status} ${json?.message ?? ""}`.trim() });
        return;
      }

      const publishedSlug = String(json?.slug ?? edition.slug);
      const publishedTitle = String(edition.title ?? publishedSlug);
      setStatus({ kind: "ok", msg: `Publish OK: ${publishedSlug}` });

      const refreshed = await refreshSlugs();
      if (!refreshed) {
        setEditions((prev) => {
          if (prev.some((item) => item.slug === publishedSlug)) return prev;
          return [{ slug: publishedSlug, title: publishedTitle }, ...prev];
        });
        setExistingSlugs((prev) => (prev.includes(publishedSlug) ? prev : [publishedSlug, ...prev]));
        setStatus({ kind: "ok", msg: `Publish OK: ${publishedSlug} (optimistic refresh).` });
      }
    } catch (error: any) {
      setStatus({ kind: "err", msg: String(error?.message ?? "Publish failed") });
    } finally {
      setPublishBusy(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-10 text-neutral-100">
      <div className="mx-auto w-full max-w-6xl rounded-3xl border border-neutral-800 bg-neutral-950/80 p-6 shadow-2xl">
        <h1 className="text-3xl font-semibold">Builder (manual workflow)</h1>

        <section className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">1) Existing slugs + Prompt</h2>
            <button className="rounded-lg bg-neutral-100 px-3 py-2 text-sm font-semibold text-neutral-950" onClick={refreshSlugs}>
              Refresh existing slugs
            </button>
          </div>

          <p className="mb-2 text-sm text-neutral-300">Source of truth: <code>apps/nevedelE/data/editions.json</code></p>
          <textarea readOnly value={prompt} rows={10} className="w-full rounded-xl border border-neutral-700 bg-neutral-950/80 p-3 font-mono text-xs" />
          <div className="mt-3 flex flex-wrap gap-3">
            <button className="rounded-lg bg-neutral-100 px-3 py-2 text-sm font-semibold text-neutral-950" onClick={copyPrompt}>
              Copy prompt
            </button>
            <span className="text-xs text-neutral-400">Slugs loaded: {editions.length}</span>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4">
          <h2 className="text-lg font-semibold">2) Paste / Import JSON</h2>
          <p className="mt-1 text-sm text-neutral-300">Paste exactly one JSON object (no markdown).</p>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            rows={14}
            className="mt-3 w-full rounded-xl border border-neutral-700 bg-neutral-950/80 p-3 font-mono text-xs"
            placeholder='{"slug":"my-edition","title":"...","engine":{"locale":"sk"},"content":{}}'
          />
          <div className="mt-3 flex flex-wrap gap-3">
            <button className="rounded-lg bg-neutral-100 px-3 py-2 text-sm font-semibold text-neutral-950" onClick={validateInput}>
              Validate
            </button>
            <button
              className="rounded-lg bg-emerald-300 px-3 py-2 text-sm font-semibold text-emerald-950 disabled:opacity-50"
              onClick={publishEdition}
              disabled={publishBusy}
            >
              {publishBusy ? "Publishing..." : "Publish"}
            </button>
          </div>
        </section>

        {status.msg ? (
          <p
            className={`mt-4 rounded-xl border p-3 text-sm ${
              status.kind === "err"
                ? "border-red-500 bg-red-950/40 text-red-200"
                : status.kind === "ok"
                  ? "border-emerald-500 bg-emerald-950/30 text-emerald-200"
                  : "border-neutral-700 bg-neutral-900/70 text-neutral-200"
            }`}
          >
            {status.msg}
          </p>
        ) : null}

        {previewEdition ? (
          <section className="mt-6">
            <h2 className="mb-2 text-lg font-semibold">3) Preview (no paywall gating)</h2>
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-2">
              <EditionClient slug={previewEdition.slug} edition={previewEdition} previewMode />
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
