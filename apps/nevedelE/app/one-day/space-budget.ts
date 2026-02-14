export const SPACE_BUDGET = {
  IMPULSE_MAX_SENTENCES: 1,
  RESULT_TITLE_MAX_WORDS: 2,
  RESULT_TEXT_MAX_CHARS: 72,
} as const;

const warned = new Set<string>();

function warnOnce(key: string, message: string): void {
  if (process.env.NODE_ENV === "production") return;
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(message);
}

function countSentences(text: string): number {
  return text.split(/[.!?]+/).map((part) => part.trim()).filter(Boolean).length;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function warnImpulseSpaceBudget(copy: string, label: string): void {
  const sentences = countSentences(copy);
  if (sentences > SPACE_BUDGET.IMPULSE_MAX_SENTENCES) {
    warnOnce(label, `[one-day] ${label} exceeds impulse sentence budget (${sentences}/${SPACE_BUDGET.IMPULSE_MAX_SENTENCES}).`);
  }
}

export function warnResultTitleBudget(copy: string, label: string): void {
  const words = countWords(copy);
  if (words > SPACE_BUDGET.RESULT_TITLE_MAX_WORDS) {
    warnOnce(label, `[one-day] ${label} exceeds result title budget (${words}/${SPACE_BUDGET.RESULT_TITLE_MAX_WORDS} words).`);
  }
}

export function warnResultTextBudget(copy: string, label: string): void {
  if (copy.length > SPACE_BUDGET.RESULT_TEXT_MAX_CHARS) {
    warnOnce(label, `[one-day] ${label} exceeds result text budget (${copy.length}/${SPACE_BUDGET.RESULT_TEXT_MAX_CHARS} chars).`);
  }
}
