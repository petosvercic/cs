import type { LevelProfile, RawProfile } from "./decisionModel";
import { pickCopy } from "./copyVariants";

export type ProfileInput = {
  raw: RawProfile;
  level: LevelProfile;
};

type FreeReport = {
  signature: string;
  riskSpot: string;
  intervention: string;
};

export type FullReport = {
  extendedSignature: string;
  dimensionMap: {
    speed: string;
    processing: string;
    risk: string;
    pressure: string;
    control: string;
  };
  tensions: string[];
  sevenDayPlan: { day: number; text: string }[];
};

const speedText = {
  high: "Rozhoduješ sa rýchlo a prirodzene preberáš iniciatívu.",
  medium: "Tempo rozhodovania máš vyvážené a vieš ho meniť podľa situácie.",
  low: "Do rozhodnutia vstupuješ opatrnejšie a preferuješ viac času na overenie.",
};

const processingText = {
  high: "Opieraš sa o štruktúru, porovnanie variantov a jasné argumenty.",
  medium: "Kombinuješ analytiku s intuitívnym odhadom podľa kontextu.",
  low: "Často pracuješ s celkovým dojmom a rýchlym interpretačným rámcom.",
};

const riskText = {
  high: "Pri neistote vieš ísť do rozhodnutia aj bez kompletnej istoty.",
  medium: "Riziko prijímaš selektívne, keď vidíš aspoň základnú kontrolu dopadov.",
  low: "Preferuješ stabilnejšie varianty a nižšiu mieru nepredvídateľnosti.",
};

const pressureText = {
  high: "Pod tlakom si funkčný/á a udržíš smer aj pri zmene podmienok.",
  medium: "Výkon pod tlakom držíš, ale vyžaduje to vedomé riadenie pozornosti.",
  low: "V záťaži máš tendenciu spomaľovať a vracať sa k rozhodnutiu opakovane.",
};

const controlText = {
  high: "Silno potrebuješ jasný rámec, pravidlá a predvídateľný postup.",
  medium: "Kontrolu využívaš pragmaticky: máš plán, ale vieš ho upraviť.",
  low: "Funguješ flexibilne a dobre toleruješ otvorené, menej definované prostredie.",
};

export function generateFreeReport(profile: ProfileInput, variant?: { seed?: string; runIndex?: number }): FreeReport {
  const { raw, level } = profile;
  const seed = variant?.seed ?? "viora";
  const runIndex = variant?.runIndex ?? 0;

  const signature = [
    `${speedText[level.speed]} ${processingText[level.processing]}`,
    `${riskText[level.risk]} ${pressureText[level.pressure]}`,
    `${controlText[level.control]} ${pickCopy("free.signature.tail", seed, runIndex)}`,
  ].join("\n\n");

  const riskCandidates = [
    {
      key: "speed",
      score: raw.speed,
      text: "Pri vyššom tempe môže vzniknúť slepé miesto v overení detailov. V praxi to znamená, že rozhodnutie je rýchle, ale nie vždy má dostatočne ošetrené sekundárne dopady.",
    },
    {
      key: "processing",
      score: raw.processing,
      text: "Pri silnej analytike hrozí predĺžené porovnávanie variantov. Rizikom je, že sa znižuje rýchlosť exekúcie v okne, kde by stačilo rozhodnúť s dostupnými dátami.",
    },
    {
      key: "risk",
      score: raw.risk,
      text: "V práci s neistotou môže byť kritické správne nastaviť hranicu prijateľného rizika. Bez tejto hranice môžeš buď zbytočne brzdiť, alebo naopak podceniť ochranné kroky.",
    },
    {
      key: "pressure",
      score: raw.pressure,
      text: "Pod zaťažením sa najčastejšie láme kvalita pozornosti. Aj pri dobrom výkone môže prísť k zúženiu perspektívy a slabšiemu vyhodnoteniu alternatív.",
    },
    {
      key: "control",
      score: raw.control,
      text: "Potreba kontroly je užitočná, no pri vyššej intenzite môže spomaľovať rozhodovanie v dynamickom prostredí. Kritické je rozlišovať, čo musí byť pod kontrolou a čo stačí monitorovať.",
    },
  ];

  const topRisk = riskCandidates.sort((a, b) => b.score - a.score)[0];
  const riskSpot = [
    topRisk.text,
    `${pickCopy("free.risk.tail", seed, runIndex)} Tento rámec znižuje chybovosť bez výrazného spomalenia.`,
  ].join("\n\n");

  const intervention = [
    "Zaveď pravidlo 90 sekúnd pred dôležitým rozhodnutím: pomenuj cieľ, jedno hlavné riziko a prvý overiteľný krok. Tento mikro-postup vytvorí stabilný rozhodovací rytmus aj v neistote.",
    level.control === "high"
      ? "Keďže potreba kontroly je u teba výraznejšia, dopredu si urč, ktoré 2 premenné musíš mať pod kontrolou a zvyšok nechaj ako priebežné monitorovanie. Získaš rýchlosť bez straty kvality."
      : "Ak máš nižšiu potrebu kontroly, pridaj si k rozhodnutiu jeden pevný bod verifikácie po 24 hodinách. Udržíš flexibilitu, no zároveň zvýšiš presnosť ďalších rozhodnutí.",
    `${pickCopy("free.intervention.close", seed, runIndex)} Takto sa profil mení na praktický systém, nie iba jednorazový výstup.`,
  ].join("\n\n");

  return { signature, riskSpot, intervention };
}

export function generateFullReport(profile: ProfileInput, variant?: { seed?: string; runIndex?: number }): FullReport {
  const { level } = profile;
  const seed = variant?.seed ?? "viora";
  const runIndex = variant?.runIndex ?? 0;

  const extendedSignature = [
    `Tvoje skóre ukazuje profil s tempom rozhodovania na úrovni ${level.speed}, analytickým spracovaním na úrovni ${level.processing} a prístupom k neistote na úrovni ${level.risk}.`,
    `V oblasti záťaže je tvoja stabilita na úrovni ${level.pressure} a potreba riadenia procesu na úrovni ${level.control}. V praxi to znamená, že tvoj výkon je najlepší, keď máš jasný cieľ, explicitné priority a krátke cykly spätnej väzby.`,
    `${pickCopy("full.signature.tail", seed, runIndex)} ${pickCopy("full.plan.intro", seed, runIndex)}`,
  ].join("\n\n");

  const dimensionMap = {
    speed:
      level.speed === "high"
        ? "Rýchlosť je tvoja výhoda. Potrebuješ len krátky kontrolný bod pred finálnym krokom, aby si znížil/a prehliadnutie detailu."
        : level.speed === "medium"
          ? "Tempo vieš prispôsobiť kontextu. Kľúčové je vedome určiť, kedy ideš rýchlo a kedy si necháš priestor na verifikáciu."
          : "Rozhodovanie je opatrnejšie. Pri operatívnych témach pomáha časový limit, aby sa z prehodnocovania nestalo zdržanie.",
    processing:
      level.processing === "high"
        ? "Analytická disciplína je silná. Rizikom je dlhé porovnávanie, preto si vopred stanov počet kritérií a termín uzáveru."
        : level.processing === "medium"
          ? "Kombinuješ dáta a odhad. Presnosť zvýšiš tým, že pri dôležitých rozhodnutiach vždy doplníš jeden tvrdý fakt navyše."
          : "Spracovanie je viac intuitívne. Pre stabilnejšiu kvalitu si pred rozhodnutím zapisuj 2 dôvody pre a 1 proti.",
    risk:
      level.risk === "high"
        ? "Neistotu zvládaš aktívne. Potrebuješ však explicitnú hranicu prijateľnej straty, aby odvaha neznižovala bezpečnosť rozhodnutí."
        : level.risk === "medium"
          ? "Riziko riadiš selektívne. Dôležité je pomenovať podmienky, pri ktorých rozhodnutie automaticky reviduješ."
          : "Preferuješ istotu a stabilitu. Pri raste pomôže testovať menšie experimenty s nízkym dopadom namiesto veľkých skokov.",
    pressure:
      level.pressure === "high"
        ? "Pod tlakom ostávaš funkčný/á. Sleduj však únavu pozornosti, ktorá môže znižovať kvalitu vo finálnej fáze dňa."
        : level.pressure === "medium"
          ? "Výkon v záťaži držíš, no je citlivý na kontext. Pred kritickým rozhodnutím pomáha krátka reset rutina (2–3 minúty)."
          : "V strese sa rozhodovanie spomaľuje. Pomôže rozbiť rozhodnutie na menšie kroky s jasným poradím a jedným vlastníkom kroku.",
    control:
      level.control === "high"
        ? "Potrebný rámec a kontrola sú výrazné. Efektívne je rozdeliť veci na „musím riadiť“ a „stačí monitorovať“."
        : level.control === "medium"
          ? "Kontrolu používaš pragmaticky. Kvalitu zvýšiš stabilným týždenným review, kde porovnáš zámer a výsledok."
          : "Funguješ flexibilne aj bez pevnej štruktúry. Pri zložitejších témach však potrebuješ aspoň minimálny rozhodovací protokol.",
  };

  const tensions: string[] = [
    pickCopy("full.tension.intro", seed, runIndex),
    level.speed === "high" && level.processing === "high"
      ? "Rýchlosť a analytika sa môžu dostať do konfliktu: chceš konať hneď, ale zároveň mať dôkladné zdôvodnenie. Riešenie je dvojfázový režim: 5 minút analýza, potom exekučné rozhodnutie."
      : "Tempo a hĺbka analýzy sú relatívne vyvážené. Napätie vzniká hlavne vtedy, keď nie je vopred definovaná dôležitosť rozhodnutia.",
    level.risk === "high" && level.control === "high"
      ? "Súčasná ochota riskovať a potreba kontroly vytvárajú vnútorný tlak. Pomáha explicitne oddeliť riziká, ktoré akceptuješ, od tých, ktoré nepripúšťaš."
      : level.risk === "low" && level.speed === "high"
        ? "Rýchle rozhodovanie pri nižšej tolerancii neistoty môže spôsobovať spätné prehodnocovanie. Zaveď krátke pravidlo: rozhodni, potom skontroluj iba jeden kritický bod."
        : "Napätie medzi rizikom a kontrolou je zvládnuteľné. Stabilitu prinesie vopred určené pravidlo, kedy rozhodnutie eskaluješ na druhý názor.",
    level.pressure === "low"
      ? "Vysoká záťaž znižuje tvoju rozhodovaciu istotu. Kritické rozhodnutia preto plánuj na čas s nižším kognitívnym hlukom a jasnou prioritou."
      : "Pod tlakom zostávaš operatívny/á. Najväčšie riziko je postupné vyčerpanie, preto je dôležitý krátky režim obnovy po sérii náročných rozhodnutí.",
  ];

  const sevenDayPlan = [
    {
      day: 1,
      text: "Nastav si osobný rozhodovací rámec: cieľ rozhodnutia, časový limit a minimálne kritériá kvality.",
    },
    {
      day: 2,
      text: "Pri troch bežných rozhodnutiach použi 90-sekundový checkpoint (čo viem, čo neviem, aký je najbližší bezpečný krok).",
    },
    {
      day: 3,
      text: "Definuj hranicu rizika: čo je ešte prijateľné a čo už vyžaduje zmenu variantu alebo eskaláciu.",
    },
    {
      day: 4,
      text: "Zaveď jedno pravidlo pre tlakové situácie: najprv priorita, potom rozhodnutie, nakoniec krátky zápis dôvodu.",
    },
    {
      day: 5,
      text: "Vyber dve rozhodnutia a porovnaj zámer vs. výsledok. Označ jeden opakovaný vzorec, ktorý chceš vedome upraviť.",
    },
    {
      day: 6,
      text: "Otestuj alternatívny štýl: ak ideš bežne rýchlo, spomaľ; ak ideš opatrne, skráť čas na polovicu. Sleduj kvalitu výstupu.",
    },
    {
      day: 7,
      text: "Sprav 20-minútové týždenné review a nastav jedno konkrétne pravidlo, ktoré budeš používať ďalší týždeň pri dôležitých rozhodnutiach.",
    },
  ];

  return { extendedSignature, dimensionMap, tensions, sevenDayPlan };
}
