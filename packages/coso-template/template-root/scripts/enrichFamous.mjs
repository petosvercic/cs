import fs from "fs/promises";

const DATA_PATH = new URL("../app/data/famousBirthdays.json", import.meta.url);
const CACHE_PATH = new URL("./enrichCache.json", import.meta.url);

const SLEEP_MS = 250;          // jemné tempo
const RETRIES = 4;             // sieť občas umiera
const RETRY_BASE_MS = 600;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson(url, retries = RETRIES) {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          "user-agent": "coso-nevedel/1.0 (enrich script)",
          "accept": "application/json",
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      return await res.json();
    } catch (e) {
      lastErr = e;
      const wait = RETRY_BASE_MS * Math.pow(1.6, i);
      await sleep(wait);
    }
  }
  throw lastErr;
}

function cleanName(raw) {
  if (!raw) return "";
  // odstráň všetko za prvou čiarkou: "Khaby Lame, ..." -> "Khaby Lame"
  let s = String(raw).trim().split(",")[0].trim();
  // odstráň extra whitespace
  s = s.replace(/\s+/g, " ");
  // odstráň trailing role typu " (footballer)" ak by to robilo bordel
  s = s.replace(/\s+\(([^)]+)\)\s*$/, (m) => m); // necháme to, často pomáha disambiguácia
  return s;
}

function uniqKey(name) {
  return cleanName(name).toLowerCase();
}

async function loadJson(pathUrl, fallback) {
  try {
    return JSON.parse(await fs.readFile(pathUrl, "utf8"));
  } catch {
    return fallback;
  }
}

function pickSkOrEn(obj) {
  // obj: { sk: { value }, en: { value } }
  if (obj?.sk?.value) return obj.sk.value;
  if (obj?.en?.value) return obj.en.value;
  return null;
}

function getClaimIds(entity, prop) {
  const c = entity?.claims?.[prop];
  if (!Array.isArray(c)) return [];
  const out = [];
  for (const snak of c) {
    const id = snak?.mainsnak?.datavalue?.value?.id;
    if (id) out.push(id);
  }
  return out;
}

async function wikidataSearch(name) {
  const q = encodeURIComponent(name);
  const url =
    `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${q}` +
    `&language=en&format=json&limit=1&origin=*`;
  const data = await fetchJson(url);
  const hit = data?.search?.[0];
  return hit?.id || null;
}

async function wikidataGetEntity(id) {
  const url =
    `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${id}` +
    `&props=labels|descriptions|claims&languages=sk|en&format=json&origin=*`;
  const data = await fetchJson(url);
  return data?.entities?.[id] || null;
}

async function wikidataGetLabels(ids) {
  if (!ids.length) return {};
  const chunk = ids.slice(0, 20).join("|");
  const url =
    `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${chunk}` +
    `&props=labels&languages=sk|en&format=json&origin=*`;
  const data = await fetchJson(url);
  return data?.entities || {};
}

async function enrichOne(rawName, cache) {
  const name = cleanName(rawName);
  if (!name) return { ok: false, reason: "empty" };

  const key = uniqKey(name);
  if (cache[key]) return { ok: true, cached: true, value: cache[key] };

  // 1) nájdi entitu
  const qid = await wikidataSearch(name);
  if (!qid) return { ok: false, reason: "no-qid" };

  // 2) stiahni entity data
  const ent = await wikidataGetEntity(qid);
  if (!ent) return { ok: false, reason: "no-entity" };

  const desc = pickSkOrEn(ent.descriptions) || null;

  // 3) occupation (P106) – vezmeme prvé 1-2
  const occIds = getClaimIds(ent, "P106").slice(0, 2);
  const occEntities = await wikidataGetLabels(occIds);
  const occLabels = occIds
    .map((id) => pickSkOrEn(occEntities?.[id]?.labels))
    .filter(Boolean);

  // 4) výsledná “note”
  let note = null;
  if (occLabels.length) {
    // skôr chceme “herec / spevák / …”
    note = occLabels.join(", ");
  } else if (desc) {
    // fallback
    note = desc;
  }

  // normalizuj note (krátko)
  if (note) {
    note = String(note)
      .replace(/\s+/g, " ")
      .trim();
    // odrež extrémne dlhé popisy
    if (note.length > 80) note = note.slice(0, 77) + "...";
  }

  if (!note) return { ok: false, reason: "no-note" };

  cache[key] = note;
  return { ok: true, cached: false, value: note };
}

async function main() {
  const data = await loadJson(DATA_PATH, {});
  const cache = await loadJson(CACHE_PATH, {});

  const keys = Object.keys(data).sort(); // celé, žiadne slice
  let totalPersons = 0;
  let updated = 0;

  console.log(`Enrichujem famousBirthdays.json (dni: ${keys.length})`);

  for (const dayKey of keys) {
    const arr = Array.isArray(data[dayKey]) ? data[dayKey] : [];
    for (let i = 0; i < arr.length; i++) {
      const item = arr[i];
      totalPersons++;

      // očakávame objekt {name, year, place, note?}
      // ak je to string, sprav z toho objekt
      if (typeof item === "string") {
        arr[i] = { name: item, year: 0, place: null, note: null };
      }

      const entry = arr[i];
      if (!entry || typeof entry !== "object") continue;
      if (!entry.name) continue;

      // už má note?
      if (entry.note && String(entry.note).trim().length >= 3) continue;

      const clean = cleanName(entry.name);
      try {
        const r = await enrichOne(clean, cache);
        if (r.ok) {
          entry.note = r.value;
          updated++;
          console.log(`OK ${dayKey} -> ${clean} :: ${entry.note}${r.cached ? " (cache)" : ""}`);
        } else {
          console.log(`MISS ${dayKey} -> ${clean} (${r.reason})`);
        }
      } catch (e) {
        console.log(`ERR ${dayKey} -> ${clean} (${e?.message || e})`);
      }

      // priebežne ukladaj, keď to niekto zabije Ctrl+C
      if (updated % 25 === 0) {
        await fs.writeFile(CACHE_PATH, JSON.stringify(cache, null, 2), "utf8");
        await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), "utf8");
      }

      await sleep(SLEEP_MS);
    }
  }

  await fs.writeFile(CACHE_PATH, JSON.stringify(cache, null, 2), "utf8");
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), "utf8");

  console.log(`Done. total persons: ${totalPersons}, updated: ${updated}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
