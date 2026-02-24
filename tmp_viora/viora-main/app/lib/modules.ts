export type ModuleSlug = "praca-priority" | "vztahy-komunikacia" | "peniaze-riziko" | "disciplina-rutiny";

export type ModuleOptionLabel = "A" | "B" | "C";

export type ModuleQuestionOption = {
  label: ModuleOptionLabel;
  text: string;
  scoring: {
    primary: { key: string; points: 0 | 1 | 2 };
    secondary?: { key: string; points: 1 };
  };
};

export type ModuleQuestion = {
  id: 1 | 2 | 3 | 4;
  question: string;
  options: [ModuleQuestionOption, ModuleQuestionOption, ModuleQuestionOption];
};

export type FocusModule = {
  slug: ModuleSlug;
  title: string;
  description: string;
  isFree: boolean;
  subscores: [string, string];
  questions: ModuleQuestion[];
};

export const modules: FocusModule[] = [
  {
    slug: "praca-priority",
    title: "Práca a priority",
    description: "Ako si nastavuješ priority a dokončuješ dôležité úlohy.",
    isFree: true,
    subscores: ["focus", "execution"],
    questions: [
      {
        id: 1,
        question: "Keď máš veľa úloh naraz, čo spravíš ako prvé?",
        options: [
          { label: "A", text: "Vyberiem najdôležitejšiu úlohu a blokujem si na ňu čas.", scoring: { primary: { key: "focus", points: 2 } } },
          { label: "B", text: "Spravím rýchly prehľad a začnem tým, čo je najbližší deadline.", scoring: { primary: { key: "focus", points: 1 } } },
          { label: "C", text: "Reagujem priebežne podľa prichádzajúcich požiadaviek.", scoring: { primary: { key: "focus", points: 0 } } },
        ],
      },
      {
        id: 2,
        question: "Ako typicky dokončuješ rozpracované úlohy?",
        options: [
          { label: "A", text: "Držím sa plánu a dotiahnem ich v dohodnutom poradí.", scoring: { primary: { key: "execution", points: 2 } } },
          { label: "B", text: "Dokončujem ich v dávkach, keď mám súvislý čas.", scoring: { primary: { key: "execution", points: 1 } } },
          { label: "C", text: "Často ich presúvam, keď sa objavia nové veci.", scoring: { primary: { key: "execution", points: 0 } } },
        ],
      },
      {
        id: 3,
        question: "Pri neočakávanej urgentnej úlohe: ",
        options: [
          { label: "A", text: "rýchlo preusporiadam priority a chránim kľúčový výstup.", scoring: { primary: { key: "focus", points: 2 }, secondary: { key: "execution", points: 1 } } },
          { label: "B", text: "spravím minimum urgentu a vrátim sa k pôvodnému plánu.", scoring: { primary: { key: "focus", points: 1 }, secondary: { key: "execution", points: 1 } } },
          { label: "C", text: "prepínam sa úplne a pôvodný plán sa rozpadne.", scoring: { primary: { key: "execution", points: 0 }, secondary: { key: "focus", points: 1 } } },
        ],
      },
      {
        id: 4,
        question: "Keď sa blíži termín, najčastejšie: ",
        options: [
          { label: "A", text: "uzatvorím rušivé vstupy a dokončím kritické body.", scoring: { primary: { key: "execution", points: 2 }, secondary: { key: "focus", points: 1 } } },
          { label: "B", text: "zvýšim tempo, ale nechávam otvorené menšie detaily.", scoring: { primary: { key: "execution", points: 1 }, secondary: { key: "focus", points: 1 } } },
          { label: "C", text: "riešim viac vecí naraz a strácam prioritu finále.", scoring: { primary: { key: "focus", points: 0 }, secondary: { key: "execution", points: 1 } } },
        ],
      },
    ],
  },
  {
    slug: "vztahy-komunikacia",
    title: "Vzťahy a komunikácia",
    description: "Ako komunikuješ pod tlakom a ako ladíš jasnosť s citlivosťou.",
    isFree: false,
    subscores: ["directness", "empathy"],
    questions: [
      { id: 1, question: "Keď dávaš spätnú väzbu, čo je tvoj štandard?", options: [
        { label: "A", text: "Poviem veci priamo, stručne a konkrétne.", scoring: { primary: { key: "directness", points: 2 } } },
        { label: "B", text: "Vyvážim jasnosť aj tón podľa situácie.", scoring: { primary: { key: "directness", points: 1 } } },
        { label: "C", text: "Najprv riešim, aby to bolo prijateľné pre druhú stranu.", scoring: { primary: { key: "directness", points: 0 } } },
      ] },
      { id: 2, question: "Ako čítaš reakcie druhých pri náročnej debate?", options: [
        { label: "A", text: "Rýchlo zachytím emóciu a upravím spôsob komunikácie.", scoring: { primary: { key: "empathy", points: 2 } } },
        { label: "B", text: "Vnímam reakciu, ale držím hlavne vecnú líniu.", scoring: { primary: { key: "empathy", points: 1 } } },
        { label: "C", text: "Sústredím sa na obsah, reakcie riešim až neskôr.", scoring: { primary: { key: "empathy", points: 0 } } },
      ] },
      { id: 3, question: "Pri konflikte o prioritu: ", options: [
        { label: "A", text: "jasne stanovím hranice a navrhnem rozhodnutie.", scoring: { primary: { key: "directness", points: 2 }, secondary: { key: "empathy", points: 1 } } },
        { label: "B", text: "hľadám spoločný rámec a potom uzavriem dohodu.", scoring: { primary: { key: "empathy", points: 1 }, secondary: { key: "directness", points: 1 } } },
        { label: "C", text: "ustúpim, aby sa napätie rýchlo znížilo.", scoring: { primary: { key: "empathy", points: 0 }, secondary: { key: "directness", points: 1 } } },
      ] },
      { id: 4, question: "Keď je potrebné oznámiť nepopulárne rozhodnutie: ", options: [
        { label: "A", text: "komunikujem dôvod, dopad a očakávané kroky bez odkladu.", scoring: { primary: { key: "directness", points: 2 }, secondary: { key: "empathy", points: 1 } } },
        { label: "B", text: "najprv otestujem reakcie a potom rozhodnutie doručím.", scoring: { primary: { key: "empathy", points: 1 }, secondary: { key: "directness", points: 1 } } },
        { label: "C", text: "oddiaľujem komunikáciu, kým nie je úplná istota.", scoring: { primary: { key: "directness", points: 0 }, secondary: { key: "empathy", points: 1 } } },
      ] },
    ],
  },
  {
    slug: "peniaze-riziko",
    title: "Peniaze a riziko",
    description: "Ako nastavuješ hranice rizika a disciplínu vo finančných voľbách.",
    isFree: false,
    subscores: ["riskDiscipline", "impulse"],
    questions: [
      { id: 1, question: "Pred väčším finančným rozhodnutím zvyčajne: ", options: [
        { label: "A", text: "vopred určím limity straty a scenár výstupu.", scoring: { primary: { key: "riskDiscipline", points: 2 } } },
        { label: "B", text: "urobím základný prepočet a rozhodnem sa.", scoring: { primary: { key: "riskDiscipline", points: 1 } } },
        { label: "C", text: "konám podľa momentu a aktuálneho pocitu.", scoring: { primary: { key: "riskDiscipline", points: 0 } } },
      ] },
      { id: 2, question: "Keď vidíš rýchlu príležitosť: ", options: [
        { label: "A", text: "držím sa pravidiel a filtrujem emóciu z rozhodnutia.", scoring: { primary: { key: "impulse", points: 0 } } },
        { label: "B", text: "zvážim ju krátko a rozhodnem podľa rámca.", scoring: { primary: { key: "impulse", points: 1 } } },
        { label: "C", text: "mám tendenciu konať hneď, aby som „nepremeškal/a“ moment.", scoring: { primary: { key: "impulse", points: 2 } } },
      ] },
      { id: 3, question: "Po strate alebo chybnom odhade: ", options: [
        { label: "A", text: "urobím krátky post-mortem a upravím pravidlá.", scoring: { primary: { key: "riskDiscipline", points: 2 }, secondary: { key: "impulse", points: 1 } } },
        { label: "B", text: "znížim aktivitu a čakám na pokojnejší moment.", scoring: { primary: { key: "riskDiscipline", points: 1 }, secondary: { key: "impulse", points: 1 } } },
        { label: "C", text: "snažím sa stratu rýchlo vykompenzovať ďalším krokom.", scoring: { primary: { key: "impulse", points: 2 }, secondary: { key: "riskDiscipline", points: 1 } } },
      ] },
      { id: 4, question: "Pri dlhodobom finančnom pláne: ", options: [
        { label: "A", text: "držím konzistentný režim a pravidelné review.", scoring: { primary: { key: "riskDiscipline", points: 2 }, secondary: { key: "impulse", points: 1 } } },
        { label: "B", text: "väčšinou sa držím plánu, no občas ho mením podľa nálady trhu.", scoring: { primary: { key: "riskDiscipline", points: 1 }, secondary: { key: "impulse", points: 1 } } },
        { label: "C", text: "plán často prepisujem pod vplyvom krátkodobých impulzov.", scoring: { primary: { key: "impulse", points: 2 }, secondary: { key: "riskDiscipline", points: 1 } } },
      ] },
    ],
  },
  {
    slug: "disciplina-rutiny",
    title: "Disciplína a rutiny",
    description: "Ako stabilne udržíš návyky a minimalizuješ vnútorné trenie.",
    isFree: false,
    subscores: ["consistency", "friction"],
    questions: [
      { id: 1, question: "Ako spoľahlivo držíš dôležité denné rutiny?", options: [
        { label: "A", text: "Mám jasný režim a plním ho stabilne.", scoring: { primary: { key: "consistency", points: 2 } } },
        { label: "B", text: "Držím ich väčšinou, keď je deň bez chaosu.", scoring: { primary: { key: "consistency", points: 1 } } },
        { label: "C", text: "Rutina sa mi často rozpadne pri zmene tempa.", scoring: { primary: { key: "consistency", points: 0 } } },
      ] },
      { id: 2, question: "Keď cítiš odpor k úlohe: ", options: [
        { label: "A", text: "rozdelím ju na malé kroky a začnem bez čakania.", scoring: { primary: { key: "friction", points: 0 } } },
        { label: "B", text: "potrebujem krátku prípravu, potom viem pokračovať.", scoring: { primary: { key: "friction", points: 1 } } },
        { label: "C", text: "úlohu odkladám, kým tlak nenarastie.", scoring: { primary: { key: "friction", points: 2 } } },
      ] },
      { id: 3, question: "Pri výpadku režimu (choroba, chaos): ", options: [
        { label: "A", text: "vrátim sa cez minimálnu verziu rutiny do 24 hodín.", scoring: { primary: { key: "consistency", points: 2 }, secondary: { key: "friction", points: 1 } } },
        { label: "B", text: "obnovím režim postupne podľa kapacity.", scoring: { primary: { key: "consistency", points: 1 }, secondary: { key: "friction", points: 1 } } },
        { label: "C", text: "potrebujem nový začiatok, takže čakám na „lepší pondelok“.", scoring: { primary: { key: "friction", points: 2 }, secondary: { key: "consistency", points: 1 } } },
      ] },
      { id: 4, question: "Pri dlhšom projekte sa ti osvedčí: ", options: [
        { label: "A", text: "stabilný rytmus s pravidelným kontrolným bodom.", scoring: { primary: { key: "consistency", points: 2 }, secondary: { key: "friction", points: 1 } } },
        { label: "B", text: "kombinácia blokov práce a flexibilnej úpravy plánu.", scoring: { primary: { key: "consistency", points: 1 }, secondary: { key: "friction", points: 1 } } },
        { label: "C", text: "práca v nárazoch podľa momentálnej energie.", scoring: { primary: { key: "friction", points: 2 }, secondary: { key: "consistency", points: 1 } } },
      ] },
    ],
  },
];

export const modulesBySlug: Record<ModuleSlug, FocusModule> = modules.reduce((acc, module) => {
  acc[module.slug] = module;
  return acc;
}, {} as Record<ModuleSlug, FocusModule>);
