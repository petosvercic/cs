import { pickDeterministic } from "./deterministic";

const pools: Record<string, string[]> = {
  "free.signature.tail": [
    "V súčte to vytvára konzistentný rozhodovací štýl, ktorý je čitateľný naprieč rôznymi situáciami.",
    "Dokopy z toho vzniká stabilný podpis rozhodovania, ktorý sa opakuje aj v odlišných kontextoch.",
    "Spolu to tvorí jasný rozhodovací profil, ktorý drží smer aj pri zmene podmienok.",
  ],
  "free.risk.tail": [
    "Odporúčanie je držať jeden krátky checkpoint pred finálnym rozhodnutím: čo viem, čo neviem a čo je minimálny bezpečný krok.",
    "Pomáha krátke zastavenie pred uzavretím voľby: čo je isté, čo je otvorené a aký je najbezpečnejší ďalší krok.",
  ],
  "free.intervention.close": [
    "Po týždni si spätne prejdi 3 rozhodnutia a vyhodnoť: čo fungovalo, čo bolo zbytočné a čo chceš zopakovať.",
    "Po 7 dňoch si skontroluj tri rozhodnutia: čo fungovalo, čo ubrat a čo zaviesť natrvalo.",
  ],
  "full.signature.tail": [
    "Tento podpis je konzistentný: neurčuje jednu „správnu“ stratégiu, ale rámec, v ktorom robíš kvalitnejšie rozhodnutia opakovane.",
    "Profil je stabilný: nejde o jednu ideálnu taktiku, ale o podmienky, v ktorých opakovane rozhoduješ lepšie.",
  ],
  "full.tension.intro": [
    "Najpravdepodobnejšie napätia v tvojom profile:",
    "Body, kde sa v tvojom profile najčastejšie objaví trenie:",
  ],
  "full.plan.intro": [
    "7-dňový plán je nastavený tak, aby zmenil rozhodovanie na praktický režim.",
    "Nasledujúci 7-dňový plán premení výstup na konkrétny každodenný rytmus.",
  ],
};

export const pickCopy = (key: string, seed: string, runIndex: number): string => {
  const variants = pools[key] ?? [""];
  return pickDeterministic(variants, `${seed}:${runIndex}:${key}`);
};
