"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type FilterableEditionsProps = {
  productId: string;
  baseUrl: string;
  slugs: string[];
};

export default function FilterableEditions({ productId, baseUrl, slugs }: FilterableEditionsProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return slugs;
    return slugs.filter((slug) => slug.toLowerCase().includes(q));
  }, [query, slugs]);

  return (
    <div>
      <label style={{ display: "block", marginBottom: 12 }}>
        Filter slug:{" "}
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="type slug"
          style={{ padding: "6px 8px" }}
        />
      </label>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", paddingBottom: 8 }}>Slug</th>
            <th style={{ textAlign: "left", paddingBottom: 8 }}>Links</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((slug) => (
            <tr key={slug}>
              <td style={{ padding: "6px 0" }}><code>{slug}</code></td>
              <td style={{ display: "flex", gap: 10, padding: "6px 0" }}>
                <a href={`${baseUrl}/e/${slug}`} target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>
                  Open web
                </a>
                <a href={`/api/products/${productId}/editions/${slug}`} target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>
                  JSON
                </a>
                <Link href={`/products/${productId}/editions/${slug}`} style={{ textDecoration: "underline" }}>
                  Detail
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filtered.length === 0 ? <p style={{ marginTop: 10 }}>No editions found.</p> : null}
    </div>
  );
}
