import fs from "node:fs";
import path from "node:path";

const slug = "plna-test-edicia-001";
const now = new Date().toISOString();

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function variantText(i, band) {
  if (band === "low") return `Nízky signál (${i}). Daj si dnes 1 mikro-krok na 15 minút.`;
  if (band === "mid") return `Stredný signál (${i}). Udrž tempo a pridaj jednu drobnú úpravu.`;
  return `Vysoký signál (${i}). Sprav z toho rutinu, nech to nespadne späť.`;
}

function makeTask(prefix, catTitle, i) {
  const n = String(i).padStart(2, "0");
  return {
    id: `${prefix}_t${n}`,
    title: `${catTitle}: úloha ${n}`,
    metricKey: `${prefix}_m${n}`,
    variants: [
      { when: { lte: 33 }, text: variantText(n, "low") },
      { when: { between: [34, 66] }, text: variantText(n, "mid") },
      { when: { gte: 67 }, text: variantText(n, "high") },
    ],
  };
}

const cats = [
  ["core", "Základ a smer"],
  ["rel", "Vzťahy a komunikácia"],
  ["work", "Práca a peniaze"],
  ["health", "Telo a energia"],
  ["growth", "Rast a disciplína"],
];

const edition = {
  slug,
  title: "Plná testovacia edícia 5×25 (funkčné odomykanie)",
  engine: { subject: "nevedel_full_test", locale: "sk" },
  content: {
    heroTitle: "Plná testovacia edícia",
    heroSubtitle:
      "Táto edícia je urobená na overenie: /e/<slug>, výpočet 5×25 taskov, teaser, Stripe odomykanie.",
    intro: {
      title: "Ako to funguje",
      text: "Zadaj dátum narodenia (a meno ak chceš). Najprv uvidíš teaser. Po platbe sa odomkne celý výstup.",
    },
    form: {
      title: "Vstup",
      nameLabel: "Meno (voliteľné)",
      birthDateLabel: "Dátum narodenia",
      submitLabel: "Vyhodnotiť",
    },
    result: {
      teaserTitle: "Teaser",
      teaserNote: "Bez platby vidíš iba prvú položku. Zvyšok je skrytý.",
      unlockHint: "Odomkni celé výsledky platbou.",
    },
    paywall: {
      headline: "Odomkni plný výstup",
      bullets: ["5 kategórií × 25 vybraných taskov", "Varianty podľa skóre", "Jednorazová platba cez Stripe"],
      cta: "Pokračovať na platbu",
    },
  },
  tasks: {
    pickPerCategory: 25,
    categories: cats.map(([key, title]) => ({
      key,
      title,
      pool: Array.from({ length: 50 }, (_, idx) => makeTask(key, title, idx + 1)),
    })),
  },
  createdAt: now,
};

const editionsDir = path.join(process.cwd(), "apps", "nevedelE", "data", "editions");
ensureDir(editionsDir);

const editionPath = path.join(editionsDir, `${slug}.json`);
fs.writeFileSync(editionPath, JSON.stringify(edition, null, 2), "utf8");

// update index
const indexPath = path.join(process.cwd(), "apps", "nevedelE", "data", "editions.json");
let idx = { editions: [] };

try {
  idx = JSON.parse(fs.readFileSync(indexPath, "utf8"));
} catch {}

idx.editions = Array.isArray(idx.editions) ? idx.editions : [];
idx.editions = idx.editions.filter((e) => e?.slug !== slug);
idx.editions.unshift({ slug, title: edition.title, createdAt: now });

fs.writeFileSync(indexPath, JSON.stringify(idx, null, 2), "utf8");

console.log(`OK: wrote ${editionPath}`);
console.log(`OK: updated ${indexPath}`);
