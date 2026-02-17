"use client";

import { useState } from "react";

type EditionsPanelProps = {
  baseUrl: string;
  initialSlugs: string[];
  initialError: { status: number | string; message: string } | null;
};

type FetchState = "idle" | "loading" | "ok" | "error";

export function EditionsPanel({ baseUrl, initialSlugs, initialError }: EditionsPanelProps) {
  const [slugs, setSlugs] = useState<string[]>(initialSlugs);
  const [error, setError] = useState<{ status: number | string; message: string } | null>(initialError);
  const [state, setState] = useState<FetchState>(initialError ? "error" : initialSlugs.length ? "ok" : "idle");

  async function refresh() {
    setState("loading");
    setError(null);

    try {
      const response = await fetch(`${baseUrl}/api/editions/slugs`, { cache: "no-store" });
      const text = await response.text();

      if (!response.ok) {
        setState("error");
        setError({ status: response.status, message: text.slice(0, 220) });
        return;
      }

      let nextSlugs: string[] = [];
      try {
        const json = JSON.parse(text) as { editions?: Array<{ slug?: string }> };
        if (!Array.isArray(json.editions)) {
          throw new Error("unexpected-shape");
        }
        nextSlugs = json.editions.map((item) => String(item.slug || "")).filter(Boolean);
      } catch {
        setState("error");
        setError({ status: response.status, message: "Could not load editions" });
        return;
      }

      setSlugs(nextSlugs);
      setState("ok");
    } catch {
      setState("error");
      setError({ status: "network", message: "Failed to connect." });
    }
  }

  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
        <strong>Status: {state}</strong>
        <button onClick={refresh} disabled={state === "loading"} style={{ padding: "6px 10px" }}>
          {state === "loading" ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {!error ? (
        slugs.length > 0 ? (
          <ul>
            {slugs.map((slug) => (
              <li key={slug}><code>{slug}</code></li>
            ))}
          </ul>
        ) : (
          <p>No slugs returned.</p>
        )
      ) : (
        <div>
          <p><strong>Status:</strong> <code>{String(error.status)}</code></p>
          <p><strong>Message:</strong> <code>{error.message}</code></p>
        </div>
      )}
    </div>
  );
}
