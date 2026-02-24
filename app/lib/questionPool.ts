import { hashToInt } from "./deterministic";
import type { OptionLabel } from "./decisionModel";

export type SlotId = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type QuestionVariant = {
  id: string;
  question: string;
  options: { label: OptionLabel; text: string }[];
};

export const slotIds: SlotId[] = [1, 2, 3, 4, 5, 6, 7];

export const questionPool: Record<SlotId, QuestionVariant[]> = {
  1: [
    { id: "q1-v1", question: "Keď musíš rozhodnúť rýchlo, čo je tvoj prvý krok?", options: [{ label: "A", text: "Rozhodnem hneď podľa prvého silného signálu." }, { label: "B", text: "Dám si krátku pauzu a overím 1–2 fakty." }, { label: "C", text: "Najprv si ujasním širší kontext, až potom volím." }] },
    { id: "q1-v2", question: "V časovej tiesni pri rozhodnutí typicky:", options: [{ label: "A", text: "idem okamžite podľa toho, čo najviac svieti." }, { label: "B", text: "spravím mikro-kontrolu faktov a potom uzavriem voľbu." }, { label: "C", text: "zastavím sa a najprv doplním širší obraz." }] },
    { id: "q1-v3", question: "Keď je tlak na rýchlosť, najčastejšie:", options: [{ label: "A", text: "urobím voľbu bez odkladu." }, { label: "B", text: "rýchlo si potvrdím kľúčové body." }, { label: "C", text: "spomalím a domapujem kontext." }] },
  ],
  2: [
    { id: "q2-v1", question: "Ako zvyčajne spracúvaš nové informácie?", options: [{ label: "A", text: "Skôr intuitívne, podľa celkového dojmu." }, { label: "B", text: "Kombinujem rýchly odhad s pár konkrétnymi dátami." }, { label: "C", text: "Systematicky: štruktúra, porovnanie, až potom záver." }] },
    { id: "q2-v2", question: "Keď sa objaví nová informácia, tvoj štandard je:", options: [{ label: "A", text: "zachytím celkový pocit a idem ďalej." }, { label: "B", text: "rýchlo prepojím intuíciu s pár tvrdými bodmi." }, { label: "C", text: "urobím poriadok v dátach a až potom rozhodnem." }] },
    { id: "q2-v3", question: "Pri vyhodnocovaní vstupov sa viac opieraš o:", options: [{ label: "A", text: "dojem a pattern, ktorý cítiš." }, { label: "B", text: "mix štruktúry a rýchleho odhadu." }, { label: "C", text: "dôslednú analýzu a porovnanie možností." }] },
  ],
  3: [
    { id: "q3-v1", question: "Ako reaguješ, keď chýbajú dôležité informácie?", options: [{ label: "A", text: "Aj tak idem ďalej a rozhodnem s tým, čo mám." }, { label: "B", text: "Spravím dočasné rozhodnutie a nechám priestor na úpravu." }, { label: "C", text: "Počkám, kým doplním kritické dáta." }] },
    { id: "q3-v2", question: "V neistote bez kompletných dát väčšinou:", options: [{ label: "A", text: "volíš smer aj s neúplným obrazom." }, { label: "B", text: "dáš dočasné rozhodnutie a priebežne ho ladíš." }, { label: "C", text: "radšej zbieraš dáta, kým je obraz jasný." }] },
    { id: "q3-v3", question: "Keď niečo chýba, tvoja voľba je:", options: [{ label: "A", text: "konať aj s neúplnou istotou." }, { label: "B", text: "urobiť predbežné rozhodnutie." }, { label: "C", text: "doplniť kritické informácie." }] },
  ],
  4: [
    { id: "q4-v1", question: "Pod časovým tlakom máš tendenciu:", options: [{ label: "A", text: "zostať vecný/vecná a ísť po priorite." }, { label: "B", text: "udržať výkon, ale cítiť vyššie napätie." }, { label: "C", text: "stratiť istotu a prehodnocovať viac, než treba." }] },
    { id: "q4-v2", question: "Keď sa situácia zrýchli a tlačí čas, typicky:", options: [{ label: "A", text: "udržíš smer a riešiš to najdôležitejšie." }, { label: "B", text: "funguješ ďalej, ale za cenu vnútorného tlaku." }, { label: "C", text: "vraciaš sa k voľbe a ťažšie ju uzatváraš." }] },
    { id: "q4-v3", question: "V náročnom tempe zvyčajne:", options: [{ label: "A", text: "držíš prioritu a ideš ďalej." }, { label: "B", text: "výkon držíš, no cítiš napätie." }, { label: "C", text: "váhaš a znova prepočítavaš." }] },
  ],
  5: [
    { id: "q5-v1", question: "Ako veľmi potrebuješ mať rozhodovanie pod kontrolou?", options: [{ label: "A", text: "Preferujem jasný rámec a definované pravidlá." }, { label: "B", text: "Stačí mi základný plán, zvyšok doladím počas cesty." }, { label: "C", text: "Som v pohode aj pri voľnejšom, otvorenom postupe." }] },
    { id: "q5-v2", question: "Pri rozhodovaní ti najviac sedí:", options: [{ label: "A", text: "presne nastavený proces a pevné pravidlá." }, { label: "B", text: "rámec, ktorý vieš podľa situácie upraviť." }, { label: "C", text: "voľnosť bez potreby detailného plánu." }] },
    { id: "q5-v3", question: "V rozhodovacom procese preferuješ:", options: [{ label: "A", text: "jasné body kontroly." }, { label: "B", text: "plán s flexibilitou." }, { label: "C", text: "otvorený postup bez pevného rámca." }] },
  ],
  6: [
    { id: "q6-v1", question: "Pri nečakanej zmene priorít najčastejšie:", options: [{ label: "A", text: "rýchlo prepnem smer a riešim najakútnejšie kroky." }, { label: "B", text: "krátko prehodnotím dopady a nastavím nový plán." }, { label: "C", text: "radšej stabilizujem podmienky, potom pokračujem." }] },
    { id: "q6-v2", question: "Keď sa priority náhle zmenia, tvoj štýl je:", options: [{ label: "A", text: "okamžite prepnúť na najurgentnejšie body." }, { label: "B", text: "spraviť rýchle prepočítanie dopadov a upraviť plán." }, { label: "C", text: "najprv vytvoriť stabilitu, potom sa pohnúť ďalej." }] },
    { id: "q6-v3", question: "Pri neočakávanom prehodení priorít:", options: [{ label: "A", text: "ideš hneď po kritickom bode." }, { label: "B", text: "dáš krátky reset a preplánuješ." }, { label: "C", text: "najprv stabilizuješ systém." }] },
  ],
  7: [
    { id: "q7-v1", question: "Keď rozhodnutie nevyjde podľa plánu, tvoja prvá reakcia je:", options: [{ label: "A", text: "rýchlo urobiť korekciu a pokračovať." }, { label: "B", text: "analyzovať, čo sa pokazilo, a upraviť postup." }, { label: "C", text: "obmedziť ďalšie riziko a zvoliť istejší variant." }] },
    { id: "q7-v2", question: "Ak výsledok nesadne podľa očakávania, typicky:", options: [{ label: "A", text: "hneď robíš opravu a ideš ďalej." }, { label: "B", text: "spätne rozoberieš chybu a upravíš systém." }, { label: "C", text: "zvolíš konzervatívnejší krok na ochranu výsledku." }] },
    { id: "q7-v3", question: "Po neúspešnom výsledku obvykle:", options: [{ label: "A", text: "koriguješ kurz bez odkladu." }, { label: "B", text: "urobíš rýchly rozbor a úpravu." }, { label: "C", text: "stiahneš riziko a zvolíš istotu." }] },
  ],
};

export const selectBaseQuizVariants = (seed: string, attempt: number): Record<SlotId, QuestionVariant> => {
  const selection = {} as Record<SlotId, QuestionVariant>;
  for (const slotId of slotIds) {
    const pool = questionPool[slotId];
    const idx = hashToInt(`${seed}:${attempt}:${slotId}`) % pool.length;
    selection[slotId] = pool[idx];
  }
  return selection;
};

export const resolveVariantsFromIds = (ids: Partial<Record<SlotId, string>>): Record<SlotId, QuestionVariant> | null => {
  const resolved = {} as Record<SlotId, QuestionVariant>;
  for (const slotId of slotIds) {
    const variantId = ids[slotId];
    const found = questionPool[slotId].find((variant) => variant.id === variantId);
    if (!found) return null;
    resolved[slotId] = found;
  }
  return resolved;
};
