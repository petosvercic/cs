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
  content?: any;
};

function sanitizeBirthDateInput(s: string) {
  const raw = String(s || "").trim();
  const digitsOnly = raw.replace(/\D/g, "").slice(0, 8);

  // user-friendly typing: dd.mm.rrrr
  if (/^\d*$/.test(raw)) {
    if (digitsOnly.length <= 2) return digitsOnly;
    if (digitsOnly.length <= 4) return `${digitsOnly.slice(0, 2)}.${digitsOnly.slice(2)}`;
    return `${digitsOnly.slice(0, 2)}.${digitsOnly.slice(2, 4)}.${digitsOnly.slice(4)}`;
  }

  // allow manual paste like YYYY-MM-DD
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
    // ddMMyyyy
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

export default function EditionClient({ slug, edition }: { slug: string; edition: Edition }) {
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

  function persistInputsToUrl(nextBirthDateRaw: string, nextNameRaw: string) {
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
        locale,
      }),
    });

    const json = await r.json();
    if (!r.ok) throw new Error(json?.error || "COMPUTE_FAILED");

    const payload = (json?.result ?? json) as EngineResult;
    const nextRid = makeRid(slug, bd);

    setResult(payload);
    setRid(nextRid);

    try {
      localStorage.setItem(storageKey(slug, bd), JSON.stringify(payload));
    } catch {}
  }

  // Init from URL (canonical identity = slug + birthDate)
  useEffect(() => {
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
    } catch {}
  }, [slug]);

  // Restore cached result for this slug+birthDate (so refresh doesn't wipe it)
  useEffect(() => {
    try {
      const bd = normalizeBirthDate(birthDate);
      if (!bd) return;

      const raw = localStorage.getItem(storageKey(slug, bd));
      if (raw) setResult(JSON.parse(raw));
    } catch {}
  }, [slug, birthDate]);

  // Payment verify (return from Stripe + normal refresh)
  useEffect(() => {
    (async () => {
      try {
        const url = new URL(window.location.href);
        const sessionId = (url.searchParams.get("session_id") || "").trim();
        const ridFromUrl = (url.searchParams.get("rid") || "").trim();
        const effectiveRid = (ridFromUrl || rid || "").trim();
        if (!effectiveRid) return;

        if (sessionId) {
          const r = await fetch(
            `/api/pay/status?session_id=${encodeURIComponent(sessionId)}&rid=${encodeURIComponent(effectiveRid)}&slug=${encodeURIComponent(
              slug
            )}`,
            { cache: "no-store" }
          );
          const json = await r.json();
          if (json?.paid) setPaid(true);

          // clean session_id from URL
          url.searchParams.delete("session_id");
          window.history.replaceState({}, "", url.toString());
          return;
        }

        const r = await fetch(`/api/pay/status?rid=${encodeURIComponent(effectiveRid)}&slug=${encodeURIComponent(slug)}`, {
          cache: "no-store",
        });
        const json = await r.json();
        if (json?.paid) setPaid(true);
      } catch (e) {
        console.warn(e);
      }
    })();
  }, [rid, slug]);

  // Auto compute once when we have birthDate
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
    // intentionally not depending on persistInputsToUrl
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoComputeDone, birthDate, name, result, rid, slug]);

  const visible = useMemo(() => {
    if (!result?.categories?.length) return null;
    if (paid) return result;

    // TEASER: show up to 2 categories, each with 1 item
    const cats = result.categories.slice(0, 2).map((cat) => ({
      ...cat,
      items: (cat.items ?? []).slice(0, 1).map((it) => ({ ...it })),
      recommendation: undefined,
    }));

    return { categories: cats } as EngineResult;
  }, [result, paid]);

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
          returnTo: `/e/${slug}?${returnSp.toString()}`,
        }),
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
    <div className="wrap">
      <style>{`
        .wrap { max-width: 980px; margin: 0 auto; padding: 56px 18px 120px; font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; color: #1a1a1a; }
        .hero { margin-bottom: 28px; }
        .title { font-size: 42px; letter-spacing: -0.02em; margin: 0 0 10px; }
        .sub { margin: 0; opacity: .72; max-width: 720px; font-size: 16px; line-height: 1.6; }
        .card { border: 1px solid #e5e7eb; border-radius: 16px; padding: 18px; background: #fff; box-shadow: 0 8px 20px rgba(15,23,42,.05); }
        .grid { display: grid; gap: 14px; }
        .row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
        .input { padding: 10px 12px; border: 1px solid #ddd; border-radius: 10px; font-size: 14px; }
        .btn { padding: 10px 14px; border-radius: 10px; border: 1px solid #2563eb; background: #2563eb; color: white; cursor: pointer; }
        .btn.secondary { background: white; color: #111; border-color: #ddd; }
        .btn:disabled { opacity: .6; cursor: not-allowed; }
        .err { color: #b00020; font-weight: 600; }
        .sectionTitle { font-size: 18px; margin: 0 0 10px; }
        .cat { padding: 14px; border: 1px solid #eee; border-radius: 14px; background: #fafafa; }
        .cat h2 { margin: 0; font-size: 16px; }
        .catHead { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
        .catMeta { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        .pill { display: inline-block; border: 1px solid #ddd; border-radius: 999px; padding: 2px 8px; font-size: 12px; background: #fff; }
        .catText { font-size: 13px; opacity: .85; margin: 0 0 8px; }
        .item { padding: 12px; border-radius: 12px; background: #fff; border: 1px solid #eee; }
        .item h3 { margin: 0 0 6px; font-size: 15px; }
        .meta { font-size: 12px; opacity: .6; margin-bottom: 8px; }
        .pay { display: flex; gap: 12px; align-items: center; justify-content: space-between; flex-wrap: wrap; }
        .badge { font-size: 12px; opacity: .55; }
      `}</style>

      <div className="hero">
        <h1 className="title">{edition?.title ?? slug}</h1>
        <p className="sub">{c?.heroSubtitle ?? ""}</p>
      </div>

      <div className="grid">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div className="row">
            <a className="btn secondary" href="/">Domov</a>
            <a className="btn secondary" href="/list">Späť na zoznam</a>
          </div>
          <span className="badge">paid: {String(paid)}</span>
        </div>

        {!result ? (
          <div className="card">
            <div className="row">
              <input className="input" placeholder="Meno (voliteľné)" value={name} onChange={(e) => setName(e.target.value)} />
              <input
                className="input"
                placeholder="dd.mm.rrrr alebo YYYY-MM-DD"
                value={birthDate}
                onChange={(e) => setBirthDate(sanitizeBirthDateInput(e.target.value))}
              />
              <button className="btn" onClick={onCompute}>
                Vyhodnotiť
              </button>
            </div>

            {err ? (
              <div style={{ marginTop: 10 }} className="err">
                {err}
              </div>
            ) : null}
          </div>
        ) : null}

        {visible?.categories?.length ? (
          <div className="card">
            <div className="pay">
              <div>
                <div className="sectionTitle">Výsledok</div>
                {!paid ? (
                  <div style={{ opacity: 0.75, fontSize: 13 }}>Zobrazený je len teaser. Zvyšok sa sprístupní po platbe.</div>
                ) : null}
              </div>

              {!paid ? (
                <button className="btn secondary" disabled={payBusy || !normalizeBirthDate(birthDate)} onClick={onCheckout}>
                  {payBusy ? "Presmerovávam..." : "Pokračovať na platbu"}
                </button>
              ) : (
                <div style={{ fontSize: 13, opacity: 0.75 }}>Sprístupnené</div>
              )}
            </div>

            <div style={{ height: 14 }} />

            <div className="grid">
              {visible.categories!.map((cat, ci) => (
                <div className="cat" key={cat.key ?? ci}>
                  <div className="catHead">
                    <h2>{cat.title ?? `Kategória ${ci + 1}`}</h2>
                    <div className="catMeta">
                      {typeof cat.score === "number" ? <span className="pill">Skóre: {cat.score}</span> : null}
                      {bandLabel(cat.band) ? <span className="pill">{bandLabel(cat.band)}</span> : null}
                      {typeof cat.percentile === "number" ? <span className="pill">Percentil: {cat.percentile}</span> : null}
                    </div>
                  </div>

                  {(cat.insight ?? "").trim() ? <p className="catText">{cat.insight}</p> : null}
                  {(cat.recommendation ?? "").trim() && paid ? <p className="catText">{cat.recommendation}</p> : null}

                  <div className="grid">
                    {(cat.items ?? []).map((it, idx) => (
                      <div className="item" key={it.id ?? idx}>
                        <h3>{it.title ?? `Položka ${idx + 1}`}</h3>
                        {typeof it.value === "number" ? <div className="meta">Hodnota: {it.value}</div> : null}
                        {(it.text ?? "").trim() && (it.text ?? "").trim() !== (it.title ?? "").trim() ? <div>{it.text}</div> : null}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card" style={{ opacity: 0.75 }}>
            Výsledok zatiaľ nie je vygenerovaný.
          </div>
        )}
      </div>
    </div>
  );
}
