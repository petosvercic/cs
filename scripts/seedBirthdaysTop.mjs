// scripts/seedBirthdaysTop.mjs
import fs from "fs/promises";

const OUT = new URL("../app/data/famousBirthdays.top.json", import.meta.url);
const STATE = new URL("../app/data/famousBirthdays.top.state.json", import.meta.url);

const TOP_N = 3;              // koľko top osobností na deň
const MIN_SITELINKS = 12;     // minimálny "globálny dosah" (počet wiki jazykov)
const DELAY_MS = 250;         // slušnosť voči API
const RETRIES = 6;            // retry pri výpadku
const YEAR_MIN = 1400;        // nech to nie sú len moderné IG postavičky
const YEAR_MAX = new Date().getFullYear();

const pad2 = (n) => String(n).padStart(2, "0");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function readJsonSafe(url, fallback) {
  try {
    const s = await fs.readFile(url, "utf8");
    return JSON.parse(s);
  } catch {
    return fallback;
  }
}

async function writeJson(url, obj) {
  await fs.mkdir(new URL("../app/data/", import.meta.url), { recursive: true });
  await fs.writeFile(url, JSON.stringify(obj, null, 2), "utf8");
}

function mmddAll2024() {
  // 2024 = leap year -> máme 02-29, výsledok 366 dní
  const out = [];
  for (let m = 1; m <= 12; m++) {
    const dim = new Date(2024, m, 0).getDate();
    for (let d = 1; d <= dim; d++) out.push(`${pad2(m)}-${pad2(d)}`);
  }
  return out;
}

function safeYearFromTime(timeStr) {
  // timeStr vyzerá: "+1998-02-08T00:00:00Z"
  const m = String(timeStr).match(/([+-]\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const y = Number(m[1]);
  if (!Number.isFinite(y)) return null;
  return y;
}

function safePlaceLabel(ent) {
  // placeOfBirthLabel môže byť undefined
  return ent.placeOfBirthLabel?.value ?? null;
}

function safeDesc(ent) {
  // description v sk/en
  return ent.desc?.value ?? null;
}

function safeSitelinks(ent) {
  const v = ent.sitelinks?.value;
  const n = v != null ? Number(v) : 0;
  return Number.isFinite(n) ? n : 0;
}

function shouldSoftDropByDescription(desc) {
  if (!desc) return false;
  const d = desc.toLowerCase();

  // Jemný filter, nech nevymetie všetko:
  // (chceš globálne známe osobnosti, nie roster pre fantasy ligu)
  const badHints = [
    "ice hockey player",
    "canadian ice hockey",
    "american football",
    "football running back",
    "tight end",
    "linebacker",
    "gridiron",
    "professional wrestler",
    "mixed martial",
    "cricketer",
    "darts player",
  ];

  return badHints.some((x) => d.includes(x));
}

async function sparql(query) {
  const url = new URL("https://query.wikidata.org/sparql");
  url.searchParams.set("format", "json");
  url.searchParams.set("query", query);

  const res = await fetch(url, {
    headers: {
      "User-Agent": "coso-nevedel/1.0 (contact: local-script)",
      "Accept": "application/sparql-results+json",
    },
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`SPARQL HTTP ${res.status}: ${t.slice(0, 200)}`);
  }
  return res.json();
}

async function fetchTopForDay(mmdd) {
  const [MM, DD] = mmdd.split("-");

  // Trik: berieme narodeniny bez roku:
  // bday = dátum s hocijakým rokom, filtrujeme iba MONTH/DAY.
  // Zároveň ťaháme sitelinks a popis v sk/en.
  const q = `
SELECT ?person ?personLabel ?time ?placeOfBirthLabel ?desc ?sitelinks WHERE {
  ?person wdt:P31 wd:Q5;              # human
          p:P569 ?bdayStmt.
  ?bdayStmt ps:P569 ?time.

  FILTER(MONTH(?time) = ${Number(MM)} && DAY(?time) = ${Number(DD)})

  OPTIONAL { ?person wdt:P19 ?placeOfBirth. }
  OPTIONAL { ?person schema:description ?desc .
             FILTER(LANG(?desc) IN ("sk","en")) }

  # počet Wikipédií, kde má článok:
  OPTIONAL {
    ?article schema:about ?person;
             schema:isPartOf ?wiki.
    FILTER(CONTAINS(STR(?wiki), "wikipedia.org"))
  }
}
GROUP BY ?person ?personLabel ?time ?placeOfBirthLabel ?desc
BIND(COUNT(?article) AS ?sitelinks)
ORDER BY DESC(?sitelinks)
LIMIT 80
`;

  const json = await sparql(q);
  const rows = json?.results?.bindings ?? [];

  // pretransformuj, pridaj rok, filter a vyber TOP
  const cooked = [];
  for (const r of rows) {
    const name = r.personLabel?.value ?? null;
    const time = r.time?.value ?? null;
    const year = time ? safeYearFromTime(time) : null;
    const place = safePlaceLabel(r);
    const desc = safeDesc(r);
    const sitelinks = safeSitelinks(r);

    if (!name || year == null) continue;
    if (year < YEAR_MIN || year > YEAR_MAX) continue;
    if (sitelinks < MIN_SITELINKS) continue;

    // jemný filter cez popis (len ak existuje)
    if (shouldSoftDropByDescription(desc)) continue;

    cooked.push({ name, year, place, desc, sitelinks });
  }

  // TOP N podľa sitelinks, deterministic
  cooked.sort((a, b) => b.sitelinks - a.sitelinks || a.name.localeCompare(b.name));

  // vyhoď sitelinks (nech to nemáš v appke), desc necháme ako "čo je to za človeka"
  return cooked.slice(0, TOP_N).map(({ name, year, place, desc }) => ({
    name,
    year,
    place: place ?? null,
    what: desc ?? null,
  }));
}

async function withRetry(fn, label) {
  let lastErr = null;
  for (let i = 0; i < RETRIES; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const wait = 500 + i * 700;
      console.log(`WARN ${label}: ${String(e.message || e)} | retry za ${wait}ms`);
      await sleep(wait);
    }
  }
  throw lastErr;
}

async function main() {
  const state = await readJsonSafe(STATE, { index: 0 });
  const out = await readJsonSafe(OUT, {});
  const days = mmddAll2024();

  console.log(`Seed TOP birthdays -> ${OUT.pathname}`);
  console.log(`Už mám hotových dní: ${Object.keys(out).length} / ${days.length}`);
  console.log(`Pokračujem od indexu: ${state.index}`);

  for (let i = state.index; i < days.length; i++) {
    const day = days[i];

    // ak už existuje (a nie je prázdny), preskoč
    if (Array.isArray(out[day]) && out[day].length >= 1) {
      console.log(`SKIP ${day} -> už vybrané ${out[day].length}`);
      state.index = i + 1;
      await writeJson(STATE, state);
      continue;
    }

    const list = await withRetry(() => fetchTopForDay(day), `day ${day}`);
    out[day] = list;

    console.log(`OK ${day} -> ${list.length} top`);
    state.index = i + 1;

    // priebežne ukladaj, aby si mohol hocikedy stopnúť
    await writeJson(OUT, out);
    await writeJson(STATE, state);

    await sleep(DELAY_MS);
  }

  console.log(`Hotovo. Uložené dni: ${Object.keys(out).length}`);
  console.log(`Výstup: app/data/famousBirthdays.top.json`);
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
