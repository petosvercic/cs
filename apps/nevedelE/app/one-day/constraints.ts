export const MAX_COPY_WORDS = 20;
export const ALLOW_QUESTIONS = false;
export const ALLOW_CTA = false;
export const ALLOW_IDENTITY_LANGUAGE = false;

export type ValidationResult = {
  ok: boolean;
  errors: string[];
};

const FORBIDDEN_CTA_PHRASES = ["pokračuj", "klikni", "ťukni", "ďalej", "skús", "mal by si", "urob", "sprav"];
const FORBIDDEN_FUTURE_BINDING = ["zajtra", "nabudúce", "každý deň", "denne", "vráť sa"];

function countWords(copy: string): number {
  return copy.trim().split(/\s+/).filter(Boolean).length;
}

export function validateCopy(copy: string): ValidationResult {
  const text = copy.trim();
  const normalized = ` ${text.toLowerCase()} `;
  const errors: string[] = [];

  if (countWords(text) > MAX_COPY_WORDS) {
    errors.push(`exceeds MAX_COPY_WORDS (${MAX_COPY_WORDS})`);
  }

  if (!ALLOW_QUESTIONS && text.includes("?")) {
    errors.push("contains question mark");
  }

  if (text.includes("!")) {
    errors.push("contains exclamation mark");
  }

  if (!ALLOW_CTA && FORBIDDEN_CTA_PHRASES.some((phrase) => normalized.includes(phrase))) {
    errors.push("contains CTA language");
  }

  if (FORBIDDEN_FUTURE_BINDING.some((phrase) => normalized.includes(phrase))) {
    errors.push("contains future-binding language");
  }

  if (!ALLOW_IDENTITY_LANGUAGE) {
    if (normalized.includes(" ty si") || normalized.includes(" si tak") || normalized.includes(" si vždy")) {
      errors.push("contains identity language");
    }

    if (normalized.includes(" tvoj typ")) {
      errors.push("contains identity language");
    }
  }

  return { ok: errors.length === 0, errors };
}
