import type { LevelProfile, RawProfile } from "./decisionModel";
import { modulesBySlug, type ModuleSlug } from "./modules";

type BaseProfile = { raw: RawProfile; level: LevelProfile };

type ModuleScores = {
  raw: Record<string, number>;
  level: Record<string, "low" | "medium" | "high">;
};

export function generateModuleAddon(slug: ModuleSlug, baseProfile: BaseProfile, moduleScores: ModuleScores) {
  const selectedModule = modulesBySlug[slug];
  const [a, b] = selectedModule.subscores;
  const aLevel = moduleScores.level[a];
  const bLevel = moduleScores.level[b];

  if (slug === "praca-priority") {
    return {
      title: "Dodatok: Práca a priority",
      insight: `Tvoj profil ukazuje focus na úrovni ${aLevel} a exekúciu na úrovni ${bLevel}. V kombinácii s tempom rozhodovania (${baseProfile.level.speed}) je kľúčové chrániť bloky pre najdôležitejší výstup dňa.`,
      riskSpot:
        aLevel === "low" || bLevel === "low"
          ? "Rizikom je rozpad priorít pri vstupe urgentných požiadaviek. Bez pevného poradia sa výkon presúva na operatívu namiesto strategických úloh."
          : "Rizikom je preťaženie vysokou ambíciou dokončovať všetko naraz. Kvalita potom klesá v závere dňa pri slabšej mentálnej kapacite.",
      action:
        "Každé ráno nastav 1 hlavný výstup a 2 podporné úlohy. Poobede urob 5-minútové review: čo posunulo hlavný cieľ, čo bol len šum. Tento režim stabilizuje priority aj exekúciu.",
    };
  }

  if (slug === "vztahy-komunikacia") {
    return {
      title: "Dodatok: Vzťahy a komunikácia",
      insight: `V module sa ukazuje directness na úrovni ${aLevel} a empatia na úrovni ${bLevel}. V praxi to určuje, ako jasne vieš doručiť rozhodnutie bez zbytočnej eskalácie napätia.`,
      riskSpot:
        aLevel === "high" && bLevel === "low"
          ? "Rizikom je príliš ostré doručenie bez zohľadnenia prijatia druhej strany. To môže spôsobiť odpor aj pri vecne správnom rozhodnutí."
          : aLevel === "low" && bLevel === "high"
            ? "Rizikom je odklad jasného stanoviska v snahe zachovať harmóniu. Nejednoznačnosť potom predlžuje konflikt aj neistotu tímu."
            : "Rizikom je nejednotný komunikačný štýl medzi rôznymi situáciami. To znižuje predvídateľnosť tvojho rozhodovacieho vedenia.",
      action:
        "Pri náročnej debate použi 3-krokový rámec: rozhodnutie, dôvod, očakávaný ďalší krok. Následne si over porozumenie jednou otázkou. Tento postup vyvažuje jasnosť aj vzťahovosť.",
    };
  }

  if (slug === "peniaze-riziko") {
    return {
      title: "Dodatok: Peniaze a riziko",
      insight: `V module vidno risk disciplínu na úrovni ${aLevel} a impulzivitu na úrovni ${bLevel}. Toto priamo ovplyvňuje stabilitu finančných rozhodnutí v neistote.`,
      riskSpot:
        bLevel === "high"
          ? "Rizikom je reakcia na krátkodobý podnet bez dostatočného rámca straty. Také rozhodnutia môžu mať vyššiu volatilitu výsledku, než je potrebné."
          : "Rizikom je prílišná opatrnosť pri rozhodnutiach s dlhodobým potenciálom. Bez definovaných pravidiel vstupu môžeš vynechať primerané príležitosti.",
      action:
        "Pred každým väčším krokom si zapíš: cieľ, limit straty, podmienku výstupu. Rozhodnutie vykonaj až po tejto kontrole. Znížiš impulzivitu a zvýšiš konzistentnosť výsledkov.",
    };
  }

  return {
    title: "Dodatok: Disciplína a rutiny",
    insight: `Výsledok ukazuje konzistentnosť na úrovni ${aLevel} a mieru vnútorného trenia na úrovni ${bLevel}. To určuje, ako spoľahlivo premieňaš rozhodnutie na dlhodobý výkon.`,
    riskSpot:
      bLevel === "high"
        ? "Rizikom je odklad kľúčových krokov pri vyššom odpore. Bez minimálneho štandardu sa rutina rozpadá a rozhodnutia ostávajú bez exekúcie."
        : "Rizikom je preťaženie príliš ambicióznym režimom. Ak systém nie je udržateľný, výkon kolíše napriek dobrej motivácii.",
    action:
      "Zaveď minimálnu verziu rutiny (10 minút denne), ktorú splníš aj v náročnom dni. Každý týždeň pridaj len jeden prvok navyše. Tento postup buduje disciplínu bez zbytočného trenia.",
  };
}
