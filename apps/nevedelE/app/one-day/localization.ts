import en from "./locales/en.json";
import sk from "./locales/sk.json";

export type LanguageCode = "sk" | "en";

type Dict = Record<string, string>;

const dictionaries: Record<LanguageCode, Dict> = { sk, en };

function normalizeLocale(locale: string | undefined): LanguageCode {
  if (!locale) return "sk";
  const lower = locale.toLowerCase();
  if (lower.startsWith("en")) return "en";
  if (lower.startsWith("sk")) return "sk";
  return "sk";
}

export function detectLanguage(locale?: string): LanguageCode {
  if (locale) return normalizeLocale(locale);
  if (typeof navigator !== "undefined") return normalizeLocale(navigator.language);
  return "sk";
}

export function createTranslator(language: LanguageCode) {
  return (key: string): string => {
    const primary = dictionaries[language][key];
    if (primary) return primary;

    const fallback = dictionaries.sk[key];
    if (fallback) return fallback;

    if (process.env.NODE_ENV !== "production") {
      console.warn(`[one-day] Missing locale key: ${key}`);
    }

    return key;
  };
}
