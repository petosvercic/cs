import type { ProfileInput, FullReport } from "./reportGen";
import { pickDeterministic } from "./deterministic";
import { modulesBySlug, type ModuleSlug } from "./modules";

export type SynthesisReport = {
  summary: string[];
  situations: string[];
  trap: string;
  focusAdjustments: string;
  contexts: string;
};

export const generateSynthesisReport = (input: {
  profile: ProfileInput;
  fullReport: FullReport;
  included: ModuleSlug[];
  purchased: ModuleSlug[];
  tuningChoices: string[];
  miniContextInsights?: string[];
  seed: string;
  attempt: number;
}): SynthesisReport => {
  const { profile, fullReport, included, purchased, tuningChoices, miniContextInsights = [], seed, attempt } = input;
  const styleKey = `${seed}:${attempt}:synthesis`;

  const first = pickDeterministic([
    `Tvoj štýl je kombinácia ${profile.level.speed} tempa a ${profile.level.processing} spracovania. Pôsobí to ako vodič, ktorý vie ísť svižne, ale stále sleduje mapu.`,
    `V rozhodovaní kombinuješ ${profile.level.speed} tempo s ${profile.level.control} mierou kontroly. Je to mix autopilota a ručného riadenia podľa situácie.`,
    `Profil naznačuje ${profile.level.risk} toleranciu neistoty a ${profile.level.pressure} stabilitu v tlaku. Pri dobrom rámci vieš byť veľmi konzistentný/á.`,
  ], styleKey + ":p1");

  const second = pickDeterministic([
    fullReport.extendedSignature.split("\n\n")[0],
    fullReport.extendedSignature.split("\n\n")[1] ?? fullReport.extendedSignature,
    "Keď je cieľ jasný a kroky krátke, tvoj výkon rastie bez zbytočného preťaženia.",
  ], styleKey + ":p2");

  const third = pickDeterministic([
    "Najlepšie funguješ, keď máš jasnú prioritu, potom krátky checkpoint a až potom finálne rozhodnutie.",
    "Kvalitu ti drží rytmus: rozhodnúť, overiť jeden kritický bod, pokračovať.",
    "V praxi sa osvedčuje menej premenných naraz a pravidelná spätná väzba po rozhodnutí.",
  ], styleKey + ":p3");

  const situations = [
    `V práci pod deadline sa ukáže tvoj režim: ${fullReport.dimensionMap.pressure}`,
    `Pri neúplných dátach sa prejaví tvoja os neistoty: ${fullReport.dimensionMap.risk}`,
    `V dlhších rozhodnutiach drží stabilitu tvoja kontrola: ${fullReport.dimensionMap.control}`,
  ];

  const trap = `${fullReport.tensions[1] ?? fullReport.tensions[0]} Prakticky pomáha jeden fixný limit času a jasné kritérium „dosť dobré“.`;

  const focusAdjustments = tuningChoices.length
    ? `Tvoj fokus (${tuningChoices.join(", ")}) znamená, že najbližších 7 dní uprav len 1-2 návyky: kratší rozhodovací cyklus, potom vedomé upokojenie a kontrola dopadu.`
    : "Ak si fokus nevybral/a, drž základ: krátky checkpoint pred rozhodnutím a týždenné review troch kľúčových volieb.";

  const contextSlugs = Array.from(new Set([...included, ...purchased]));
  const contextTitles = contextSlugs.map((slug) => modulesBySlug[slug]?.title).filter(Boolean);
  const miniInsightsText = miniContextInsights.length
    ? ` Mini odpovede naznačujú: ${miniContextInsights.join(" ")}`
    : "";

  const contexts = contextTitles.length
    ? `Tvoje kontexty (${contextTitles.join(", ")}) dopĺňajú obraz: tieto oblasti sú najlepší priestor na okamžitý tréning nového štýlu.${miniInsightsText}`
    : `Kontextové oblasti si zatiaľ nevybral/a. Keď pridáš 1-2 moduly, Komplexná analýza sa vie ešte presnejšie prispôsobiť tvojmu dňu.${miniInsightsText}`;

  return {
    summary: [first, second, third],
    situations,
    trap,
    focusAdjustments,
    contexts,
  };
};
