import { validateCopy } from "./constraints";
import { SPACE_BUDGET } from "./space-budget";
import type { DayType, SpectrumType } from "./session";

export type MeaningZone = "LOW" | "MID" | "HIGH";

export type MeaningState = {
  id: string;
  title: string;
  body: string;
  applicableSpectra: SpectrumType[];
  preferredZones: MeaningZone[];
  toneBias?: DayType;
};

const FALLBACK_STATE: MeaningState = {
  id: "FALLBACK",
  title: "vyvážené",
  body: "Nič nevyčnieva.\nVeci držia pokope.\nDeň stojí sám.",
  applicableSpectra: ["A", "B"],
  preferredZones: ["MID"],
};

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function strictValidateState(state: MeaningState): string[] {
  const errors: string[] = [];
  const titleResult = validateCopy(state.title);
  const bodyResult = validateCopy(state.body.replace(/\n/g, " "));

  if (!titleResult.ok) errors.push(...titleResult.errors.map((e) => `${state.id}.title: ${e}`));
  if (!bodyResult.ok) errors.push(...bodyResult.errors.map((e) => `${state.id}.body: ${e}`));

  const titleWords = state.title.trim().split(/\s+/).filter(Boolean).length;
  if (titleWords > SPACE_BUDGET.RESULT_TITLE_MAX_WORDS) {
    errors.push(`${state.id}.title exceeds title budget`);
  }

  if (state.body.length > SPACE_BUDGET.RESULT_TEXT_MAX_CHARS) {
    errors.push(`${state.id}.body exceeds text budget`);
  }

  if (!state.applicableSpectra.length || !state.preferredZones.length) {
    errors.push(`${state.id} missing spectrum/zone applicability`);
  }

  return errors;
}

export function validateMeaningPool(pool: MeaningState[]): { ok: boolean; errors: string[] } {
  const errors = pool.flatMap(strictValidateState);
  if (pool.length !== 8) errors.push(`meaning pool must contain exactly 8 states (received ${pool.length})`);
  return { ok: errors.length === 0, errors };
}

function getCandidateStates(pool: MeaningState[], spectrum: SpectrumType, zone: MeaningZone): MeaningState[] {
  return pool.filter((state) => state.applicableSpectra.includes(spectrum) && state.preferredZones.includes(zone));
}

export function selectMeaningState(
  date: Date,
  spectrum: SpectrumType,
  zone: MeaningZone,
  dayType: DayType,
  pool: MeaningState[],
): MeaningState {
  const candidates = getCandidateStates(pool, spectrum, zone);
  if (!candidates.length) return FALLBACK_STATE;

  const toneMatched = candidates.filter((state) => state.toneBias === dayType);
  const source = toneMatched.length > 0 && hashString(`${dateKey(date)}:${spectrum}:${zone}:tone`) % 2 === 0 ? toneMatched : candidates;

  const index = hashString(`${dateKey(date)}:${spectrum}:${zone}:${dayType}`) % source.length;
  return source[index] ?? source[0] ?? FALLBACK_STATE;
}

export function getAllowedStateIds(pool: MeaningState[], spectrum: SpectrumType, zone: MeaningZone): string[] {
  return getCandidateStates(pool, spectrum, zone).map((state) => state.id);
}
