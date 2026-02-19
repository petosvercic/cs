"use client";

import { useEffect, useMemo, useState } from "react";
import { generateFacts } from "coso-nevedel-core";

type FactRow = { id: string; title: string; value: string };
type FactBlock = { section: string; heading: string; rows: FactRow[] };

const LS_PREFIX = "nevedelE:paid:";

function ridFor(name: string, birthISO: string) {
  return `${name.trim().toLowerCase()}|${birthISO}`;
}

async function postTelemetry(event: unknown) {
  try {
    await fetch("/api/telemetry", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(event),
    });
  } catch {}
}

export default function Home() {
  const [name, setName] = useState("");
  const [birthISO, setBirthISO] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [paid, setPaid] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rid = useMemo(() => ridFor(name, birthISO), [name, birthISO]);

  const blocks = useMemo(() => {
    if (!submitted || !birthISO) return [] as FactBlock[];
    const out = generateFacts({
      name,
      birthDate: birthISO,
      subject: rid,
      isPaid: paid,
    }) as FactBlock[];
    return out;
  }, [name, birthISO, submitted, paid, rid]);

  async function onGenerate() {
    setError(null);
    if (!name.trim() || !birthISO) {
      setError("Vyplň meno a dátum narodenia.");
      return;
    }

    const key = `${LS_PREFIX}${rid}`;
    const unlocked = typeof window !== "undefined" && localStorage.getItem(key) === "1";
    setPaid(unlocked);
    setSubmitted(true);

    await postTelemetry({ type: "submit", rid, at: new Date().toISOString() });
  }

  async function onUnlock() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rid, returnTo: "/" }),
      });
      const json = await res.json();
      if (!res.ok || !json?.url) throw new Error(json?.error || "CHECKOUT_FAILED");
      window.location.href = json.url;
    } catch (e: any) {
      setError(String(e?.message ?? e));
      setBusy(false);
    }
  }

  async function onVerify(sessionId: string) {
    const res = await fetch("/api/stripe/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    const json = await res.json();
    if (json?.paid) {
      localStorage.setItem(`${LS_PREFIX}${rid}`, "1");
      setPaid(true);
      await postTelemetry({ type: "paid", rid, at: new Date().toISOString(), sessionId });
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sessionId = new URL(window.location.href).searchParams.get("session_id");
    if (sessionId && rid) void onVerify(sessionId);
  }, [rid]);

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-10 text-neutral-100">
      <div className="mx-auto max-w-4xl rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <h1 className="text-3xl font-bold">nevedelE</h1>
        <p className="mt-2 text-sm text-neutral-300">Deterministický runtime výsledok + paywall.</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Meno" className="rounded border border-neutral-700 bg-neutral-950 p-2" />
          <input value={birthISO} onChange={(e) => setBirthISO(e.target.value)} type="date" className="rounded border border-neutral-700 bg-neutral-950 p-2" />
        </div>

        <button onClick={onGenerate} className="mt-3 rounded bg-white px-4 py-2 font-semibold text-black">Generovať</button>

        {blocks.map((block, bIdx) => (
          <section key={`${block.section}-${bIdx}`} className="mt-6 rounded-xl border border-neutral-800 p-4">
            <h2 className="text-xl font-semibold">{block.heading}</h2>
            <ul className="mt-3 space-y-2">
              {block.rows.map((row) => (
                <li key={row.id} className="rounded border border-neutral-800 p-3">
                  <div className="font-medium">{row.title}</div>
                  <div className="text-sm text-neutral-300">{row.value}</div>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {submitted && !paid ? (
          <button onClick={onUnlock} disabled={busy} className="mt-6 rounded bg-emerald-300 px-4 py-2 font-semibold text-emerald-950">
            {busy ? "Presmerovanie..." : "Odomknúť"}
          </button>
        ) : null}

        {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
      </div>
    </main>
  );
}
