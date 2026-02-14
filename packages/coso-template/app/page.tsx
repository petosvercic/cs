export const dynamic = "force-dynamic";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

type ProductConfig = {
  productSlug: string;
  editionSlug: string;
  locale: string;
  title: string;
};

async function readProductConfig(): Promise<ProductConfig> {
  const here = path.dirname(fileURLToPath(import.meta.url)); // .../app
  const projectRoot = path.resolve(here, "..", ".."); // .../coso-template

  const candidates = [
    path.join(projectRoot, "product.config.json"),
    path.join(projectRoot, "template-root", "product.config.json")
  ];

  let lastErr: unknown = null;

  for (const p of candidates) {
    try {
      const raw = await fs.readFile(p, "utf8");
      return JSON.parse(raw) as ProductConfig;
    } catch (e) {
      lastErr = e;
    }
  }

  throw new Error(`product.config.json not found. Last error: ${String(lastErr)}`);
}

function ClientForm() {
  "use client";

  const React = require("react") as typeof import("react");
  const { useState } = React;

  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/compute", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, birthDate })
      });

      const json = await res.json().catch(() => null);

      setResult({
        ok: res.ok,
        status: res.status,
        body: json
      });
    } catch (err: any) {
      setResult({
        ok: false,
        status: 0,
        body: { error: { code: "NETWORK_ERROR", message: String(err?.message ?? err) } }
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={onSubmit}>
        <label htmlFor="name">Meno</label>
        <input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nap?? meno" />

        <label htmlFor="birthDate">D?tum narodenia</label>
        <input
          id="birthDate"
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          placeholder="YYYY-MM-DD"
        />

        <button disabled={loading} type="submit">
          {loading ? "Po??tam..." : "Vypo??ta?"}
        </button>

        <div style={{ marginTop: 10 }}>
          <small>POST /api/compute ? JSON (score, verdict, facts)</small>
        </div>
      </form>

      {result ? (
        <div style={{ marginTop: 18 }}>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      ) : null}
    </div>
  );
}

export default async function Page() {
  const cfg = await readProductConfig();

  return (
    <>
      <h1>{cfg.title}</h1>
      <ClientForm />
    </>
  );
}
