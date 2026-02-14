import type { EngineInput, EngineResult } from "./types";

const ENGINE_VERSION = "1.0.0";
const FIXED_COMPUTED_AT = "1970-01-01T00:00:00.000Z";

function assertValidISODateYYYYMMDD(s: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    throw new Error(`Invalid birthDate format (expected YYYY-MM-DD): ${s}`);
  }
  const [yStr, mStr, dStr] = s.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);

  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) {
    throw new Error(`Invalid birthDate numeric parts: ${s}`);
  }
  if (m < 1 || m > 12) throw new Error(`Invalid birthDate month: ${s}`);
  if (d < 1 || d > 31) throw new Error(`Invalid birthDate day: ${s}`);

  const dt = new Date(Date.UTC(y, m - 1, d));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m - 1 ||
    dt.getUTCDate() !== d
  ) {
    throw new Error(`Invalid calendar date: ${s}`);
  }
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function dayOfYearUTC(dateUTC: Date): number {
  const start = Date.UTC(dateUTC.getUTCFullYear(), 0, 1);
  const cur = Date.UTC(
    dateUTC.getUTCFullYear(),
    dateUTC.getUTCMonth(),
    dateUTC.getUTCDate()
  );
  return Math.floor((cur - start) / (24 * 60 * 60 * 1000)) + 1;
}

function weekdayUTC(dateUTC: Date): string {
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
  return names[dateUTC.getUTCDay()];
}

// FNV-1a 32-bit (deterministic)
function fnv1a32(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function clampInt(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

function normalizeLocale(locale: EngineInput["locale"]): "sk" | "cz" | "en" {
  const v = String(locale ?? "sk").toLowerCase();
  if (v === "cz" || v === "cs") return "cz";
  if (v === "en") return "en";
  return "sk";
}

function buildVerdict(score: number, locale: "sk" | "cz" | "en"): string {
  if (locale === "en") {
  if (score >= 67) return "Silný signál. Základ pôsobí nezvyčajne stabilne.";
  if (score >= 34) return "Zmiešaný signál. Niečo sedí, niečo škrípe.";
  return "Slabý signál. Rátaj s výkyvmi a korekciami.";
  }
  if (locale === "cz") {
    if (score >= 67) return "Vysoký signál. Základ vyzerá nezvyčajne stabilne.";
    if (score >= 34) return "Zmiešaný signál. Niečo sedí, niečo drhne.";
    return "Nízky signál. Počítaj s výkyvmi a korekciami.";
  }
  // sk
  if (score >= 67) return "Silný signál. Základ pôsobí nezvyčajne stabilne.";
  if (score >= 34) return "Zmiešaný signál. Niečo sedí, niečo škrípe.";
  return "Slabý signál. Rátaj s výkyvmi a korekciami.";
}

function buildFacts(
  subject: string,
  birthDate: string,
  nameNormalized: string,
  locale: "sk" | "cz" | "en",
  score: number,
  seedHash: number
): string[] {
  const [yStr, mStr, dStr] = birthDate.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);
  const dateUTC = new Date(Date.UTC(y, m - 1, d));

  return [
    `subject:${subject}`,
    `birthDate:${birthDate}`,
    `weekdayUTC:${weekdayUTC(dateUTC)}`,
    `dayOfYear:${dayOfYearUTC(dateUTC)}`,
    `leapYear:${isLeapYear(y)}`,
    `seedHash:${seedHash}`,
    `score:${score}`
  ];
}

export function compute(input: EngineInput): EngineResult {
  if (!input || typeof input !== "object") throw new Error("Input is required");

  if (typeof input.subject !== "string" || input.subject.trim().length === 0) {
    throw new Error("subject is required");
  }
  if (typeof input.birthDate !== "string") {
    throw new Error("birthDate is required");
  }
  assertValidISODateYYYYMMDD(input.birthDate);

  const subject = input.subject.trim();
  const locale = normalizeLocale(input.locale);
  const nameNormalized = (input.name ?? "").trim();

  const seed = `${subject}|${input.birthDate}|${nameNormalized}|${locale}`;
  const seedHash = fnv1a32(seed);

  const score = clampInt(seedHash % 101, 0, 100);

  return {
    subject,
    score,
    verdict: buildVerdict(score, locale),
    facts: buildFacts(
      subject,
      input.birthDate,
      nameNormalized,
      locale,
      score,
      seedHash
    ),
    meta: {
      engineVersion: ENGINE_VERSION,
      computedAt: FIXED_COMPUTED_AT
    }
  };
}

export type { EngineInput, EngineResult } from "./types";


