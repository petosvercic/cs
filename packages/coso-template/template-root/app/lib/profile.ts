import type { RNG } from "./seed";
import { clamp, randomNormalish } from "./pick";

export type Profile = {
  intensity: number; // 0..1 (ako “silno” to pôsobí)
  openness: number;  // 0..1 (ako “otvorený” vibe)
  control: number;   // 0..1 (ako “kontroluješ veci”)
  chaos: number;     // 0..1 (ako “rozptyl”)
  nameWeight: number; // 0..1 (meno hrá veľkú rolu)
};

export function buildProfile(rng: RNG, name: string, dobISO: string): Profile {
  // jemné väzby na real input (pôsobí “odvodené”)
  const clean = name.trim();
  const len = clean.length || 1;
  const vowels = (clean.match(/[aeiouyáäéíóôöúýAEIOUYÁÄÉÍÓÔÖÚÝ]/g)?.length ?? 0);
  const vowelRatio = vowels / len; // 0..1-ish

  const m = dobISO.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const month = m ? Number(m[2]) : 6;
  const day = m ? Number(m[3]) : 15;

  // základné osi: miešaj “odvodené” + RNG
  const nameWeight = clamp(0.35 + 0.4 * vowelRatio + 0.15 * randomNormalish(rng), 0, 1);

  const seasonBias = (month <= 3 || month >= 11) ? 0.08 : -0.02; // malé posuny, nech to nepôsobí ako horoskop
  const dayBias = clamp((day - 16) / 40, -0.3, 0.3);

  const intensity = clamp(0.45 + seasonBias + 0.25 * dayBias + 0.25 * randomNormalish(rng), 0, 1);
  const openness  = clamp(0.50 + 0.20 * vowelRatio + 0.20 * randomNormalish(rng), 0, 1);
  const control   = clamp(0.55 - 0.25 * vowelRatio + 0.20 * randomNormalish(rng), 0, 1);
  const chaos     = clamp(0.40 + 0.25 * (1 - control) + 0.20 * randomNormalish(rng), 0, 1);

  return { intensity, openness, control, chaos, nameWeight };
}
