import { questions, type OptionLabel } from "./decisionModel";
import { modulesBySlug, type ModuleSlug } from "./modules";
import { selectBaseQuizVariants, slotIds, type SlotId } from "./questionPool";

export type ProfileMode = "quiz" | "free_results" | "premium_steps";

type SelectedQuestionIds = Partial<Record<SlotId, string>>;

export type VioraStateV1 = {
  version: 1;
  identity: { email?: string; name?: string; consent?: boolean };
  base: {
    answers?: Record<number, OptionLabel>;
    computedAt?: number;
    seed?: string;
    attempt?: number;
    selectedQuestionIds?: SelectedQuestionIds;
  };
  unlocks: { full?: boolean; addons?: ModuleSlug[]; included?: ModuleSlug[]; miniReports?: Partial<Record<ModuleSlug, string>> };
  tuning: { done?: boolean; choices?: string[] };
  ui: { lastMode?: ProfileMode; lastSelectedModule?: ModuleSlug; premiumStep?: 1 | 2 | 3 | 4 | 5 };
};

const LS_STATE = "viora_state_v1";
const legacy = {
  answers: "viora_last_base_answers",
  runAt: "viora_last_run_at",
  full: "viora_unlocked_full",
  addons: "viora_unlocked_addons",
  email: "viora_email",
  name: "viora_name",
  consent: "viora_consent",
  included: "viora_included_modules",
  tuningChoices: "viora_tuning_choices",
  tuningDone: "viora_tuning_done",
};

const isModuleSlug = (value: unknown): value is ModuleSlug => typeof value === "string" && value in modulesBySlug;

const normalizeAnswers = (value: unknown): Record<number, OptionLabel> | undefined => {
  if (!value || typeof value !== "object") return undefined;
  const out: Record<number, OptionLabel> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    const i = Number(k);
    if (!Number.isFinite(i)) continue;
    if (v === "A" || v === "B" || v === "C") out[i] = v;
  }
  return Object.keys(out).length ? out : undefined;
};

const normMods = (value: unknown, limit?: number): ModuleSlug[] => {
  if (!Array.isArray(value)) return [];
  const dedupe = Array.from(new Set(value.filter(isModuleSlug)));
  return typeof limit === "number" ? dedupe.slice(0, limit) : dedupe;
};


const normMiniReports = (value: unknown): Partial<Record<ModuleSlug, string>> => {
  if (!value || typeof value !== "object") return {};
  const out: Partial<Record<ModuleSlug, string>> = {};
  for (const [key, rawVal] of Object.entries(value as Record<string, unknown>)) {
    if (!isModuleSlug(key)) continue;
    if (typeof rawVal !== "string") continue;
    out[key] = rawVal;
  }
  return out;
};

const normIds = (value: unknown): SelectedQuestionIds => {
  if (!value || typeof value !== "object") return {};
  const out: SelectedQuestionIds = {};
  for (const slotId of slotIds) {
    const raw = (value as Record<string, unknown>)[String(slotId)];
    if (typeof raw === "string") out[slotId] = raw;
  }
  return out;
};

const generateSeed = () => {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
};

export const patchVioraState = (prev: VioraStateV1, patch: Partial<VioraStateV1>): VioraStateV1 =>
  sanitizeVioraState({
    ...prev,
    ...patch,
    identity: { ...prev.identity, ...patch.identity },
    base: { ...prev.base, ...patch.base },
    unlocks: { ...prev.unlocks, ...patch.unlocks },
    tuning: { ...prev.tuning, ...patch.tuning },
    ui: { ...prev.ui, ...patch.ui },
  });

export const sanitizeVioraState = (rawValue: Partial<VioraStateV1> | null | undefined): VioraStateV1 => {
  const raw = rawValue ?? {};
  const email = typeof raw.identity?.email === "string" ? raw.identity.email.trim().toLowerCase() : undefined;
  const seed = email || (typeof raw.base?.seed === "string" && raw.base.seed.trim()) || undefined;
  const attempt = Math.max(0, Math.floor(Number(raw.base?.attempt ?? 0) || 0));
  const selected = normIds(raw.base?.selectedQuestionIds);
  const missing = slotIds.some((id) => !selected[id]);
  const selectedQuestionIds = missing && seed
    ? Object.fromEntries(slotIds.map((id) => [id, selectBaseQuizVariants(seed, attempt)[id].id])) as SelectedQuestionIds
    : selected;

  return {
    version: 1,
    identity: {
      email,
      name: typeof raw.identity?.name === "string" ? raw.identity.name : undefined,
      consent: raw.identity?.consent === true,
    },
    base: {
      answers: normalizeAnswers(raw.base?.answers),
      computedAt: typeof raw.base?.computedAt === "number" ? raw.base.computedAt : undefined,
      seed,
      attempt,
      selectedQuestionIds,
    },
    unlocks: {
      full: raw.unlocks?.full === true,
      addons: normMods(raw.unlocks?.addons),
      included: normMods(raw.unlocks?.included, 2),
      miniReports: normMiniReports(raw.unlocks?.miniReports),
    },
    tuning: {
      done: raw.tuning?.done === true,
      choices: Array.isArray(raw.tuning?.choices) ? raw.tuning.choices.filter((v): v is string => typeof v === "string").slice(0, 2) : [],
    },
    ui: {
      lastMode: raw.ui?.lastMode,
      lastSelectedModule: isModuleSlug(raw.ui?.lastSelectedModule) ? raw.ui.lastSelectedModule : undefined,
      premiumStep: raw.ui?.premiumStep === 1 || raw.ui?.premiumStep === 2 || raw.ui?.premiumStep === 3 || raw.ui?.premiumStep === 4 || raw.ui?.premiumStep === 5 ? raw.ui.premiumStep : 1,
    },
  };
};

export const getAnsweredCount = (state: VioraStateV1) => Object.keys(state.base.answers ?? {}).length;
export const isQuizComplete = (state: VioraStateV1) => getAnsweredCount(state) >= questions.length;

export const ensureBaseRunConfig = (state: VioraStateV1): VioraStateV1 => {
  const seed = state.identity.email?.toLowerCase() || state.base.seed || generateSeed();
  const attempt = state.base.attempt ?? 0;
  const selected = selectBaseQuizVariants(seed, attempt);
  const selectedQuestionIds = Object.fromEntries(slotIds.map((id) => [id, selected[id].id])) as SelectedQuestionIds;
  return patchVioraState(state, { base: { ...state.base, seed, attempt, selectedQuestionIds } });
};

export const createNextRunState = (state: VioraStateV1): VioraStateV1 => {
  const seed = state.identity.email?.toLowerCase() || state.base.seed || generateSeed();
  const attempt = (state.base.attempt ?? 0) + 1;
  const selected = selectBaseQuizVariants(seed, attempt);
  const selectedQuestionIds = Object.fromEntries(slotIds.map((id) => [id, selected[id].id])) as SelectedQuestionIds;
  return patchVioraState(state, {
    base: { ...state.base, answers: {}, computedAt: undefined, seed, attempt, selectedQuestionIds },
    ui: { ...state.ui, lastMode: "quiz", premiumStep: 1 },
  });
};

export const resetQuizButKeepUnlocks = (state: VioraStateV1): VioraStateV1 => createNextRunState(state);

export const deriveProfileMode = (state: VioraStateV1): ProfileMode => {
  if (!isQuizComplete(state)) return "quiz";
  return state.unlocks.full ? "premium_steps" : "free_results";
};

export const loadVioraState = (): VioraStateV1 => {
  try {
    const raw = localStorage.getItem(LS_STATE);
    if (raw) return sanitizeVioraState(JSON.parse(raw) as Partial<VioraStateV1>);
  } catch {}
  const migrated = migrateLegacyState();
  saveVioraState(migrated);
  return migrated;
};

export const saveVioraState = (state: VioraStateV1) => {
  localStorage.setItem(LS_STATE, JSON.stringify(sanitizeVioraState(state)));
};

const migrateLegacyState = (): VioraStateV1 => {
  let answers: Record<number, OptionLabel> | undefined;
  try { answers = normalizeAnswers(JSON.parse(localStorage.getItem(legacy.answers) || "null")); } catch {}
  const email = localStorage.getItem(legacy.email)?.trim().toLowerCase() || undefined;
  const seed = email || generateSeed();
  const selected = selectBaseQuizVariants(seed, 0);
  return sanitizeVioraState({
    version: 1,
    identity: { email, name: localStorage.getItem(legacy.name) || undefined, consent: localStorage.getItem(legacy.consent) === "true" },
    base: {
      answers,
      computedAt: Number(localStorage.getItem(legacy.runAt) || "0") || undefined,
      seed,
      attempt: 0,
      selectedQuestionIds: Object.fromEntries(slotIds.map((id) => [id, selected[id].id])) as SelectedQuestionIds,
    },
    unlocks: {
      full: localStorage.getItem(legacy.full) === "true",
      addons: (() => { try { return normMods(JSON.parse(localStorage.getItem(legacy.addons) || "[]")); } catch { return []; } })(),
      included: (() => { try { return normMods(JSON.parse(localStorage.getItem(legacy.included) || "[]"), 2); } catch { return []; } })(),
      miniReports: {},
    },
    tuning: {
      done: localStorage.getItem(legacy.tuningDone) === "true",
      choices: (() => { try { const c = JSON.parse(localStorage.getItem(legacy.tuningChoices) || "[]"); return Array.isArray(c) ? c.filter((x): x is string => typeof x === "string").slice(0, 2) : []; } catch { return []; } })(),
    },
    ui: { lastMode: "quiz", premiumStep: 1 },
  });
};
