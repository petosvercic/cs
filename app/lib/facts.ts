import type { RNG } from "./seed";
import type { Profile } from "./profile";
import { clamp, intBetween, formatInt, randomNormalish } from "./pick";

export type FakeFact =
  | { kind: "range"; label: string; value: string; note?: string }
  | { kind: "count"; label: string; value: string; note?: string }
  | { kind: "percent"; label: string; value: string; note?: string };

export function generateNameFacts(rng: RNG, profile: Profile, name: string, dobISO: string): FakeFact[] {
  const m = dobISO.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const year = m ? Number(m[1]) : 1990;

  const baseScale = 1 + profile.intensity * 1.2 + profile.chaos * 0.6;

  // “ľudí s rovnakým menom v ten deň” -> rozsah (nikdy presne)
  const low = Math.round(120 * baseScale + 40 * randomNormalish(rng));
  const high = Math.round(low * (3.5 + 2.5 * randomNormalish(rng)));

  const sameNameRange = `${formatInt(low)}–${formatInt(high)}`;

  // “koľko krát si niekto tvoje meno vyslovil” -> count (pôsobí šialene a zaujímavo)
  const spoken = Math.round((year % 100) * 900 + 20_000 * baseScale + 8_000 * randomNormalish(rng));
  const spokenValue = `${formatInt(clamp(spoken, 18_000, 180_000))}+`;

  // “ako rýchlo si ťa ľudia zapamätajú” -> percent (emocionálne)
  const remember = clamp(38 + 35 * profile.intensity + 12 * (profile.openness - 0.5) + 10 * (randomNormalish(rng) - 0.5), 22, 89);
  const rememberValue = `${Math.round(remember)} %`;

  return [
    { kind: "range", label: "Odhad menovcov v deň narodenia", value: sameNameRange, note: "Nie je to presné. Práve preto je to pravdepodobné." },
    { kind: "count", label: "Koľkokrát niekto povedal tvoje meno", value: spokenValue, note: "Väčšina z toho bola rutinná. Malá časť bola dôležitá." },
    { kind: "percent", label: "Šanca, že si ťa ľudia zapamätajú na prvý dojem", value: rememberValue, note: "Zvyšok si musíš odrobiť charakterom." },
  ];
}

export function generateLifeFacts(rng: RNG, profile: Profile, daysAlive: number): FakeFact[] {
  // percentá drž okolo stredu, nech to nie je cirkus
  const autopilot = clamp(45 + 25 * profile.control + 10 * (randomNormalish(rng) - 0.5), 28, 82);
  const bigDays = clamp(2 + 7 * profile.intensity + 2 * (randomNormalish(rng) - 0.5), 2, 14); // percent
  const decisions = intBetween(rng, 1200, 4800) + Math.round(daysAlive * (0.05 + 0.03 * profile.chaos));

  return [
    { kind: "percent", label: "Dni na autopilote", value: `${Math.round(autopilot)} %`, note: "Nie je to výčitka. Je to default mozgu." },
    { kind: "percent", label: "Dni, ktoré ťa naozaj zmenili", value: `${Math.round(bigDays)} %`, note: "Malé číslo. Veľký vplyv." },
    { kind: "count", label: "Rozhodnutia, ktoré urobili rozdiel", value: `${formatInt(decisions)}`, note: "Nie všetky boli vedomé. To je na tom to krásne." },
  ];
}
