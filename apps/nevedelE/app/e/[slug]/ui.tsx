"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type EngineItem = { id?: string; title?: string; value?: number; text?: string };
type EngineCategory = {
  key?: string;
  title?: string;
  items?: EngineItem[];
  score?: number;
  band?: "low" | "mid" | "high" | string;
  percentile?: number;
  insight?: string;
  recommendation?: string;
};
type EngineResult = { categories?: EngineCategory[] };

type Edition = {
  title?: string;
  engine?: { locale?: string };
  content?: {
    heroSubtitle?: string;
    intro?: { title?: string; text?: string };
    form?: { title?: string; nameLabel?: string; birthDateLabel?: string; submitLabel?: string };
    result?: { teaserTitle?: string; teaserNote?: string; unlockHint?: string };
    paywall?: { headline?: string; bullets?: string[]; cta?: string };
  };
};

function sanitizeBirthDateInput(s: string) {
  const raw = String(s || "").trim();
  const digitsOnly = raw.replace(/\D/g, "").slice(0, 8);

  if (/^\d*$/.test(raw)) {
    if (digitsOnly.length <= 2) return digitsOnly;
    if (digitsOnly.length <= 4) return `${digitsOnly.slice(0, 2)}.${digitsOnly.slice(2)}`;
    return `${digitsOnly.slice(0, 2)}.${digitsOnly.slice(2, 4)}.${digitsOnly.slice(4)}`;
  }

  return raw.slice(0, 10);
}

function normalizeBirthDate(s: string) {
  const t = (s || "").trim();
  if (!t) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;

  if (/^\d{2}\.\d{2}\.\d{4}$/.test(t)) {
    const [dd, mm, yyyy] = t.split(".");
    return `${yyyy}-${mm}-${dd}`;
  }

  if (/^\d{8}$/.test(t)) {
    return `${t.slice(4, 8)}-${t.slice(2, 4)}-${t.slice(0, 2)}`;
  }

  return t;
}

function makeRid(slug: string, rawBirthDate: string) {
  const birthDate = normalizeBirthDate(rawBirthDate);
  if (!birthDate) return "";
  return `${slug}:${birthDate}`;
}

function bandLabel(band?: string) {
  if (band === "low") return "Nízke";
  if (band === "mid") return "Stredné";
  if (band === "high") return "Vysoké";
  return band || "";
}

type EditionClientProps = {
  slug: string;
  edition: Edition;
  previewMode?: boolean;
};

export default function EditionClient({ slug, edition, previewMode = false }: EditionClientProps) {
  const c = edition?.content ?? {};
  const locale = edition?.engine?.locale ?? "sk";

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");

  const [rid, setRid] = useState("");
  const [paid, setPaid] = useState(false);

  const [result, setResult] = useState<EngineResult | null>(null);
  const [payBusy, setPayBusy] = useState(false);
  const [autoComputeDone, setAutoComputeDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const isUnlocked = paid || previewMode;

  function persistInputsToUrl(nextBirthDateRaw: string, nextNameRaw: string) {
    if (previewMode) return;

    const bd = normalizeBirthDate(nextBirthDateRaw);
    const nm = (nextNameRaw || "").trim();
    const nextRid = bd ? makeRid(slug, bd) : "";

    const sp = new URLSearchParams(searchParams?.toString() ?? "");
    if (bd) sp.set("birthDate", bd);
    else sp.delete("birthDate");

    if (nm) sp.set("name", nm);
    else sp.delete("name");

    if (nextRid) sp.set("rid", nextRid);
    else sp.delete("rid");

    const q = sp.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }

  function storageKey(slugKey: string, bd: string) {
    return `coso:result:${slugKey}:${bd}`;
  }

  async function computeForBirthDate(bdRaw: string, displayName: string) {
    const bd = normalizeBirthDate(bdRaw);
    if (!bd) throw new Error("Zadaj dátum narodenia.");

    const r = await fetch("/api/compute", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        editionSlug: slug,
        name: (displayName || "").trim() || "",
        birthDate: bd,
        locale
      })
    });

    const json = await r.json();
    if (!r.ok) throw new Error(json?.error || "COMPUTE_FAILED");

    const payload = (json?.result ?? json) as EngineResult;
    const nextRid = makeRid(slug, bd);

    setResult(payload);
    setRid(nextRid);

    try {
      localStorage.setItem(storageKey(slug, bd), JSON.stringify(payload));
    } catch {
      // noop
    }
  }

  useEffect(() => {
    if (previewMode) return;

    try {
      const url = new URL(window.location.href);
      const birthDateFromUrl = (url.searchParams.get("birthDate") || "").trim();
      const nameFromUrl = (url.searchParams.get("name") || "").trim();
      const ridFromUrl = (url.searchParams.get("rid") || "").trim();

      if (birthDateFromUrl) setBirthDate(birthDateFromUrl);
      if (nameFromUrl) setName(nameFromUrl);

      if (ridFromUrl) {
        setRid(ridFromUrl);
        const [, bdFromRid] = ridFromUrl.split(":", 2);
        if (bdFromRid && /^\d{4}-\d{2}-\d{2}$/.test(bdFromRid)) {
          setBirthDate(bdFromRid);
        }
      }
    } catch {
      // noop
    }
  }, [previewMode, slug]);

  useEffect(() => {
    try {
      const bd = normalizeBirthDate(birthDate);
      if (!bd) return;

      const raw = localStorage.getItem(storageKey(slug, bd));
      if (raw) setResult(JSON.parse(raw));
    } catch {
      // noop
    }
  }, [slug, birthDate]);

  useEffect(() => {
    if (previewMode) return;

    (async () => {
      try {
        const url = new URL(window.location.href);
        const sessionId = (url.searchParams.get("session_id") || "").trim();
        const ridFromUrl = (url.searchParams.get("rid") || "").trim();
        const effectiveRid = (ridFromUrl || rid || "").trim();
        if (!effectiveRid) return;

        if (sessionId) {
          const r = await fetch(
            `/api/pay/status?session_id=${encodeURIComponent(sessionId)}&rid=${encodeURIComponent(effectiveRid)}&slug=${encodeURIComponent(slug)}`,
            { cache: "no-store" }
          );
          const json = await r.json();
          if (json?.paid) setPaid(true);

          url.searchParams.delete("session_id");
          window.history.replaceState({}, "", url.toString());
          return;
        }

        const r = await fetch(`/api/pay/status?rid=${encodeURIComponent(effectiveRid)}&slug=${encodeURIComponent(slug)}`, {
          cache: "no-store"
        });
        const json = await r.json();
        if (json?.paid) setPaid(true);
      } catch {
        // noop
      }
    })();
  }, [previewMode, rid, slug]);

  useEffect(() => {
    if (autoComputeDone || result) return;

    const bd = normalizeBirthDate(birthDate);
    if (!bd) return;

    const expectedRid = makeRid(slug, bd);
    if (rid && rid !== expectedRid) return;

    (async () => {
      try {
        await computeForBirthDate(bd, name);
        persistInputsToUrl(bd, name);
      } catch {
        // silent: user can compute manually
      } finally {
        setAutoComputeDone(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoComputeDone, birthDate, name, result, rid, slug]);

  const visible = useMemo(() => {
    if (!result?.categories?.length) return null;
    if (isUnlocked) return result;

    const cats = result.categories.slice(0, 2).map((cat) => ({
      ...cat,
      items: (cat.items ?? []).slice(0, 1).map((it) => ({ ...it })),
      recommendation: undefined
    }));

    return { categories: cats } as EngineResult;
  }, [result, isUnlocked]);

  async function onCompute() {
    setErr(null);
    try {
      persistInputsToUrl(birthDate, name);
      await computeForBirthDate(birthDate, name);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    }
  }

  async function onCheckout() {
    if (previewMode) return;

    setErr(null);
    setPayBusy(true);

    try {
      persistInputsToUrl(birthDate, name);

      const bd = normalizeBirthDate(birthDate);
      const effectiveRid = (rid || makeRid(slug, bd)).trim();
      if (!effectiveRid) throw new Error("Najprv vyplň dátum narodenia a vyhodnoť výsledok.");

      const trimmedName = (name || "").trim();
      const returnSp = new URLSearchParams();
      returnSp.set("rid", effectiveRid);
      returnSp.set("birthDate", bd);
      if (trimmedName) returnSp.set("name", trimmedName);

      const r = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          rid: effectiveRid,
          slug,
          returnTo: `/e/${slug}?${returnSp.toString()}`
        })
      });

      const json = await r.json();
      if (!r.ok) throw new Error(json?.error || "CHECKOUT_FAILED");
      if (!json?.url) throw new Error("MISSING_CHECKOUT_URL");

      window.location.href = json.url;
    } catch (e: any) {
      setErr(String(e?.message ?? e));
      setPayBusy(false);
    }
  }

  return (
    <main
      className="min-h-screen px-4 py-10 text-neutral-100"
      style={{
        backgroundImage: "url('/brand/bg.png')",
        backgroundSize: "contain",
        backgroundPosition: "center bottom",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed"
      }}
    >
      <div className="mx-auto w-full max-w-5xl rounded-3xl border border-neutral-800 bg-neutral-950/60 p-6 shadow-2xl backdrop-blur-sm sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{edition?.title ?? slug}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-200/80">{c?.heroSubtitle ?? ""}</p>
          </div>
          <img src="/brand/logo.png" alt="Brand" className="h-14 w-auto shrink-0 opacity-95" />
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex gap-2">
            <a className="rounded-lg border border-neutral-600 bg-neutral-900/60 px-3 py-2" href="/">Domov</a>
            <a className="rounded-lg border border-neutral-600 bg-neutral-900/60 px-3 py-2" href="/list">Späť na zoznam</a>
          </div>
          <span className="rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-300">
            {previewMode ? "preview mode" : `paid: ${String(paid)}`}
          </span>
        </div>

        {(c?.intro?.title || c?.intro?.text) && (
          <section className="mb-4 rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4">
            {c?.intro?.title ? <h2 className="text-lg font-semibold">{c.intro.title}</h2> : null}
            {c?.intro?.text ? <p className="mt-2 text-sm text-neutral-300">{c.intro.text}</p> : null}
          </section>
        )}

        {!result ? (
          <section className="mb-4 rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4">
            <h2 className="mb-3 text-lg font-semibold">{c?.form?.title || "Zadaj údaje"}</h2>
            <div className="flex flex-wrap gap-3">
              <input
                className="min-w-[220px] flex-1 rounded-lg border border-neutral-700 bg-neutral-950/80 px-3 py-2 text-sm"
                placeholder={c?.form?.nameLabel || "Meno (voliteľné)"}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                className="min-w-[220px] flex-1 rounded-lg border border-neutral-700 bg-neutral-950/80 px-3 py-2 text-sm"
                placeholder={c?.form?.birthDateLabel || "dd.mm.rrrr alebo YYYY-MM-DD"}
                value={birthDate}
                onChange={(e) => setBirthDate(sanitizeBirthDateInput(e.target.value))}
              />
              <button
                className="rounded-lg bg-neutral-100 px-4 py-2 font-semibold text-neutral-950"
                onClick={onCompute}
              >
                {c?.form?.submitLabel || "Vyhodnotiť"}
              </button>
            </div>

            {err ? <p className="mt-3 text-sm font-semibold text-red-300">{err}</p> : null}
          </section>
        ) : null}

        {visible?.categories?.length ? (
          <section className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{c?.result?.teaserTitle || "Výsledok"}</h2>
                {!isUnlocked ? (
                  <p className="mt-1 text-sm text-neutral-300">
                    {c?.result?.teaserNote || "Zobrazený je len teaser. Zvyšok sa sprístupní po platbe."}
                  </p>
                ) : null}
              </div>

              {!isUnlocked ? (
                <button
                  className="rounded-lg border border-neutral-500 bg-neutral-950/70 px-4 py-2 text-sm"
                  disabled={payBusy || !normalizeBirthDate(birthDate)}
                  onClick={onCheckout}
                >
                  {payBusy ? "Presmerovávam..." : c?.paywall?.cta || "Pokračovať na platbu"}
                </button>
              ) : (
                <span className="text-sm text-emerald-300">Sprístupnené</span>
              )}
            </div>

            <div className="grid gap-3">
              {visible.categories.map((cat, ci) => (
                <article key={cat.key ?? ci} className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-base font-semibold">{cat.title ?? `Kategória ${ci + 1}`}</h3>
                    <div className="flex flex-wrap gap-2 text-xs text-neutral-300">
                      {typeof cat.score === "number" ? <span className="rounded-full border border-neutral-700 px-2 py-1">Skóre: {cat.score}</span> : null}
                      {bandLabel(cat.band) ? <span className="rounded-full border border-neutral-700 px-2 py-1">{bandLabel(cat.band)}</span> : null}
                      {typeof cat.percentile === "number" ? <span className="rounded-full border border-neutral-700 px-2 py-1">Percentil: {cat.percentile}</span> : null}
                    </div>
                  </div>

                  {(cat.insight ?? "").trim() ? <p className="mb-2 text-sm text-neutral-300">{cat.insight}</p> : null}
                  {(cat.recommendation ?? "").trim() && isUnlocked ? (
                    <p className="mb-3 text-sm text-neutral-300">{cat.recommendation}</p>
                  ) : null}

                  <div className="grid gap-2">
                    {(cat.items ?? []).map((it, idx) => (
                      <div key={it.id ?? idx} className="rounded-lg border border-neutral-800 bg-neutral-900/70 p-3">
                        <h4 className="text-sm font-semibold">{it.title ?? `Položka ${idx + 1}`}</h4>
                        {typeof it.value === "number" ? <p className="mt-1 text-xs text-neutral-400">Hodnota: {it.value}</p> : null}
                        {(it.text ?? "").trim() && (it.text ?? "").trim() !== (it.title ?? "").trim() ? (
                          <p className="mt-2 text-sm text-neutral-200">{it.text}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>

            {!isUnlocked && c?.paywall?.headline ? (
              <div className="mt-4 rounded-xl border border-neutral-700 bg-neutral-950/80 p-4">
                <h3 className="text-sm font-semibold">{c.paywall.headline}</h3>
                {Array.isArray(c?.paywall?.bullets) && c.paywall.bullets.length > 0 ? (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-300">
                    {c.paywall.bullets.map((bullet, idx) => (
                      <li key={`${bullet}-${idx}`}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
                {c?.result?.unlockHint ? <p className="mt-2 text-xs text-neutral-400">{c.result.unlockHint}</p> : null}
              </div>
            ) : null}
          </section>
        ) : (
          <section className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 text-sm text-neutral-300">
            Výsledok zatiaľ nie je vygenerovaný.
          </section>
        )}
      </div>
    </main>
  );
}
