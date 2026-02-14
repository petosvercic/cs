"use client";

import { useEffect, useMemo, useState } from "react";
import { analogies } from "./data/analogies";
import { notes } from "./data/notes";
import { paywallCopy } from "./data/paywallCopy";
import { buildFactBlocks } from "./lib/factLogic";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function mmdd(date: Date) {
  return `${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function parseISODate(iso: string): Date | null {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return dt;
}

function daysAlive(birth: Date, now = new Date()) {
  const ms = 24 * 60 * 60 * 1000;
  const b = Date.UTC(birth.getFullYear(), birth.getMonth(), birth.getDate());
  const n = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.floor((n - b) / ms));
}

function getAge(birth: Date, now = new Date()) {
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function daysUntilNextBirthday(birth: Date, now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisYear = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
  const target = thisYear >= today ? thisYear : new Date(now.getFullYear() + 1, birth.getMonth(), birth.getDate());
  const ms = 24 * 60 * 60 * 1000;
  const a = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const b = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.max(0, Math.floor((b - a) / ms));
}

function westernZodiac(date: Date) {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  if ((m === 1 && d >= 20) || (m === 2 && d <= 18)) return "Vodnár";
  if ((m === 2 && d >= 19) || (m === 3 && d <= 20)) return "Ryby";
  if ((m === 3 && d >= 21) || (m === 4 && d <= 19)) return "Baran";
  if ((m === 4 && d >= 20) || (m === 5 && d <= 20)) return "Býk";
  if ((m === 5 && d >= 21) || (m === 6 && d <= 20)) return "Blíženci";
  if ((m === 6 && d >= 21) || (m === 7 && d <= 22)) return "Rak";
  if ((m === 7 && d >= 23) || (m === 8 && d <= 22)) return "Lev";
  if ((m === 8 && d >= 23) || (m === 9 && d <= 22)) return "Panna";
  if ((m === 9 && d >= 23) || (m === 10 && d <= 22)) return "Váhy";
  if ((m === 10 && d >= 23) || (m === 11 && d <= 21)) return "Škorpión";
  if ((m === 11 && d >= 22) || (m === 12 && d <= 21)) return "Strelec";
  return "Kozorožec";
}

function chineseZodiac(year: number) {
  const animals = ["Potkan", "Byvol", "Tiger", "Zajac", "Drak", "Had", "Kôň", "Koza", "Opica", "Kohút", "Pes", "Prasa"];
  const idx = ((year - 2008) % 12 + 12) % 12;
  return animals[idx];
}

function hashString(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick<T>(arr: readonly T[], seed: string) {
  const idx = hashString(seed) % arr.length;
  return arr[idx];
}

function makeResultId(name: string, birthISO: string) {
  return String(hashString(`${name.trim().toLowerCase()}|${birthISO}`));
}

async function shareResult(payload: { title: string; text: string; url: string }) {
  const { title, text, url } = payload;

  if (typeof navigator !== "undefined" && (navigator as any).share) {
    try {
      await (navigator as any).share({ title, text, url });
      return { ok: true as const, mode: "native" as const };
    } catch {
      return { ok: false as const };
    }
  }

  try {
    await navigator.clipboard.writeText(`${text}\n${url}`);
    return { ok: true as const, mode: "clipboard" as const };
  } catch {
    return { ok: false as const };
  }
}

function zodiacVibe(z: string, seed: string) {
  const raw = pick(notes.westernZodiac, `${seed}|west|${z}`);
  const cleaned = raw.replace(/\{zodiac\}\s*:\s*/gi, "").replace(/^\s*[^:]{2,20}:\s*/, "").trim();
  return `Narodil si sa v znamení ${z}. ${cleaned}`;
}

function birthdayCountdownLine(toNext: number, seed: string) {
  const variants = [
    `{n} dní do narodenín. Zvláštne, ako rýchlo sa z “raz” stane “už zase”.`,
    `{n} dní do narodenín. Čas beží. Ty sa tváriš, že nie.`,
    `{n} dní do narodenín. Ešte dosť času na plán. Aj na výhovorky.`,
    `{n} dní do narodenín. Je to bližšie, než si pripúšťaš.`,
  ];
  return pick(variants, seed).replace("{n}", String(toNext));
}

function aliveLine(days: number, seed: string) {
  const base = pick(notes.daysAlive, seed).replace("{days}", String(days));
  const a = pick(analogies, `${seed}|an`).text.replace("{days}", String(days));
  return hashString(seed) % 2 === 0 ? base : a;
}

function chineseZodiacLine(cz: string, year: number, seed: string) {
  const dict = notes.chineseZodiacByAnimal as Record<string, readonly string[]>;
  const list = dict?.[cz];
  const base = list?.length ? pick(list, `${seed}|cz|${cz}`) : "Má to zvláštny tvar. A niekedy to sedí až nepríjemne.";
  return `V čínskom znamení si sa narodil v roku ${cz} (${year}). ${base}`;
}

async function postTelemetry(payload: any) {
  try {
    await fetch("/api/telemetry", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {}
}

/**
 * Minimal token filler (kým engine nepripojíme).
 * - deterministicky dopĺňa {token} z malých slovníkov
 * - ak token nepozná, nechá niečo všeobecné
 */
function fillTemplate(template: string, seed: string) {
  const pools: Record<string, readonly string[]> = {
    polarity: ["pokojné", "ostrý", "premyslené", "intuítívne", "pragmatické"],
    delay: ["chvíľu ticha", "krátke preverenie", "jeden vnútorný checkpoint", "pauzu na zmysel"],
    tool: ["pomôcku", "poistku", "mentálny poriadok", "záchrannú brzdu"],
    disturbance: ["nejasné pravidlá", "lacné emócie", "tiché manipulácie", "chaotické zadania"],
    sensitiveArea: ["dôveru", "rešpekt", "čas", "slobodu", "princíp"],
    preference: ["stabilitu", "zmenu", "kombináciu oboch"],
    condition: ["kontroly", "zmyslu", "férovosti", "voľnosti"],
    mode: ["v hlave", "na papieri", "cez rozhovor", "cez malé testy"],
    missingInfo: ["dáta", "čas", "kontext", "spätnú väzbu"],
    anchor: ["jednu pevnú vec", "najbližší krok", "jednu metriku", "realitu"],
    selfMetric: ["konzistencie", "výsledku", "čistoty rozhodnutí", "dopadu"],
    conflictA: ["slobodou", "pohodlím", "pokojom", "istotou"],
    conflictB: ["istotou", "výkonom", "pravdou", "vzťahom"],
    energySource: ["ticha", "zmysluplnej práce", "dobrej debaty", "samoty"],
    distractionType: ["urgentné", "hlasné", "nepodstatné"],
    function: ["navigáciu", "kalibráciu", "filter", "kompas"],
    timeView: ["tok", "sériu okien", "prioritný zoznam"],
    priorityRule: ["dopadu", "zmyslu", "návratnosti", "vnútorného pokoja"],
    reserveFor: ["ťažké rozhodnutia", "ľudí, na ktorých záleží", "kľúčové projekty"],
    confidenceTrigger: ["jasného progresu", "dôkazov", "dobrého feedbacku"],
    coreValue: ["pravdivosť", "férovosť", "slobodu", "zmysel", "autentickosť"],
    clarity: ["čo sa robí", "čo je cieľ", "čo je dôležité", "čo je výsledok"],
    meaning: ["zmysel", "dopad", "reálnu hodnotu", "výsledok"],
    pace: ["po svojom", "v blokoch", "v špičkách", "konzistentne"],
    focusPoint: ["najbližší krok", "najtvrdší fakt", "jednu vec", "dôsledok"],
    deadlineType: ["realistické", "jasné", "nefalošné", "dohodnuté"],
    autonomyArea: ["postupe", "prioritách", "detailoch", "rytme"],
    feedbackStyle: ["konkrétna", "férová", "vecná", "bez teatrálnosti"],
    motivationType: ["zmysel", "výzva", "sloboda", "progres"],
    drainActivity: ["nezmyselným tlakom", "neustálym hasením", "mikromanažmentom", "chaosom"],
    responsibilityTarget: ["ľudí", "výsledok", "dôveru", "kvalitu"],
    efficiencyView: ["čistotu postupu", "zníženie hluku", "zisk času", "lepší výstup"],
    orderForm: ["systém", "zoznam", "štruktúru", "jedno pravidlo"],
    collaborationTrait: ["sú vecní", "majú ťah", "nekrútia", "držia slovo"],
    decisionBase: ["dopadu", "dát", "skúsenosti", "najmenšieho rizika"],
    riskJustification: ["dobrý pomer", "zmysel", "silný dôvod", "kontrolu"],
    routineBenefit: ["pokoj", "čas", "istotu", "kvalitu"],
    errorView: ["dáta", "lekciu", "opravu", "smerovník"],
    limitFactor: ["spánok", "kľud", "čas", "zmysel"],
    impactArea: ["ľudí", "výsledok", "kvalitu", "budúcnosť"],
  };

  const fallback = ["niečo konkrétne", "realitu", "poriadok", "pokoj", "zmysel"];
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_m, key: string) => {
    const arr = pools[key] || fallback;
    return pick(arr, `${seed}|tok|${key}`);
  });
}

// ----- Edition pack types (minimal) -----
type EditionConfig = {
  paywall?: { teaserPerCategory?: number };
  pricing?: { amountCents?: number; currency?: string; stripePriceId?: string };
};

type PackItem = { id: string; title: string; template: string };
type PackCategory = { id: string; title: string; intro: string; lockedIntro: string; items: PackItem[] };
type ContentPack = {
  uiCopy?: {
    heroTitle?: string;
    heroSubtitle?: string;
    unlockCta?: string;
  };
  categories?: PackCategory[];
};

type PackBlock = {
  section: string;
  heading: string;
  intro?: string;
  lockedIntro?: string;
  rows: { id: string; title: string; value: string; canShow: boolean }[];
};

const LS_LAST = "coso:lastInput:v1";
const LS_PAID_RID = "coso:paidRid:v1";

export default function Home() {
  const [name, setName] = useState("");
  const [birthISO, setBirthISO] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const [paywallOpen, setPaywallOpen] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  // Edition content (from coso-sites)
  const [editionSlug] = useState("nevedel");
  const [editionConfig, setEditionConfig] = useState<EditionConfig | null>(null);
  const [pack, setPack] = useState<ContentPack | null>(null);
  const [packError, setPackError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_LAST);
      if (!raw) return;
      const obj = JSON.parse(raw) as { name?: string; birthISO?: string; submitted?: boolean };
      if (typeof obj.name === "string") setName(obj.name);
      if (typeof obj.birthISO === "string") setBirthISO(obj.birthISO);
      if (obj.submitted) setSubmitted(true);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_LAST, JSON.stringify({ name, birthISO, submitted }));
    } catch {}
  }, [name, birthISO, submitted]);

  // Load edition pack/config
  useEffect(() => {
    fetch(`/api/edition/${encodeURIComponent(editionSlug)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d?.ok) throw new Error(d?.error || "Edition load failed");
        setEditionConfig(d?.config || null);
        setPack(d?.pack || null);
        setPackError(null);
      })
      .catch((e) => {
        setPackError(e?.message || "Edition load failed");
        setEditionConfig(null);
        setPack(null);
      });
  }, [editionSlug]);

  const computed = useMemo(() => {
    if (!submitted) return null;

    const cleanName = name.trim();
    const birth = parseISODate(birthISO);
    if (!cleanName || !birth) return { error: "Zadaj meno aj dátum (cez kalendárik)." as const };

    const key = mmdd(birth);
    const zodiac = westernZodiac(birth);
    const cz = chineseZodiac(birth.getFullYear());

    const alive = daysAlive(birth);
    const age = getAge(birth);
    const toNext = daysUntilNextBirthday(birth);

    const resultId = makeResultId(cleanName, birthISO);

    const vibe = zodiacVibe(zodiac, `${key}|${cleanName}`);
    const bday = birthdayCountdownLine(toNext, `${key}|bd|${cleanName}`);
    const aliveTxt = aliveLine(alive, `${key}|alive|${cleanName}`);
    const czTxt = chineseZodiacLine(cz, birth.getFullYear(), `${key}|cz|${cleanName}`);

    const postPaidFooter = pick(paywallCopy.postPaidFooterPool, `${resultId}|postpaidfooter`);

    const teaserPerCategory = Number(editionConfig?.paywall?.teaserPerCategory ?? 3) || 3;

    let blocks: PackBlock[] | null = null;

    if (pack?.categories?.length) {
      blocks = pack.categories.map((c) => ({
        section: c.id,
        heading: c.title,
        intro: c.intro,
        lockedIntro: c.lockedIntro,
        rows: (c.items || []).map((it, idx) => {
          const canShow = isPaid || idx < teaserPerCategory;
          const value = canShow ? fillTemplate(it.template, `${resultId}|${c.id}|${it.id}`) : "— — —";
          return { id: it.id, title: it.title, value, canShow };
        }),
      }));
    }

    const factBlocksFallback =
      !blocks
        ? buildFactBlocks({
            name: cleanName,
            dobISO: birthISO,
            rid: resultId,
            daysAlive: alive,
            isPaid,
            rowsCore: { min: 5, max: 7 },
            rowsExtra: { min: 4, max: 6 },
          })
        : null;

    return {
      cleanName,
      birthISO,
      resultId,
      zodiac,
      cz,
      alive,
      age,
      toNext,
      vibe,
      bday,
      aliveTxt,
      czTxt,
      postPaidFooter,
      teaserPerCategory,
      blocks,
      factBlocksFallback,
    };
  }, [submitted, name, birthISO, isPaid, pack, editionConfig]);

  const canSubmit = name.trim().length > 0 && !!parseISODate(birthISO);

  useEffect(() => {
    if (!submitted) return;
    if (!computed || "error" in computed) return;

    try {
      const paidRid = localStorage.getItem(LS_PAID_RID);
      setIsPaid(paidRid === computed.resultId);
    } catch {
      setIsPaid(false);
    }
  }, [submitted, computed?.resultId]);

  useEffect(() => {
    if (!submitted) return;
    if (!computed || "error" in computed) return;

    const payload = {
      type: "submit",
      at: new Date().toISOString(),
      rid: computed.resultId,
      dobISO: computed.birthISO,
      nameHash: String(hashString(computed.cleanName.toLowerCase())),
      nameLen: computed.cleanName.length,
      zodiac: computed.zodiac,
      cz: computed.cz,
      age: computed.age,
      daysAlive: computed.alive,
      mode: computed.blocks ? "pack" : "legacy",
    };

    postTelemetry(payload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted, computed?.resultId]);

  useEffect(() => {
    if (!submitted) return;
    if (!computed || "error" in computed) return;

    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    if (!sessionId) return;

    setVerifying(true);
    fetch("/api/stripe/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.paid) {
          const paidResultId = typeof data?.resultId === "string" ? data.resultId : computed.resultId;
          try {
            localStorage.setItem(LS_PAID_RID, paidResultId);
          } catch {}
          setIsPaid(paidResultId === computed.resultId);
          setPaywallOpen(false);

          postTelemetry({ type: "paid", at: new Date().toISOString(), rid: paidResultId, sessionId });
        }

        const url = new URL(window.location.href);
        url.searchParams.delete("session_id");
        url.searchParams.delete("rid");
        window.history.replaceState({}, "", url.toString());
      })
      .finally(() => setVerifying(false));
  }, [submitted, computed]);

  async function startCheckout(resultId: string) {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ resultId }),
    });
    const data = await res.json();
    if (data?.url) window.location.href = data.url;
  }

  const heroTitle = pack?.uiCopy?.heroTitle || "Čo si o sebe určite nevedel";
  const heroSubtitle = pack?.uiCopy?.heroSubtitle || "Toto nie je test. Je to zrkadlo.";

  const priceCents = editionConfig?.pricing?.amountCents ?? 299;
  const currency = (editionConfig?.pricing?.currency || "EUR").toUpperCase();
  const priceStr = `${(priceCents / 100).toFixed(2)} ${currency}`;

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl rounded-2xl bg-neutral-900 p-6 border border-neutral-800 shadow-xl">
        <h1 className="text-2xl font-semibold">{heroTitle}</h1>
        <p className="text-neutral-300 mt-2 text-sm">{heroSubtitle}</p>

        {packError && <div className="mt-3 text-xs text-red-300">Edícia sa nenačítala: {packError}</div>}

        {!submitted && (
          <div className="mt-6 space-y-3">
            <input
              placeholder="Meno"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl bg-neutral-950 border border-neutral-800 px-3 py-2 outline-none focus:border-neutral-600"
            />
            <input
              type="date"
              value={birthISO}
              onChange={(e) => setBirthISO(e.target.value)}
              className="w-full rounded-xl bg-neutral-950 border border-neutral-800 px-3 py-2 outline-none focus:border-neutral-600"
            />
            <button
              onClick={() => setSubmitted(true)}
              disabled={!canSubmit}
              className="w-full rounded-xl bg-neutral-100 text-neutral-950 py-2 font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Vyhodnotiť
            </button>
          </div>
        )}

        {submitted && computed && "error" in computed && (
          <div className="mt-6 text-sm text-red-300">
            {computed.error}
            <div className="mt-3">
              <button
                onClick={() => {
                  setSubmitted(false);
                  setPaywallOpen(false);
                  setIsPaid(false);
                }}
                className="underline"
              >
                Späť
              </button>
            </div>
          </div>
        )}

        {submitted && computed && !("error" in computed) && (
          <div className="mt-6 space-y-5">
            <section className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-4">
              <h2 className="font-semibold">Asi o sebe už vieš:</h2>
              <div className="mt-2 text-sm text-neutral-200 space-y-2">
                <div className="text-neutral-300">{computed.vibe}</div>
                <div className="text-neutral-300">{computed.bday}</div>
              </div>
            </section>

            <section className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-4">
              <h2 className="font-semibold">Ale možno netušíš že:</h2>
              <div className="mt-2 text-sm text-neutral-200 space-y-2">
                <div className="text-neutral-300">{computed.czTxt}</div>
                <div className="text-neutral-300">Na svete si približne {computed.alive} dní.</div>
                <div className="text-neutral-300">{computed.aliveTxt}</div>
              </div>
            </section>

            <section className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-4">
              <h2 className="font-semibold">Ďalšie veci sú len odhady. Zvláštne je, ako často sedia:</h2>

              {/* PACK-DRIVEN MODE */}
              {computed.blocks && (
                <div className="mt-4 space-y-6">
                  {computed.blocks.map((block) => (
                    <div key={block.section}>
                      <div className="text-neutral-400 text-sm mb-2">{block.heading}</div>
                      {block.intro && <div className="text-xs text-neutral-500 mb-3">{block.intro}</div>}

                      <div className="space-y-2">
                        {block.rows.map((row) => {
                          const canShow = row.canShow;
                          const valueText = row.value;

                          return (
                            <div
                              key={row.id}
                              className="rounded bg-neutral-950/50 border border-neutral-800 px-3 py-2 text-neutral-200 text-sm"
                            >
                              <div className="text-neutral-300">{row.title}</div>

                              <div
                                className={
                                  canShow
                                    ? "text-neutral-100 font-semibold mt-1"
                                    : "text-neutral-100 font-semibold mt-1 blur-[1.8px] select-none"
                                }
                              >
                                {valueText}
                              </div>

                              {!canShow && (
                                <div className="text-neutral-400 mt-1 blur-[1.6px] select-none">
                                  Odomkne sa po pokračovaní.
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* LEGACY FALLBACK MODE */}
              {!computed.blocks && computed.factBlocksFallback && (
                <div className="mt-4 space-y-6">
                  {computed.factBlocksFallback.map((block) => (
                    <div key={block.section}>
                      <div className="text-neutral-400 text-sm mb-2">{block.heading}</div>

                      <div className="space-y-2">
                        {block.rows.map((row) => {
                          const canShow = isPaid;
                          const valueText = canShow ? row.value : "— — —";
                          const noteText = row.note ? (canShow ? row.note : "Odomkne sa po pokračovaní.") : undefined;

                          return (
                            <div
                              key={row.id}
                              className="rounded bg-neutral-950/50 border border-neutral-800 px-3 py-2 text-neutral-200 text-sm"
                            >
                              <div className="text-neutral-300">{row.title}</div>

                              <div
                                className={
                                  canShow
                                    ? "text-neutral-100 font-semibold mt-1"
                                    : "text-neutral-100 font-semibold mt-1 blur-[1.8px] select-none"
                                }
                              >
                                {valueText}
                              </div>

                              {noteText && (
                                <div
                                  className={
                                    canShow ? "text-neutral-400 mt-1" : "text-neutral-400 mt-1 blur-[1.6px] select-none"
                                  }
                                >
                                  {noteText}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {isPaid && (
                <div className="mt-6 rounded-xl border border-neutral-800 bg-neutral-950/40 p-4">
                  <div className="text-lg font-semibold">{paywallCopy.postPaidTitle}</div>
                  <div className="mt-2 text-sm text-neutral-200 space-y-1">
                    {paywallCopy.postPaidIntro.map((l, i) => (
                      <div key={i} className="text-neutral-300">
                        {l}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-neutral-300 italic">{computed.postPaidFooter}</div>
                </div>
              )}

              <div className="mt-5 flex items-center justify-between text-sm text-neutral-300">
                <div>
                  <span className="text-neutral-500">Vek:</span> {computed.age} rokov ·{" "}
                  <span className="text-neutral-500">Do narodenín:</span> {computed.toNext} dní
                </div>

                <div className="flex items-center gap-4">
                  {isPaid && (
                    <button
                      className="underline"
                      onClick={async () => {
                        const url = `${window.location.origin}/?rid=${encodeURIComponent(computed.resultId)}`;
                        const r = await shareResult({
                          title: heroTitle,
                          text: `${computed.cleanName}: teraz už vidíš celý obraz. Skús si to.`,
                          url,
                        });

                        if (r.ok) {
                          setShareMsg(r.mode === "clipboard" ? "Skopírované do schránky." : "Otvorené zdieľanie.");
                          setTimeout(() => setShareMsg(null), 1800);
                        } else {
                          setShareMsg("Zdieľanie sa nepodarilo.");
                          setTimeout(() => setShareMsg(null), 1800);
                        }
                      }}
                    >
                      Zdieľať
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setPaywallOpen(false);
                      setIsPaid(false);
                    }}
                    className="underline"
                  >
                    Skúsiť znova
                  </button>
                </div>
              </div>

              {shareMsg && <div className="mt-2 text-xs text-neutral-400">{shareMsg}</div>}
              {verifying && <div className="mt-3 text-xs text-neutral-400">Overujem platbu…</div>}

              {!isPaid && (
                <div className="mt-4">
                  <button
                    className="w-full rounded-xl bg-neutral-100 text-neutral-950 py-2 font-semibold"
                    onClick={() => setPaywallOpen(true)}
                  >
                    {pack?.uiCopy?.unlockCta || "Pokračovať"}
                  </button>
                  <div className="text-xs text-neutral-400 mt-2">
                    Odomkne sa všetko. A pribudnú aj vrstvy, ktoré sa bez toho ani neoplatí pozerať.
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {paywallOpen && computed && !("error" in computed) && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-6">
          <div className="w-full max-w-xl rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="text-xl font-semibold">{paywallCopy.title}</div>
              <button
                className="text-neutral-400 hover:text-neutral-200"
                onClick={() => setPaywallOpen(false)}
                aria-label="Zavrieť"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 text-sm text-neutral-200 space-y-1">
              {paywallCopy.intro.map((l, i) => (
                <div key={i} className="text-neutral-300">
                  {l}
                </div>
              ))}
            </div>

            <div className="mt-4 text-sm text-neutral-200">
              <div className="font-semibold text-neutral-200">{paywallCopy.unlockTitle}</div>
              <ul className="mt-2 list-disc list-inside space-y-1 text-neutral-300">
                {paywallCopy.unlockBullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>

            <div className="mt-4 text-sm text-neutral-200">
              <div className="font-semibold text-neutral-200">{paywallCopy.sharingTitle}</div>
              <div className="mt-2 space-y-1 text-neutral-300">
                {paywallCopy.sharingText.map((l, i) => (
                  <div key={i}>{l}</div>
                ))}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between text-sm">
              <div className="text-neutral-400">Cena:</div>
              <div className="text-neutral-100 font-semibold">{priceStr}</div>
            </div>

            <div className="mt-5 text-sm text-neutral-200 font-semibold">{paywallCopy.howToContinue}</div>

            <button
              className="mt-3 w-full rounded-xl bg-neutral-100 text-neutral-950 py-2 font-semibold"
              onClick={() => startCheckout(computed.resultId)}
            >
              {paywallCopy.fastPayBtn}
            </button>

            {/* SMS / alternative (len UI – logiku dopojíš neskôr) */}
            <div className="mt-3 rounded-xl border border-neutral-800 bg-neutral-950/40 p-4">
              <div className="text-sm font-semibold text-neutral-200">{paywallCopy.smsTitle || "SMS (alternatíva)"}</div>
              <div className="mt-2 text-xs text-neutral-400">
                {paywallCopy.smsText?.join(" ") ||
                  "Ak chceš SMS flow, dopojíme ho ako samostatný provider. Teraz je tu len jasný placeholder, aby UI sedelo."}
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                className="w-full rounded-xl border border-neutral-700 bg-transparent text-neutral-200 py-2 font-semibold"
                onClick={() => setPaywallOpen(false)}
              >
                Zatvoriť
              </button>
            </div>

            <div className="mt-3 text-[11px] text-neutral-500">
              Tip: po zaplatení sa ukladá odomknutie lokálne (rid). Neskôr to spravíme cez server-side token/certifikát.
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
