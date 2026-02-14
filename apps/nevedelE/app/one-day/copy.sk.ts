import packAEn from "./content/packs/pack-a.en.json";
import packASk from "./content/packs/pack-a.sk.json";
import packBEn from "./content/packs/pack-b.en.json";
import packBSk from "./content/packs/pack-b.sk.json";
import { validateCopy } from "./constraints";
import { detectLanguage, type LanguageCode } from "./localization";
import { validateMeaningPool, type MeaningState } from "./meaning-states";
import { SPACE_BUDGET, warnImpulseSpaceBudget } from "./space-budget";
import type { JsonContentPack, JsonMeaningState, OneDayContentPack } from "./content-pack.types";
import type { DayType } from "./session";

const SPECTRUM_LABEL_KEYS = {
  A: { left: "spectrum.a.left", right: "spectrum.a.right", aria: "spectrum.a.aria" },
  B: { left: "spectrum.b.left", right: "spectrum.b.right", aria: "spectrum.b.aria" },
} as const;

const DEFAULT_FALLBACK_PACK: OneDayContentPack = {
  impulses: { LIGHT: ["Dnes."], NEUTRAL: ["Dnes."], HEAVY: ["Dnes."] },
  spectrum: {
    A: { leftLabel: "Ľahké", rightLabel: "Ťažké", ariaLabel: "Spektrum Ľahké až Ťažké" },
    B: { leftLabel: "Stojaté", rightLabel: "Pohyblivé", ariaLabel: "Spektrum Stojaté až Pohyblivé" },
  },
  meaningStates: [
    {
      id: "S3",
      title: "vyvážené",
      body: "Nič nevyčnieva.\nVeci držia pokope.\nDeň stojí sám.",
      applicableSpectra: ["A", "B"],
      preferredZones: ["MID"],
    },
  ],
};

let hasLoggedProdValidationFailure = false;

function parseMeaningState(entry: JsonMeaningState): MeaningState {
  return {
    id: entry.id,
    title: entry.title,
    body: entry.body.join("\n"),
    applicableSpectra: entry.spectra,
    preferredZones: entry.zones,
  };
}

function getRawPack(language: LanguageCode, packName: "pack-a" | "pack-b"): JsonContentPack {
  if (packName === "pack-b") {
    return language === "en" ? (packBEn as JsonContentPack) : (packBSk as JsonContentPack);
  }

  return language === "en" ? (packAEn as JsonContentPack) : (packASk as JsonContentPack);
}

export function parsePackToRuntime(raw: JsonContentPack, t: (key: string) => string): OneDayContentPack {
  return {
    impulses: raw.impulses,
    spectrum: {
      A: {
        leftLabel: t(SPECTRUM_LABEL_KEYS.A.left),
        rightLabel: t(SPECTRUM_LABEL_KEYS.A.right),
        ariaLabel: t(SPECTRUM_LABEL_KEYS.A.aria),
      },
      B: {
        leftLabel: t(SPECTRUM_LABEL_KEYS.B.left),
        rightLabel: t(SPECTRUM_LABEL_KEYS.B.right),
        ariaLabel: t(SPECTRUM_LABEL_KEYS.B.aria),
      },
    },
    meaningStates: raw.meaningStates.map(parseMeaningState),
  };
}

export function validateRuntimePack(pack: OneDayContentPack): string[] {
  const errors: string[] = [];

  (Object.keys(pack.impulses) as DayType[]).forEach((dayType) => {
    pack.impulses[dayType].forEach((impulse, index) => {
      warnImpulseSpaceBudget(impulse, `impulse.${dayType}.${index}`);
      const result = validateCopy(impulse);
      if (!result.ok) errors.push(...result.errors.map((error) => `impulse.${dayType}.${index}: ${error}`));
    });
  });

  pack.meaningStates.forEach((state) => {
    const titleWords = state.title.trim().split(/\s+/).filter(Boolean).length;
    if (titleWords > SPACE_BUDGET.RESULT_TITLE_MAX_WORDS) errors.push(`${state.id}.title exceeds title budget`);
    if (state.body.length > SPACE_BUDGET.RESULT_TEXT_MAX_CHARS) errors.push(`${state.id}.body exceeds text budget`);
  });

  const meaningValidation = validateMeaningPool(pack.meaningStates);
  if (!meaningValidation.ok) errors.push(...meaningValidation.errors);

  return errors;
}

export function getValidatedContentPack(language?: LanguageCode, t?: (key: string) => string): OneDayContentPack {
  const selectedLanguage = language ?? detectLanguage();
  const selectedPack = ((process.env.NEXT_PUBLIC_CONTENT_PACK ?? process.env.CONTENT_PACK ?? "pack-a").toLowerCase() === "pack-b"
    ? "pack-b"
    : "pack-a") as "pack-a" | "pack-b";

  const translator = t ?? ((key: string) => key);
  const runtimePack = parsePackToRuntime(getRawPack(selectedLanguage, selectedPack), translator);
  const errors = validateRuntimePack(runtimePack);

  if (errors.length === 0) return runtimePack;

  if (process.env.NODE_ENV !== "production") {
    throw new Error(`[one-day] Invalid content pack detected:\n${errors.join("\n")}`);
  }

  if (!hasLoggedProdValidationFailure) {
    hasLoggedProdValidationFailure = true;
    console.error("[one-day] Invalid content pack in production. Using safe fallback copy.", errors);
  }

  return DEFAULT_FALLBACK_PACK;
}

export function getImpulseCopy(pack: OneDayContentPack, dayType: DayType, index: number): string {
  const pool = pack.impulses[dayType];
  return pool[index] ?? pool[0];
}
