# _autopatch_editions.ps1
# Run from repo root: powershell -ExecutionPolicy Bypass -File .\_autopatch_editions.ps1

$ErrorActionPreference = "Stop"

function Ensure-Dir($p) {
  if (!(Test-Path $p)) { New-Item -ItemType Directory -Path $p | Out-Null }
}

$root = Get-Location
$base = Join-Path $root "apps\nevedelE"

if (!(Test-Path $base)) {
  throw "Nevidím apps\nevedelE. Spusť to z rootu repa coso-system."
}

# Paths
$pEditionPage = Join-Path $base "app\e\[slug]\page.tsx"
$pEditionUI   = Join-Path $base "app\e\[slug]\ui.tsx"
$pCompute     = Join-Path $base "app\api\compute\route.ts"
$pCheckout    = Join-Path $base "app\api\stripe\checkout\route.ts"

Ensure-Dir (Split-Path $pEditionPage)
Ensure-Dir (Split-Path $pCompute)
Ensure-Dir (Split-Path $pCheckout)

# --- 1) page.tsx ---
@'
import fs from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import EditionClient from "./ui";

function readJsonNoBom(filePath: string) {
  const raw = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  return JSON.parse(raw);
}

export const dynamic = "force-dynamic";

export default async function EditionPage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}) {
  const p: any = await (params as any);
  const slug = String(p?.slug ?? "");

  const edPath = path.join(process.cwd(), "data", "editions", `${slug}.json`);
  if (!slug || !fs.existsSync(edPath)) notFound();

  const edition = readJsonNoBom(edPath);

  return <EditionClient slug={slug} edition={edition} />;
}
'@ | Set-Content -Path $pEditionPage -Encoding UTF8

# --- 2) ui.tsx ---
@'
"use client";

import { useEffect, useMemo, useState } from "react";

type Edition = {
  slug?: string;
  title?: string;
  engine?: { subject?: string; locale?: "sk" | "cz" | "en" };
  content?: any;
  tasks?: any;
};

type EngineItem = { id?: string; title?: string; value?: number; text?: string };
type EngineCategory = { key?: string; title?: string; items?: EngineItem[] };
type EngineResult = { categories?: EngineCategory[] };

function makeRid(slug: string) {
  return `${slug}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function EditionClient({ slug, edition }: { slug: string; edition: Edition }) {
  const c = edition?.content ?? {};
  const locale = edition?.engine?.locale ?? "sk";

  const PREPAY_CATS = 3;
  const PREPAY_ITEMS_WITH_ANSWER = 3;

  const storageKey = useMemo(() => `coso:rid:${slug}`, [slug]);

  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [rid, setRid] = useState<string>("");
  const [result, setResult] = useState<EngineResult | null>(null);
  const [paid, setPaid] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    const existing = localStorage.getItem(storageKey);
    const next = existing || makeRid(slug);
    localStorage.setItem(storageKey, next);
    setRid(next);
  }, [slug, storageKey]);

  useEffect(() => {
    const url = new URL(window.location.href);
    const sessionId = url.searchParams.get("session_id");
    const urlRid = url.searchParams.get("rid");
    if (!sessionId) return;

    const effectiveRid = urlRid || rid || localStorage.getItem(storageKey) || null;
    if (!effectiveRid) return;

    setBusy("Overujem platbu…");
    fetch(`/api/pay/status?session_id=${encodeURIComponent(sessionId)}&rid=${encodeURIComponent(effectiveRid)}`)
      .then((r) => r.json())
      .then((j) => {
        if (j?.ok && j?.paid) setPaid(true);
      })
      .finally(() => {
        setBusy(null);
        url.searchParams.delete("session_id");
        url.searchParams.delete("canceled");
        url.searchParams.delete("rid");
        window.history.replaceState({}, "", url.toString());
      });
  }, [rid, storageKey]);

  async function onCompute() {
    setErr("");
    if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      setErr("Dátum narodenia musí byť YYYY-MM-DD.");
      return;
    }

    setBusy("Počítam…");
    try {
      const res = await fetch("/api/compute", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          editionSlug: slug,
          name: name.trim() ? name.trim() : undefined,
          birthDate,
          locale,
        }),
      });

      const j = await res.json().catch(() => null);
      if (!res.ok || !j?.ok) throw new Error(j?.error ?? "COMPUTE_FAILED");
      setResult(j.result as EngineResult);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setBusy(null);
    }
  }

  async function onCheckout() {
    setErr("");
    const effectiveRid = rid || localStorage.getItem(storageKey) || makeRid(slug);
    localStorage.setItem(storageKey, effectiveRid);
    setRid(effectiveRid);

    setBusy("Presmerúvam na platbu…");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          rid: effectiveRid,
          returnTo: `/e/${slug}`,
        }),
      });

      const j = await res.json().catch(() => null);
      if (!res.ok || !j?.ok || !j?.url) throw new Error(j?.error ?? "CHECKOUT_FAILED");
      window.location.href = j.url;
    } catch (e: any) {
      setErr(String(e?.message ?? e));
      setBusy(null);
    }
  }

  const cats = Array.isArray(result?.categories) ? result!.categories! : [];
  const visibleCats = paid ? cats : cats.slice(0, PREPAY_CATS);

  return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 980 }}>
      <p style={{ marginBottom: 12 }}>
        <a href="/list">späť na edície</a>
      </p>

      <h1 style={{ fontSize: 34, marginBottom: 8 }}>{edition?.title ?? slug}</h1>
      <p style={{ opacity: 0.75, marginTop: 0 }}>{c?.heroSubtitle ?? ""}</p>

      <section style={{ marginTop: 18, padding: 14, border: "1px solid #ddd" }}>
        <h2 style={{ marginTop: 0 }}>{c?.intro?.title ?? "Úvod"}</h2>
        <p style={{ marginBottom: 0 }}>{c?.intro?.text ?? ""}</p>
      </section>

      <section style={{ marginTop: 18, padding: 14, border: "1px solid #ddd" }}>
        <h2 style={{ marginTop: 0 }}>{c?.form?.title ?? "Zadaj údaje"}</h2>

        <div style={{ display: "grid", gap: 10, maxWidth: 520 }}>
          <label>
            <div style={{ fontSize: 13, opacity: 0.8 }}>{c?.form?.nameLabel ?? "Meno (voliteľné)"}</div>
            <input value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%", padding: 10 }} />
          </label>

          <label>
            <div style={{ fontSize: 13, opacity: 0.8 }}>
              {c?.form?.birthDateLabel ?? "Dátum narodenia (YYYY-MM-DD)"}
            </div>
            <input
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              placeholder="1990-01-01"
              style={{ width: "100%", padding: 10 }}
            />
          </label>

          <button onClick={onCompute} disabled={Boolean(busy)} style={{ padding: 12 }}>
            {c?.form?.submitLabel ?? "Vypočítať"}
          </button>
        </div>

        {err ? <p style={{ color: "crimson" }}>{err}</p> : null}
        {busy ? <p style={{ opacity: 0.8 }}>{busy}</p> : null}
      </section>

      {result ? (
        <section style={{ marginTop: 18, padding: 14, border: "1px solid #ddd" }}>
          <h2 style={{ marginTop: 0 }}>{paid ? "Výsledok" : (c?.result?.teaserTitle ?? "Náhľad výsledku")}</h2>
          {!paid ? <p style={{ opacity: 0.85 }}>{c?.result?.teaserNote ?? ""}</p> : null}

          {visibleCats.length ? (
            <div style={{ display: "grid", gap: 14 }}>
              {visibleCats.map((cat, ci) => {
                const items = Array.isArray(cat.items) ? cat.items : [];
                return (
                  <div key={cat.key ?? ci} style={{ padding: 12, border: "1px solid #eee" }}>
                    <div style={{ fontSize: 13, opacity: 0.7 }}>{cat.title ?? `Kategória ${ci + 1}`}</div>

                    <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                      {items.map((it, ti) => {
                        const showAnswer = paid || ti < PREPAY_ITEMS_WITH_ANSWER;
                        return (
                          <div key={it.id ?? `${ci}-${ti}`} style={{ padding: 10, border: "1px solid #f0f0f0" }}>
                            <div style={{ display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
                              <div style={{ fontWeight: 700 }}>{it.title ?? `Task ${ti + 1}`}</div>
                              {typeof it.value === "number" ? (
                                <div style={{ opacity: 0.7, fontSize: 13 }}>
                                  <strong>Hodnota:</strong> {it.value}
                                </div>
                              ) : null}
                            </div>

                            {showAnswer ? (
                              <p style={{ margin: "8px 0 0" }}>{it.text ?? "—"}</p>
                            ) : (
                              <p style={{ margin: "8px 0 0", opacity: 0.6 }}>🔒 Zamknuté (odkryje sa po platbe)</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: "crimson" }}>
              Compute vrátil výsledok bez `categories`. To znamená, že `/api/compute` ešte nerobí 5×25.
            </p>
          )}

          {!paid ? (
            <div style={{ marginTop: 14, padding: 12, background: "#f6f6f6", border: "1px solid #e4e4e4" }}>
              <h3 style={{ marginTop: 0 }}>{c?.paywall?.headline ?? "Odomkni plnú verziu"}</h3>
              <ul>
                {(c?.paywall?.bullets ?? []).slice(0, 3).map((b: string, idx: number) => (
                  <li key={idx}>{b}</li>
                ))}
              </ul>
              <p style={{ opacity: 0.8 }}>{c?.result?.unlockHint ?? ""}</p>
              <button onClick={onCheckout} disabled={Boolean(busy)} style={{ padding: 12 }}>
                {c?.paywall?.cta ?? "Odomknúť"}
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      <p style={{ marginTop: 18, opacity: 0.6, fontSize: 12 }}>
        debug: rid=<code>{rid}</code> | paid=<code>{String(paid)}</code>
      </p>
    </main>
  );
}
'@ | Set-Content -Path $pEditionUI -Encoding UTF8

# --- 3) compute route ---
@'
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { compute } from "coso-engine";
import { EngineInputSchema } from "coso-contract";

function hashStr(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function makeRng(seed: number) {
  let x = seed >>> 0;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 4294967296;
  };
}

function pickVariant(variants: any[], value: number) {
  for (const v of variants) {
    const w = v?.when;
    if (!w) continue;
    if (typeof w.lte === "number" && value <= w.lte) return v;
    if (Array.isArray(w.between) && w.between.length === 2) {
      const [a, b] = w.between;
      if (typeof a === "number" && typeof b === "number" && value >= a && value <= b) return v;
    }
    if (typeof w.gte === "number" && value >= w.gte) return v;
  }
  return variants?.[0] ?? null;
}

function readEdition(slug: string) {
  const edPath = path.join(process.cwd(), "data", "editions", `${slug}.json`);
  if (!fs.existsSync(edPath)) return null;
  const raw = fs.readFileSync(edPath, "utf8").replace(/^\uFEFF/, "");
  return JSON.parse(raw);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const editionSlug = typeof body?.editionSlug === "string" ? body.editionSlug : null;
    if (editionSlug) {
      const edition = readEdition(editionSlug);
      if (!edition) return NextResponse.json({ ok: false, error: "EDITION_NOT_FOUND" }, { status: 404 });

      const birthDate = typeof body?.birthDate === "string" ? body.birthDate : null;
      const name = typeof body?.name === "string" ? body.name : "";
      const locale = typeof body?.locale === "string" ? body.locale : "sk";

      if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
        return NextResponse.json({ ok: false, error: "BAD_BIRTHDATE" }, { status: 400 });
      }

      const engineInput = { subject: edition?.engine?.subject ?? editionSlug, birthDate, name, locale };
      const parsed = (EngineInputSchema as any).safeParse
        ? (EngineInputSchema as any).safeParse(engineInput)
        : { success: true, data: (EngineInputSchema as any).parse(engineInput) };

      if (!parsed.success) {
        return NextResponse.json({ ok: false, error: "INVALID_INPUT", details: parsed.error?.issues ?? null }, { status: 400 });
      }

      const base = await compute(parsed.data);
      const seed = hashStr(JSON.stringify(base)) ^ hashStr(`${editionSlug}|${birthDate}|${name}|${locale}`);
      const rng = makeRng(seed);

      const cats = edition?.tasks?.categories;
      if (!Array.isArray(cats) || cats.length !== 5) {
        return NextResponse.json({ ok: false, error: "TASKS_MISSING_OR_NOT_5_CATEGORIES" }, { status: 400 });
      }

      const outCats = cats.map((cat: any, ci: number) => {
        const pool = Array.isArray(cat?.pool) ? cat.pool : [];
        if (pool.length !== 50) throw new Error(`CATEGORY_${ci + 1}_POOL_NOT_50`);

        const idx = pool.map((_: any, i: number) => i);
        for (let i = idx.length - 1; i > 0; i--) {
          const j = Math.floor(rng() * (i + 1));
          [idx[i], idx[j]] = [idx[j], idx[i]];
        }
        const chosen = idx.slice(0, 25).map((i) => pool[i]);

        const items = chosen.map((t: any) => {
          const tid = String(t?.id ?? "");
          const title = String(t?.title ?? "Task");
          const metricKey = String(t?.metricKey ?? "");
          const variants = Array.isArray(t?.variants) ? t.variants : [];

          const vSeed = hashStr(`${seed}|${metricKey}|${tid}|${ci}`);
          const value = vSeed % 101;

          const picked = pickVariant(variants, value);
          const text = typeof picked?.text === "string" ? picked.text : "";

          return { id: tid, title, value, text };
        });

        return { key: String(cat?.key ?? `cat${ci + 1}`), title: String(cat?.title ?? `Kategória ${ci + 1}`), items };
      });

      return NextResponse.json({ ok: true, result: { categories: outCats } }, { status: 200 });
    }

    const candidate =
      body && typeof body === "object" && body !== null && "input" in (body as any)
        ? (body as any).input
        : body;

    const parsed = (EngineInputSchema as any).safeParse
      ? (EngineInputSchema as any).safeParse(candidate)
      : { success: true, data: (EngineInputSchema as any).parse(candidate) };

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "INVALID_INPUT", details: parsed.error?.issues ?? parsed.error ?? null },
        { status: 400 }
      );
    }

    const result = await compute(parsed.data);
    return NextResponse.json({ ok: true, result }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR", message: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
'@ | Set-Content -Path $pCompute -Encoding UTF8

# --- 4) checkout route ---
@'
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import Stripe from "stripe";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("MISSING_STRIPE_SECRET_KEY");
  return new Stripe(key);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as null | {
      rid?: unknown;
      priceId?: unknown;
      returnTo?: unknown;
    };

    const rid = typeof body?.rid === "string" ? body.rid : null;
    const priceId = typeof body?.priceId === "string" ? body.priceId : process.env.STRIPE_PRICE_ID ?? null;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? null;
    const returnTo = typeof body?.returnTo === "string" && body.returnTo.startsWith("/") ? body.returnTo : "/";

    if (!rid) return NextResponse.json({ ok: false, error: "MISSING_RID" }, { status: 400 });
    if (!priceId) return NextResponse.json({ ok: false, error: "MISSING_PRICE_ID" }, { status: 500 });
    if (!appUrl) return NextResponse.json({ ok: false, error: "MISSING_APP_URL" }, { status: 500 });

    const stripe = getStripe();

    const successUrl = `${appUrl}${returnTo}?rid=${encodeURIComponent(rid)}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${appUrl}${returnTo}?rid=${encodeURIComponent(rid)}&canceled=1`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { rid },
      client_reference_id: rid,
    });

    if (!session.url) return NextResponse.json({ ok: false, error: "NO_CHECKOUT_URL" }, { status: 500 });

    return NextResponse.json({ ok: true, url: session.url }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR", message: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
'@ | Set-Content -Path $pCheckout -Encoding UTF8

Write-Host ""
Write-Host "OK: súbory prepísané:"
Write-Host " - $pEditionPage"
Write-Host " - $pEditionUI"
Write-Host " - $pCompute"
Write-Host " - $pCheckout"
Write-Host ""
Write-Host "Ďalej:"
Write-Host "  git add -A"
Write-Host "  git commit -m `"feat: edition compute 5x25 + gating + returnTo checkout`""
Write-Host "  git push origin main"
