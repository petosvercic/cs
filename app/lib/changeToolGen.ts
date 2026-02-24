import type { Dimension, LevelProfile, RawProfile } from "./decisionModel";

type ScoredProfile = {
  raw: RawProfile;
  level: LevelProfile;
};

type ChangeTool = {
  title: string;
  intro: string;
  steps: [string, string, string];
  microHabit: string;
  warning: string;
};

const focusMap: Record<string, { anchor: Dimension; step: string; habit: string }> = {
  "Rýchlejšie rozhodovanie": {
    anchor: "speed",
    step: "Nastav si 90-sekundové okno: rozhodni medzi dvomi možnosťami a až potom doplň detail.",
    habit: "Každé ráno si vyber 1 rozhodnutie, ktoré uzavrieš do 2 minút.",
  },
  "Menej stresu v neistote": {
    anchor: "risk",
    step: "Pred voľbou si spíš minimum dát, ktoré potrebuješ na bezpečný ďalší krok.",
    habit: "Použi vetu: 'Stačí mi 70 % istota na ďalší krok.'",
  },
  "Menej zacyklenia na detailoch": {
    anchor: "processing",
    step: "Urči si časový limit na analýzu a po limite zvoľ prvý realizovateľný variant.",
    habit: "Pri každom väčšom rozhodnutí nastav časovač na 12 minút.",
  },
  "Lepšie zvládanie tlaku": {
    anchor: "pressure",
    step: "V tlaku si polož 1 otázku: 'Čo je kritický výsledok do 24 hodín?' a konaj len podľa nej.",
    habit: "Pri strese sprav 3 hlboké nádychy pred prvou reakciou.",
  },
  "Rozumná kontrola": {
    anchor: "control",
    step: "Namiesto úplnej kontroly si urč 2 pevné body, zvyšok nechaj adaptívny.",
    habit: "Na konci dňa si skontroluj iba 2 najdôležitejšie checkpointy.",
  },
};

const levelHint = (level: LevelProfile, key: Dimension): string => {
  if (level[key] === "high") return "silnú prirodzenú tendenciu";
  if (level[key] === "medium") return "vyvážený štýl";
  return "rezervu na posilnenie";
};

export const generateChangeTool = (scored: ScoredProfile, tuningChoices: string[]): ChangeTool => {
  const activeChoices = tuningChoices.length > 0 ? tuningChoices.slice(0, 2) : ["Rozumná kontrola"];
  const templates = activeChoices.map((choice) => focusMap[choice] ?? focusMap["Rozumná kontrola"]);
  const anchor = templates[0].anchor;

  return {
    title: "Tvoj Change Tool",
    intro: `Podľa tvojho profilu máš v oblasti „${activeChoices.join(" + ")}" ${levelHint(scored.level, anchor)}. Tu je praktický postup na najbližšie dni.`,
    steps: [
      templates[0].step,
      templates[1]?.step ?? "Po každom rozhodnutí si krátko vyhodnoť, čo fungovalo a čo zjednodušiť.",
      `Uzavri deň mini-reflexiou: 1 vec, ktorú si dnes rozhodol/a lepšie (${scored.raw[anchor]} bodov v osi ${anchor}).`,
    ],
    microHabit: templates[0].habit,
    warning: "Neprepínaj naraz priveľa návykov. Najprv 1 mikro-zmena počas 7 dní, až potom ďalšia.",
  };
};
