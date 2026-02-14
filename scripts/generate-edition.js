#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");

const CATEGORIES = [
  { key: "spanok", title: "Spánok a večerné vypnutie", prefix: "s" },
  { key: "mikropauzy", title: "Mikropauzy počas dňa", prefix: "m" },
  { key: "nervovy-system", title: "Regenerácia nervového systému", prefix: "n" },
  { key: "mentalna-hygiena", title: "Mentálna hygiena a ticho", prefix: "h" },
  { key: "stabilizacia-energie", title: "Stabilizácia energie", prefix: "e" },
];

const content = {
  heroTitle: "Mikro rytmy regenerácie",
  heroSubtitle: "Denný plán pre pokojný nervový systém a stabilnú energiu",
  intro: {
    title: "Úvod",
    text: "Táto edícia prepája spánok, krátke šlofíky, NSDR, ticho, zavreté oči a mikropauzy do praktického denného režimu.",
  },
  form: {
    title: "Vyhodnotenie",
    nameLabel: "Meno",
    birthDateLabel: "Dátum narodenia",
    submitLabel: "Vyhodnotiť",
  },
  result: {
    teaserTitle: "Náhľad",
    teaserNote: "Vidíš iba časť odporúčaní pre svoje denné rytmy.",
    unlockHint: "Odomkni plný plán pre stabilnú energiu a regeneráciu.",
  },
  paywall: {
    headline: "Odomkni celý plán mikro rytmov regenerácie",
    bullets: [
      "50 taskov v každej kategórii",
      "Presné varianty podľa intenzity",
      "Konzistentný systém pre pokoj a výkon",
    ],
    cta: "Odomknúť plnú edíciu",
  },
};

function buildTask(cat, taskIndex) {
  const idx = taskIndex + 1;
  const id = `${cat.prefix}${String(idx).padStart(2, "0")}`;
  const metricKey = `${cat.key.replace(/-/g, "_")}_${String(idx).padStart(2, "0")}`;
  const title = `${cat.title} — krok ${idx}`;

  return {
    id,
    title,
    metricKey,
    variants: [
      {
        when: { lte: 33 },
        text: `Keď je skóre nízke, urob v téme ${cat.title.toLowerCase()} iba základný krok ${idx}: dve minúty vedomého dychu so zavretými očami a bez obrazoviek.`,
      },
      {
        when: { between: [34, 66] },
        text: `Pri strednom skóre zaraď v téme ${cat.title.toLowerCase()} krok ${idx} v trvaní osem minút: krátky power nap alebo NSDR s tichom a pomalým návratom do práce.`,
      },
      {
        when: { gte: 67 },
        text: `Pri vysokom skóre vykonaj rozšírený krok ${idx} pre ${cat.title.toLowerCase()}: pätnásť minút regenerácie nervového systému, mikropauza a plán stabilizácie energie na zvyšok dňa.`,
      },
    ],
  };
}

const edition = {
  slug: "mikro-rytmy-regeneracia",
  title: "Mikro rytmy regenerácie",
  engine: {
    subject: "mikro_rytmy_regeneracia",
    locale: "sk",
  },
  content,
  tasks: {
    pickPerCategory: 25,
    categories: CATEGORIES.map((cat) => ({
      key: cat.key,
      title: cat.title,
      pool: Array.from({ length: 50 }, (_, taskIndex) => buildTask(cat, taskIndex)),
    })),
  },
};

const outputPath = path.join(process.cwd(), "edition.generated.json");
fs.writeFileSync(outputPath, `${JSON.stringify(edition, null, 2)}\n`, "utf8");
console.log(`Generated ${outputPath}`);
