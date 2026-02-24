export type Dimension = "speed" | "processing" | "risk" | "pressure" | "control";
export type Level = "low" | "medium" | "high";
export type OptionLabel = "A" | "B" | "C";

export type ScoreRule = {
  primary: { dimension: Dimension; points: 0 | 1 | 2 };
  secondary?: { dimension: Dimension; points: 1 };
};

export type QuestionOption = {
  label: OptionLabel;
  text: string;
  scoring: ScoreRule;
};

export type Question = {
  id: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  question: string;
  options: [QuestionOption, QuestionOption, QuestionOption];
};

export type Answers = Record<number, OptionLabel>;

export type RawProfile = Record<Dimension, number>;
export type LevelProfile = Record<Dimension, Level>;

export const questions: Question[] = [
  {
    id: 1,
    question: "Keď musíš rozhodnúť rýchlo, čo je tvoj prvý krok?",
    options: [
      { label: "A", text: "Rozhodnem hneď podľa prvého silného signálu.", scoring: { primary: { dimension: "speed", points: 2 } } },
      { label: "B", text: "Dám si krátku pauzu a overím 1–2 fakty.", scoring: { primary: { dimension: "speed", points: 1 } } },
      { label: "C", text: "Najprv si ujasním širší kontext, až potom volím.", scoring: { primary: { dimension: "speed", points: 0 } } },
    ],
  },
  {
    id: 2,
    question: "Ako zvyčajne spracúvaš nové informácie?",
    options: [
      { label: "A", text: "Skôr intuitívne, podľa celkového dojmu.", scoring: { primary: { dimension: "processing", points: 0 } } },
      { label: "B", text: "Kombinujem rýchly odhad s pár konkrétnymi dátami.", scoring: { primary: { dimension: "processing", points: 1 } } },
      { label: "C", text: "Systematicky: štruktúra, porovnanie, až potom záver.", scoring: { primary: { dimension: "processing", points: 2 } } },
    ],
  },
  {
    id: 3,
    question: "Ako reaguješ, keď chýbajú dôležité informácie?",
    options: [
      { label: "A", text: "Aj tak idem ďalej a rozhodnem s tým, čo mám.", scoring: { primary: { dimension: "risk", points: 2 } } },
      { label: "B", text: "Spravím dočasné rozhodnutie a nechám priestor na úpravu.", scoring: { primary: { dimension: "risk", points: 1 } } },
      { label: "C", text: "Počkám, kým doplním kritické dáta.", scoring: { primary: { dimension: "risk", points: 0 } } },
    ],
  },
  {
    id: 4,
    question: "Pod časovým tlakom máš tendenciu: ",
    options: [
      { label: "A", text: "zostať vecný/vecná a ísť po priorite.", scoring: { primary: { dimension: "pressure", points: 2 } } },
      { label: "B", text: "udržať výkon, ale cítiť vyššie napätie.", scoring: { primary: { dimension: "pressure", points: 1 } } },
      { label: "C", text: "stratiť istotu a prehodnocovať viac, než treba.", scoring: { primary: { dimension: "pressure", points: 0 } } },
    ],
  },
  {
    id: 5,
    question: "Ako veľmi potrebuješ mať rozhodovanie pod kontrolou?",
    options: [
      { label: "A", text: "Preferujem jasný rámec a definované pravidlá.", scoring: { primary: { dimension: "control", points: 2 } } },
      { label: "B", text: "Stačí mi základný plán, zvyšok doladím počas cesty.", scoring: { primary: { dimension: "control", points: 1 } } },
      { label: "C", text: "Som v pohode aj pri voľnejšom, otvorenom postupe.", scoring: { primary: { dimension: "control", points: 0 } } },
    ],
  },
  {
    id: 6,
    question: "Pri nečakanej zmene priorít najčastejšie: ",
    options: [
      {
        label: "A",
        text: "rýchlo prepnem smer a riešim najakútnejšie kroky.",
        scoring: { primary: { dimension: "speed", points: 2 }, secondary: { dimension: "pressure", points: 1 } },
      },
      {
        label: "B",
        text: "krátko prehodnotím dopady a nastavím nový plán.",
        scoring: { primary: { dimension: "processing", points: 1 }, secondary: { dimension: "control", points: 1 } },
      },
      {
        label: "C",
        text: "radšej stabilizujem podmienky, potom pokračujem.",
        scoring: { primary: { dimension: "control", points: 2 }, secondary: { dimension: "risk", points: 1 } },
      },
    ],
  },
  {
    id: 7,
    question: "Keď rozhodnutie nevyjde podľa plánu, tvoja prvá reakcia je: ",
    options: [
      {
        label: "A",
        text: "rýchlo urobiť korekciu a pokračovať.",
        scoring: { primary: { dimension: "pressure", points: 2 }, secondary: { dimension: "speed", points: 1 } },
      },
      {
        label: "B",
        text: "analyzovať, čo sa pokazilo, a upraviť postup.",
        scoring: { primary: { dimension: "processing", points: 2 }, secondary: { dimension: "control", points: 1 } },
      },
      {
        label: "C",
        text: "obmedziť ďalšie riziko a zvoliť istejší variant.",
        scoring: { primary: { dimension: "risk", points: 0 }, secondary: { dimension: "control", points: 1 } },
      },
    ],
  },
];

const toLevel = (value: number): Level => {
  if (value <= 2) return "low";
  if (value <= 4) return "medium";
  return "high";
};

export function scoreAnswers(answers: Answers): { raw: RawProfile; level: LevelProfile } {
  const raw: RawProfile = {
    speed: 0,
    processing: 0,
    risk: 0,
    pressure: 0,
    control: 0,
  };

  for (const question of questions) {
    const selected = answers[question.id];
    const option = question.options.find((item) => item.label === selected);
    if (!option) continue;

    raw[option.scoring.primary.dimension] += option.scoring.primary.points;

    if (option.scoring.secondary) {
      raw[option.scoring.secondary.dimension] += option.scoring.secondary.points;
    }
  }

  return {
    raw,
    level: {
      speed: toLevel(raw.speed),
      processing: toLevel(raw.processing),
      risk: toLevel(raw.risk),
      pressure: toLevel(raw.pressure),
      control: toLevel(raw.control),
    },
  };
}
