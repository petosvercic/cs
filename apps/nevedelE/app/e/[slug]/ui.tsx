"use client";

import { useEffect, useMemo, useState } from "react";
import type { EditionPackDocument } from "../../../lib/edition-pack";

function applyPoolingA(pack: any, teaserPerCategory: number, isPaid: boolean) {
  const cloned = JSON.parse(JSON.stringify(pack));
  if (!Array.isArray(cloned?.categories)) return cloned;
  for (const cat of cloned.categories) {
    if (!Array.isArray(cat.items)) continue;
    cat.items = cat.items.map((it: any, idx: number) => ({ ...it, locked: !(isPaid || idx < teaserPerCategory) }));
  }
  return cloned;
}

function fillTemplate(text: string, vars: Record<string, string | number | null | undefined>): string {
  return text.replace(/\{(\w+)\}/g, (_, key) => (vars[key] == null ? "" : String(vars[key])));
}

function hashStringToInt(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function rand() {
    a += 0x6d2b79f5;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function overlayClass(v?: string) {
  if (v === "none") return "bg-transparent";
  if (v === "strong") return "bg-black/60";
  return "bg-black/35";
}

export default function EditionClient({ edition }: { edition: EditionPackDocument }) {
  const [name, setName] = useState("");
  const [birthISO, setBirthISO] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    const sessionId = new URL(window.location.href).searchParams.get("session_id");
    if (!sessionId) return;
    fetch("/api/stripe/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sessionId }) })
      .then((r) => r.json())
      .then((j) => setIsPaid(Boolean(j?.paid)))
      .catch(() => null);
  }, []);

  const rendered = useMemo(() => {
    if (!submitted || !birthISO) return null;
    const [year, month, day] = birthISO.split("-");
    const vars = { name: name || "Ty", year, month, day, birthYear: year, age: Math.max(0, new Date().getFullYear() - Number(year || 0)) };
    const rng = mulberry32(hashStringToInt(`${edition.slug}|${name}|${birthISO}`));

    const categories = edition.pack.categories.map((cat) => {
      const shuffled = [...cat.items].sort(() => rng() - 0.5);
      return { ...cat, items: shuffled.map((it) => ({ ...it, text: fillTemplate(it.template, vars) })) };
    });

    return applyPoolingA({ categories }, 1, isPaid);
  }, [submitted, birthISO, name, edition, isPaid]);

  const bg = "/brand/bg.png";
  const overlay = "soft";

  return (
    <main className="relative min-h-screen text-neutral-100">
      <div className="absolute inset-0 -z-20 bg-cover bg-center" style={{ backgroundImage: `url('${bg}')` }} />
      <div className={`absolute inset-0 -z-10 ${overlayClass(overlay)}`} />
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-4xl font-bold">{edition.pack.uiCopy.heroTitle}</h1>
        <p className="mt-2 text-neutral-200">{edition.pack.uiCopy.heroSubtitle}</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <input className="rounded border border-neutral-600 bg-black/40 p-2" placeholder="Meno" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="rounded border border-neutral-600 bg-black/40 p-2" type="date" value={birthISO} onChange={(e) => setBirthISO(e.target.value)} />
        </div>
        <button className="mt-3 rounded bg-white px-4 py-2 font-semibold text-black" onClick={() => setSubmitted(true)}>Generovať</button>

        {rendered?.categories?.map((cat: any) => (
          <section key={cat.id} className="mt-6 rounded-xl border border-neutral-700 bg-black/35 p-4">
            <h2 className="text-xl font-semibold">{cat.title}</h2>
            <p className="mt-1 text-sm text-neutral-300">{isPaid ? cat.intro : cat.lockedIntro}</p>
            <ul className="mt-3 space-y-2">
              {cat.items.map((item: any) => (
                <li key={item.id} className="rounded border border-neutral-800 p-3">
                  <div className="font-medium">{item.title}</div>
                  <div className="text-sm text-neutral-300">{item.locked ? "••••••••" : item.text}</div>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {!isPaid && submitted ? (
          <button
            onClick={async () => {
              const rid = `${edition.slug}:${birthISO}`;
              const r = await fetch("/api/stripe/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ rid, slug: edition.slug, returnTo: `/e/${edition.slug}` }) });
              const j = await r.json();
              if (j?.url) window.location.href = j.url;
            }}
            className="mt-6 rounded bg-emerald-300 px-4 py-2 font-semibold text-emerald-950"
          >
            {edition.pack.uiCopy.unlockCta}
          </button>
        ) : null}
      </div>
    </main>
  );
}
