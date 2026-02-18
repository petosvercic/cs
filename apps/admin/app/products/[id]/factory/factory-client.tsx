"use client";

import { useMemo, useState } from "react";

type FactoryClientProps = { productId: string };
type LoadState = "idle" | "loading" | "ok" | "error";

export default function FactoryClient({ productId }: FactoryClientProps) {
  const [state, setState] = useState<LoadState>("idle");
  const [slugs, setSlugs] = useState<string[]>([]);
  const [message, setMessage] = useState("Not loaded.");

  async function refresh() {
    setState("loading");
    setMessage("Loading slugs...");

    try {
      const response = await fetch(`/api/products/${productId}/editions/slugs`, { cache: "no-store" });
      const text = await response.text();

      if (!response.ok) {
        setState("error");
        setMessage(`Failed (${response.status}): ${text.slice(0, 180)}`);
        return;
      }

      const json = JSON.parse(text) as { editions?: Array<{ slug?: string }> };
      const nextSlugs = Array.isArray(json?.editions)
        ? json.editions.map((item) => String(item?.slug || "")).filter(Boolean)
        : [];

      setSlugs(nextSlugs);
      setState("ok");
      setMessage(`Loaded ${nextSlugs.length} slugs.`);
    } catch (error: any) {
      setState("error");
      setMessage(String(error?.message || "Could not load slugs."));
    }
  }

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(promptText);
      setMessage("Prompt copied.");
    } catch {
      setMessage("Copy failed.");
    }
  }

  const promptText = useMemo(() => {
    const existing = slugs.length ? slugs.join(", ") : "(none)";

    return [
      "ROLE: You are a strict JSON generator for nevedelE editions.",
      "CONSTRAINTS:",
      "- Return strict JSON only, no markdown, no explanations.",
      "- slug must be lowercase-hyphen and unique.",
      "- Keep schema compatible with nevedelE edition format.",
      `EXISTING SLUGS (DO NOT USE): ${existing}`,
      "OUTPUT FORMAT (JSON ONLY):",
      "{\"slug\":\"...\",\"title\":\"...\",\"engine\":{\"subject\":\"...\",\"locale\":\"sk\"},\"content\":{...},\"tasks\":{...}}",
      "Publish instructions (manual):",
      "- Save JSON to apps/nevedelE/data/editions/<slug>.json",
      "- Update apps/nevedelE/data/editions.json index manually",
      "- Open PR with those file changes"
    ].join("\n");
  }, [slugs]);

  return (
    <div className="stack">
      <div className="row" style={{ gap: 8 }}>
        <button onClick={refresh} disabled={state === "loading"} style={{ padding: "6px 10px" }}>
          {state === "loading" ? "Refreshing..." : "Refresh"}
        </button>
        <button onClick={copyPrompt} style={{ padding: "6px 10px" }}>Copy prompt</button>
      </div>

      <div style={{ border: "1px solid #303030", padding: 10 }}>
        <strong>Status:</strong> {state} — {message}
      </div>

      <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{promptText}</pre>
    </div>
  );
}
