"use client";

import { useState } from "react";

type EditionsPanelProps = {
  productId: string;
  baseUrl: string;
  initialSlugs: string[];
  initialError: { status: number | string; message: string } | null;
  initialRefreshedAt: string;
};

type FetchState = "idle" | "loading" | "ok" | "error";

export function EditionsPanel({ productId, baseUrl, initialSlugs, initialError, initialRefreshedAt }: EditionsPanelProps) {
  const [slugs, setSlugs] = useState<string[]>(initialSlugs);
  const [error, setError] = useState<{ status: number | string; message: string } | null>(initialError);
  const [state, setState] = useState<FetchState>(initialError ? "error" : initialSlugs.length ? "ok" : "idle");
  const [search, setSearch] = useState("");
  const [lastRefreshAt, setLastRefreshAt] = useState(initialRefreshedAt);

  const filteredSlugs = slugs.filter((slug) => slug.toLowerCase().includes(search.toLowerCase()));

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
      setLastRefreshAt(new Date().toISOString());
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

      <p><strong>Total:</strong> {slugs.length}</p>
      <p><strong>Last refresh:</strong> <code>{lastRefreshAt}</code></p>
      <label style={{ display: "block", marginBottom: 8 }}>
        <strong>Search slug:</strong>{" "}
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Type slug"
          style={{ padding: "6px 8px" }}
        />
      </label>

      {!error ? (
        filteredSlugs.length > 0 ? (
          <ul>
            {filteredSlugs.map((slug) => (
              <li key={slug} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <a
                  href={`${baseUrl}/e/${slug}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ textDecoration: "underline" }}
                >
                  <code>{slug}</code>
                </a>
                <a
                  href={`/api/products/${productId}/editions/${slug}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 12, textDecoration: "underline" }}
                >
                  JSON
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p>{slugs.length > 0 ? "No matches for current search." : "No slugs returned."}</p>
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
