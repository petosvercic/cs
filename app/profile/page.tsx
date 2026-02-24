"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { canAccessModule, getModuleStatus } from "../lib/access";
import { scoreAnswers, type OptionLabel, questions } from "../lib/decisionModel";
import { generateModuleAddon } from "../lib/moduleAddonGen";
import { scoreModuleAnswers } from "../lib/moduleScoring";
import { modules, modulesBySlug, type ModuleOptionLabel, type ModuleSlug } from "../lib/modules";
import { resolveVariantsFromIds, selectBaseQuizVariants, slotIds } from "../lib/questionPool";
import { generateFreeReport, generateFullReport } from "../lib/reportGen";
import { generateSynthesisReport } from "../lib/synthesisGen";
import { createNextRunState, deriveProfileMode, ensureBaseRunConfig, getAnsweredCount, loadVioraState, patchVioraState, resetQuizButKeepUnlocks, saveVioraState, type ProfileMode, type VioraStateV1 } from "../lib/vioraState";

type TransitionPhase = "idle" | "transitioning";
type AddonResult = { title: string; insight: string; riskSpot: string; action: string };
type PurchaseIntent = { kind: "full" | "addon" | "mini_report"; moduleSlug?: ModuleSlug };

const LS_PREMIUM_PRICE_WARNING = "viora_premium_price_warning";
const LS_PENDING_PURCHASE = "viora_pending_purchase";

const tuningOptions = [
  "Rýchlejšie rozhodovanie",
  "Menej stresu v neistote",
  "Menej zacyklenia na detailoch",
  "Lepšie zvládanie tlaku",
  "Rozumná kontrola",
] as const;

type ChangePlan = {
  title: string;
  horizonDays: number;
  checklist: { day: number; items: string[] }[];
  triggers: string[];
  metrics: string[];
  pitfalls: string[];
  fallback: string[];
};

const changePlanByFocus: Record<(typeof tuningOptions)[number], ChangePlan> = {
  "Rýchlejšie rozhodovanie": {
    title: "Rýchlejšie rozhodovanie",
    horizonDays: 7,
    checklist: [
      { day: 1, items: ["Pred rozhodnutím napíš 2 možnosti + 1 riziko pre každú (max 60s).", "Nastav limit na finálne rozhodnutie: 10 minút."] },
      { day: 2, items: ["Použi pravidlo ‚jedna kontrola navyše‘: over iba 1 kritický údaj.", "Po rozhodnutí zapíš dôvod do jednej vety."] },
      { day: 3, items: ["Pri 3 bežných rozhodnutiach použi rovnaký rámec 2 možnosti/1 riziko.", "Sleduj, kde si prekročil časový limit."] },
      { day: 4, items: ["Odstráň jedno zbytočné porovnanie variantov.", "Neotváraj rozhodnutie znova bez novej informácie."] },
      { day: 5, items: ["Pred dôležitým krokom skontroluj iba dopad + reversibilitu.", "Ak je krok reverzibilný, rozhodni okamžite."] },
      { day: 6, items: ["Sprav review 5 rozhodnutí: ktoré boli zbytočne odložené.", "Zvoľ jedno pravidlo, ktoré budeš držať aj budúci týždeň."] },
      { day: 7, items: ["Urob 15-min retrospektívu: rýchlosť vs. kvalita.", "Nastav cieľ na ďalších 7 dní."] },
    ],
    triggers: ["Keď stráviš nad rozhodnutím viac než 8 minút.", "Keď porovnávaš viac ako 2 varianty bez nových dát."],
    metrics: ["Počet odložených rozhodnutí za deň (cieľ ≤ 2).", "Medián času od zadania po rozhodnutie."],
    pitfalls: ["Návrat do opakovaného porovnávania.", "Prehnaná kontrola detailov pri reverzibilných krokoch."],
    fallback: ["Ak sa zasekneš: vyber najbezpečnejší ďalší krok na 24h.", "Ak chýbajú dáta: nastav 15-min timebox a rozhodni s poznámkou ‚revízia zajtra‘."],
  },
  "Menej stresu v neistote": {
    title: "Menej stresu v neistote",
    horizonDays: 7,
    checklist: [
      { day: 1, items: ["Pred rizikovým rozhodnutím 3 nádychy 4-4-6.", "Pomenúj najhorší realistický scenár v 1 vete."] },
      { day: 2, items: ["Definuj hranicu straty (čas/peniaze/energia).", "Nastav podmienku ‚stop‘ ešte pred rozhodnutím."] },
      { day: 3, items: ["V neistote zapisuj iba to, čo vieš vs. čo nevieš.", "Nerob tretí scenár, stačia 2 varianty." ] },
      { day: 4, items: ["Pri pocite tlaku sa spýtaj: ‚čo je najmenší ďalší krok?‘", "Urob tento krok do 5 minút." ] },
      { day: 5, items: ["Po rozhodnutí vyhodnoť stres 1–10.", "Pridaj krátky reset po náročnej voľbe (2 min)." ] },
      { day: 6, items: ["Zmapuj situácie, ktoré ťa spúšťajú.", "Ku každej spúšťačke dopíš jednu odpoveď." ] },
      { day: 7, items: ["Review: ktoré rozhodnutia mali nižší stres a prečo.", "Zafixuj 2 techniky, ktoré fungovali." ] },
    ],
    triggers: ["Keď nevieš predikovať výsledok.", "Keď cítiš telesné napätie pred rozhodnutím."],
    metrics: ["Priemerný stres pred rozhodnutím (1–10).", "Počet rozhodnutí dokončených bez odkladu."],
    pitfalls: ["Snaha mať 100 % istotu pred krokom.", "Vyhýbanie sa rozhodnutiu pod zámienkou ‚ešte si to premyslím‘."],
    fallback: ["Použi iba 1 bezpečný experiment na 24 hodín.", "Ak stres stúpne nad 8/10, rozhodnutie rozdrob na 2 menšie kroky."],
  },
  "Menej zacyklenia na detailoch": {
    title: "Menej zacyklenia na detailoch",
    horizonDays: 7,
    checklist: [
      { day: 1, items: ["Urči 3 kritériá kvality pre dnešné rozhodnutia.", "Všetko mimo týchto 3 kritérií ignoruj." ] },
      { day: 2, items: ["Pri každom rozhodnutí zastav analýzu po 2 zdrojoch.", "Nevytváraj ďalší zoznam bez nového faktu." ] },
      { day: 3, items: ["Nastav timebox 12 minút na prípravu.", "Po timeboxe musí nasledovať voľba variantu." ] },
      { day: 4, items: ["Použi pravidlo 80/20: ktorý detail mení výsledok najviac?", "Zvyšok nechaj na následnú kontrolu." ] },
      { day: 5, items: ["Pred uzavretím rozhodnutia skontroluj iba 1 rizikový detail.", "Neprepisuj rozhodnutie celé." ] },
      { day: 6, items: ["Review 3 situácií, kde si šiel príliš do hĺbky.", "Napíš, čo bolo v skutočnosti dôležité." ] },
      { day: 7, items: ["Nastav osobný limit: max 2 kolá revízie.", "Po 2. kole rozhodnutie uzavri." ] },
    ],
    triggers: ["Keď pridávaš tretí a ďalší detail bez dopadu na výsledok.", "Keď sa vraciaš k už uzavretému rozhodnutiu."],
    metrics: ["Počet rozhodnutí s >2 revíziami (cieľ 0).", "Čas strávený na príprave vs. exekúcii."],
    pitfalls: ["Perfekcionizmus maskovaný ako kvalita.", "Dlhé porovnávanie podobných variantov."],
    fallback: ["Použi otázku: ‚Ktorý 1 detail zmení výsledok?‘", "Ak nevieš, uzavri rozhodnutie a nastav revíziu o 24h."],
  },
  "Lepšie zvládanie tlaku": {
    title: "Lepšie zvládanie tlaku",
    horizonDays: 7,
    checklist: [
      { day: 1, items: ["Pred začiatkom dňa urč top 1 prioritu.", "Každý tlakový vstup porovnaj voči top priorite." ] },
      { day: 2, items: ["Pri eskalácii použi sekvenciu: stop → dýchaj → rozhodni ďalší krok.", "Zapíš krok do 1 vety." ] },
      { day: 3, items: ["Rozdeľ náročné rozhodnutie na 3 menšie kroky.", "Každý krok ukonči mini-checkpointom." ] },
      { day: 4, items: ["V strese eliminuj multitasking počas rozhodovania.", "Udrž len jednu aktívnu rozhodovaciu úlohu." ] },
      { day: 5, items: ["Po tlakovom bloku sprav 3-min reset.", "Zhodnoť kvalitu rozhodnutia 1–5." ] },
      { day: 6, items: ["Identifikuj 2 opakované tlaky v týždni.", "Ku každému priprav vopred odpoveď." ] },
      { day: 7, items: ["Týždenné review: čo fungovalo pod tlakom.", "Zafixuj 1 rutinu pre ďalší týždeň." ] },
    ],
    triggers: ["Keď prídu 3+ požiadavky naraz.", "Keď cítiš, že rozhoduješ v časovej panike."],
    metrics: ["Počet impulzívnych rozhodnutí pod tlakom.", "Subjektívna kvalita rozhodnutí v záťaži (1–5)."],
    pitfalls: ["Skok na prvý variant bez kontroly dopadu.", "Chaotická zmena priorít počas dňa."],
    fallback: ["Ak tlak rastie: rozhodni iba najbližší bezpečný krok.", "Ak sa nevieš sústrediť: 2-min reset + návrat k top priorite."],
  },
  "Rozumná kontrola": {
    title: "Rozumná kontrola",
    horizonDays: 7,
    checklist: [
      { day: 1, items: ["Rozdeľ úlohy na ‚riadiť‘ vs ‚monitorovať‘.", "Vyber len 2 oblasti, ktoré budeš riadiť denne." ] },
      { day: 2, items: ["Vytvor 1 jednoduchý checklist rozhodnutia (max 4 body).", "Používaj ten istý checklist celý deň." ] },
      { day: 3, items: ["Pri každom rozhodnutí urči, čo deleguješ.", "Nepreberaj späť delegované body bez dôvodu." ] },
      { day: 4, items: ["Skontroluj len metriky s dopadom na cieľ.", "Odstráň 1 kontrolu, ktorá nič nemení." ] },
      { day: 5, items: ["Nastav čas na kontrolu: 2 pevné okná denne.", "Mimo okien nekontroluj detaily." ] },
      { day: 6, items: ["Review: kde kontrola pomohla vs. brzdila.", "Zachovaj len funkčné pravidlá." ] },
      { day: 7, items: ["Zhrň 3 pravidlá rozumnej kontroly.", "Prenes ich do ďalšieho týždňa." ] },
    ],
    triggers: ["Keď kontroluješ tie isté veci opakovane.", "Keď delegované úlohy začneš mikromanažovať."],
    metrics: ["Počet zbytočných kontrol za deň.", "Podiel delegovaných krokov dokončených bez zásahu."],
    pitfalls: ["Mikromanažment pri nízkom riziku.", "Kontrola bez prepojenia na cieľ."],
    fallback: ["Vráť sa k pravidlu 2 riadené premenné denne.", "Ak cítiš chaos, obnov checklist 4 bodov a pokračuj."],
  },
};

const plannedUpgradeItems = [
  "Viora Coaching (plánované).",
  "Viora Weekly (plánované).",
  "Viora Review (plánované).",
  "Viora Tracker (plánované).",
];

export const landingHeadlines = [
  "Viora Profile: rozhodovanie v 1 vete + plán na 7 dní",
  "Prestaň overthinkovať. Daj tomu rámec za 2 min.",
  "Zistíš svoj “rozhodovací podpis” a čo s tým",
  "Menej stresu v neistote: konkrétny mini plán",
  "Komunikácia pod tlakom? Tu máš rituál",
  "Priority bez chaosu: 1 úloha denne",
  "Finančné rozhodnutia: nastav hranice rizika",
  "Hlboká analýza, mini reporty, tuning zmeny",
  "Nie motivácia. Checklist, ktorý funguje.",
  "Viora: praktický decision coach (bez kecov).",
] as const;

export const overlayLines = [
  "Rozhodovanie v 1 vete",
  "Prestaň sa točiť dokola",
  "7-dňový plán, nie motivácia",
  "Tvoj rozhodovací podpis",
  "Menej stresu, viac krokov",
  "2 min. Výstup hneď",
  "Neistota? Tu máš rámec",
  "Vyber 2 oblasti v cene",
  "Mini otázky = presnejší výsledok",
  "Mini report za 0.99€",
  "Tuning: vyber 1–2 focusy",
  "Checklist zmeny na 7 dní",
  "Fakty. Kroky. Hotovo.",
  "Pre ľudí, čo overthinkujú",
  "Zaseknutý? Urob najmenší krok",
  "Menej detailov, viac výsledkov",
  "Pod tlakom komunikujem zle",
  "Viora ti to zjednoduší",
  "Max strata. Max zisk.",
  "Minimum deň: 12 min",
  "1 úloha dnes. Dokonči.",
  "Nastav hranice rozhodovania",
  "Zdieľateľný highlight, nie román",
  "Bez AI balastu",
  "Reálne návyky, nie teória",
  "Zmena bez preťaženia",
  "Tvoj plán, tvoj štýl",
  "Mini výsledok hneď teraz",
  "Viora Profile zdarma",
  "Premium = hlboký výsledok",
] as const;

const buildMiniReportTextFromBase = (slug: ModuleSlug, baseAnswers: Record<number, OptionLabel> | undefined) => {
  const moduleMeta = modulesBySlug[slug];
  const baseScore = scoreAnswers(baseAnswers ?? {});
  return `${moduleMeta.title}

Mini report bol vytvorený z tvojho základného profilu (${baseScore.level.speed}/${baseScore.level.processing}/${baseScore.level.risk}) a vybraného kontextu.

Najbližší krok: nastav jeden konkrétny rozhodovací rituál pre tento kontext na najbližších 7 dní.`;
};

const focusTooltips: Record<(typeof tuningOptions)[number], string> = {
  "Rýchlejšie rozhodovanie": "Skráti rozhodovací cyklus bez chaotických skratiek.",
  "Menej stresu v neistote": "Zníži tlak pri nejasnosti a stabilizuje reakcie.",
  "Menej zacyklenia na detailoch": "Pomôže pustiť mikrokontrolu a ísť na podstatu.",
  "Lepšie zvládanie tlaku": "Zlepší výkon pod tlakom bez preťaženia.",
  "Rozumná kontrola": "Nastaví hranice kontroly bez rigidity.",
};

const hashSeedToIndex = (seedText: string, modulo: number) => {
  let hash = 0;
  for (let i = 0; i < seedText.length; i += 1) {
    hash = (hash << 5) - hash + seedText.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % modulo;
};

type PersonalProof = { choice: string; signal: string; impact: string };

function HoverTip({ text, children }: { text: string; children: import("react").ReactNode }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span role="tooltip" className="pointer-events-none absolute left-1/2 top-full z-40 mt-1 w-56 -translate-x-1/2 rounded-md bg-slate-900 px-2 py-1 text-[11px] text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        {text}
      </span>
    </span>
  );
}

export default function ProfilePage() {
  const [state, setState] = useState<VioraStateV1 | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const [step, setStep] = useState(0);
  const [transitionPhase, setTransitionPhase] = useState<TransitionPhase>("idle");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [purchaseIntent, setPurchaseIntent] = useState<PurchaseIntent | null>(null);
  const [billingMessage, setBillingMessage] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [activeHeadline, setActiveHeadline] = useState<(typeof landingHeadlines)[number]>(landingHeadlines[0]);

  const [selectedModule, setSelectedModule] = useState<ModuleSlug | null>(null);
  const [moduleStep, setModuleStep] = useState(0);
  const [moduleAnswers, setModuleAnswers] = useState<Record<number, ModuleOptionLabel>>({});
  const [moduleNotice, setModuleNotice] = useState<string | null>(null);
  const [moduleTransition, setModuleTransition] = useState<TransitionPhase>("idle");
  const [pendingModulePurchase, setPendingModulePurchase] = useState<ModuleSlug | null>(null);
  const [completedAddons, setCompletedAddons] = useState<Partial<Record<ModuleSlug, AddonResult>>>({});

  const [premiumMiniAnswers, setPremiumMiniAnswers] = useState<Partial<Record<ModuleSlug, Record<number, ModuleOptionLabel>>>>({});
  const [premiumMiniModuleIndex, setPremiumMiniModuleIndex] = useState(0);
  const [premiumMiniQuestionIndex, setPremiumMiniQuestionIndex] = useState(0);
  const [premiumMiniTransition, setPremiumMiniTransition] = useState<TransitionPhase>("idle");
  const [miniFlowDone, setMiniFlowDone] = useState(false);
  const [miniFlowNotice, setMiniFlowNotice] = useState<string | null>(null);
  const [microToast, setMicroToast] = useState<string | null>(null);

  const [activeMiniReportModule, setActiveMiniReportModule] = useState<ModuleSlug | null>(null);
  const [miniReportAnswersByModule, setMiniReportAnswersByModule] = useState<Partial<Record<ModuleSlug, Record<number, ModuleOptionLabel>>>>({});
  const [miniReportQuestionByModule, setMiniReportQuestionByModule] = useState<Partial<Record<ModuleSlug, number>>>({});
  const [miniReportStatusByModule, setMiniReportStatusByModule] = useState<Partial<Record<ModuleSlug, "locked" | "collecting" | "ready">>>({});
  const [miniReportResultByModule, setMiniReportResultByModule] = useState<Partial<Record<ModuleSlug, { insight: string; nextStep: string; metric: string; trigger: string }>>>({});

  const unlockRef = useRef<HTMLButtonElement | null>(null);
  const changePlanRef = useRef<HTMLElement | null>(null);

  const patchState = (patch: Partial<VioraStateV1>) => {
    setState((prev) => {
      const base = prev ?? ensureBaseRunConfig(loadVioraState());
      const next = patchVioraState(base, patch);
      saveVioraState(next);
      return next;
    });
  };

  const answers = state?.base.answers ?? {};
  const seed = state?.base.seed ?? "viora";
  const attempt = state?.base.attempt ?? 0;
  const mode: ProfileMode = state ? deriveProfileMode(state) : "quiz";
  const premiumStep = state?.ui.premiumStep ?? 1;
  const premiumStepLabels: Record<1 | 2 | 3 | 4 | 5, string> = {
    1: "Premium zone",
    2: "Upgreade",
    3: "Sub...",
    4: "Analisis",
    5: "Tuning",
  };

  const includedPremiumModules = useMemo(() => (state?.unlocks.included ?? []).filter((slug) => modulesBySlug[slug]), [state?.unlocks.included]);
  const activePremiumMiniModuleSlug = includedPremiumModules[premiumMiniModuleIndex] ?? null;
  const activePremiumMiniModule = activePremiumMiniModuleSlug ? modulesBySlug[activePremiumMiniModuleSlug] : null;
  const activePremiumMiniQuestion = activePremiumMiniModule ? activePremiumMiniModule.questions[premiumMiniQuestionIndex] : null;

  const selectedVariants = useMemo(() => {
    const resolved = resolveVariantsFromIds(state?.base.selectedQuestionIds ?? {});
    if (resolved) return resolved;
    return selectBaseQuizVariants(seed, attempt);
  }, [state?.base.selectedQuestionIds, seed, attempt]);

  const currentSlotId = slotIds[Math.min(step, slotIds.length - 1)];
  const currentQuestion = selectedVariants[currentSlotId];
  const progress = ((Math.min(step, questions.length - 1) + 1) / questions.length) * 100;

  const scored = useMemo(() => scoreAnswers(answers), [answers]);
  const freeReport = useMemo(() => generateFreeReport(scored, { seed, runIndex: attempt }), [scored, seed, attempt]);
  const fullReport = useMemo(() => generateFullReport(scored, { seed, runIndex: attempt }), [scored, seed, attempt]);

  const premiumMiniResults = useMemo(() => {
    return includedPremiumModules
      .map((slug) => {
        const moduleAnswerSet = premiumMiniAnswers[slug];
        if (!moduleAnswerSet) return null;
        const answeredCount = Object.keys(moduleAnswerSet).length;
        if (answeredCount === 0) return null;
        const scores = scoreModuleAnswers(slug, moduleAnswerSet);
        return generateModuleAddon(slug, scored, scores);
      })
      .filter((item): item is AddonResult => item !== null);
  }, [includedPremiumModules, premiumMiniAnswers, scored]);

  const synthesis = useMemo(() => {
    if (!state) return null;
    return generateSynthesisReport({
      profile: scored,
      fullReport,
      included: state.unlocks.included ?? [],
      purchased: state.unlocks.addons ?? [],
      tuningChoices: state.tuning.choices ?? [],
      miniContextInsights: premiumMiniResults.map((item) => `${item.title}: ${item.insight}`),
      seed,
      attempt,
    });
  }, [state, scored, fullReport, seed, attempt, premiumMiniResults]);


  const personalProofs = useMemo<PersonalProof[]>(() => {
    const proofItems: PersonalProof[] = [];
    const dimensionSignals: Record<string, { low: string; medium: string; high: string }> = {
      speed: { low: "V rozhodovaní si dávaš čas na širší kontext pred finálnym krokom.", medium: "Pri dôležitých voľbách kombinuješ tempo s krátkym overením.", high: "Máš tendenciu ísť rýchlo po prvom silnom signále." },
      processing: { low: "Viac sa opieraš o intuívny obraz než o detailnú štruktúru.", medium: "Používaš mix rýchleho odhadu a konkrétnych dát.", high: "Preferuješ systematické porovnanie pred záverom." },
      risk: { low: "V neistote skôr čakáš na kritické informácie.", medium: "Vieš spraviť dočasný krok a nechať priestor na úpravu.", high: "Aj pri neúplných dátach pokračuješ a rozhoduješ rýchlo." },
      pressure: { low: "Pod tlakom sa častejšie vraciaš k prehodnocovaniu.", medium: "Výkon držíš, ale cítiš rastúce napätie.", high: "Pod záťažou zväčša ostávaš vecný a prioritizuješ." },
      control: { low: "Vyhovuje ti otvorenejší postup bez silnej kontroly.", medium: "Stačí ti základný rámec a detaily dolaďuješ priebežne.", high: "Preferuješ jasné pravidlá a kontrolný rámec." },
    };
    const dimensionImpacts: Record<string, string> = {
      speed: "V praxi to mení tempo uzatvárania rozhodnutí a počet návratov späť.",
      processing: "Prejaví sa to v tom, koľko štruktúry potrebuješ pred finálnym rozhodnutím.",
      risk: "V praxi to ovplyvňuje, ako rýchlo konáš, keď chýbajú dáta.",
      pressure: "Najviac to vidno v kvalite rozhodnutí počas časového tlaku.",
      control: "Prejaví sa to v tom, koľko rámca potrebuješ, aby si sa cítil stabilne.",
    };

    for (const q of questions) {
      if (proofItems.length >= 5) break;
      const selected = answers[q.id];
      if (!selected) continue;
      const option = q.options.find((item) => item.label === selected);
      if (!option) continue;
      const dim = option.scoring.primary.dimension;
      const level = scored.level[dim];
      proofItems.push({
        choice: `${q.question} → ${option.label}: ${option.text}`,
        signal: dimensionSignals[dim][level],
        impact: dimensionImpacts[dim],
      });
    }

    for (const slug of includedPremiumModules) {
      if (proofItems.length >= 5) break;
      const answerSet = premiumMiniAnswers[slug];
      if (!answerSet) continue;
      const moduleDef = modulesBySlug[slug];
      const answeredEntry = Object.entries(answerSet)[0];
      if (!answeredEntry) continue;
      const qId = Number(answeredEntry[0]);
      const label = answeredEntry[1];
      const moduleQ = moduleDef.questions.find((item) => item.id === qId);
      const moduleOption = moduleQ?.options.find((item) => item.label === label);
      if (!moduleQ || !moduleOption) continue;
      proofItems.push({
        choice: `${moduleDef.title}: ${moduleOption.label} – ${moduleOption.text}`,
        signal: `V kontexte „${moduleDef.title}“ preferuješ štýl, ktorý sa opakuje aj v hlbokej analýze.`,
        impact: "Tento kontextový signál spresňuje odporúčania v praktických situáciách.",
      });
    }

    return proofItems.slice(0, 5);
  }, [answers, scored.level, includedPremiumModules, premiumMiniAnswers]);

  const moduleConfig = selectedModule ? modulesBySlug[selectedModule] : null;
  const activeModuleQuestion = moduleConfig ? moduleConfig.questions[moduleStep] : null;

  const copyText = async (text: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setShareMessage("Skopírované do schránky ✅");
    } catch {
      setShareMessage("Nepodarilo sa skopírovať text.");
    }
  };


  const getShareRefId = () => {
    const key = "viora_share_ref";
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const created = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(key, created);
    return created;
  };

  const shareWithLink = async (text: string, shareTitle?: string) => {
    const ref = getShareRefId();
    const url = `${window.location.origin}/s/${ref}`;
    const payload = `${text}
${url}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: shareTitle ?? "Viora: Personal Analysis", text, url });
      } else {
        await copyText(payload);
      }
      setShareMessage("Skopírované. Môžeš to hodiť do chatu.");
    } catch {
      setShareMessage("Zdieľanie bolo zrušené alebo zlyhalo.");
    }
  };

  const showToast = (text: string) => {
    setMicroToast(text);
    window.setTimeout(() => setMicroToast(null), 2200);
  };

  const getMiniReportTemplate = (slug: ModuleSlug) => {
    if (slug === "vztahy-komunikacia") {
      return {
        insight: "Tvoj štýl pod tlakom je „skrátiť komunikáciu“, čo druhá strana často číta ako chlad.",
        nextStep: "7 dní: pred dôležitou odpoveďou použi 20-sek “jasno + citlivo”: 1 fakt + 1 pocit + 1 ďalší krok.",
        metric: "Koľkokrát denne si použil “fakt + pocit + krok” (cieľ: 1–2x).",
        trigger: "Keď cítiš napätie v hrudi alebo potrebu “to ukončiť”.",
      };
    }
    if (slug === "disciplina-rutiny") {
      return {
        insight: "Najviac ťa neláme motivácia, ale preťažený štart a potom nulový dopad.",
        nextStep: "7 dní: nastav “minimum deň”: 12 min práce na 1 úlohe + stop.",
        metric: "Počet dní s “minimum deň” (cieľ: 5/7).",
        trigger: "Keď sa ti nechce začať alebo “už je neskoro”.",
      };
    }
    if (slug === "peniaze-riziko") {
      return {
        insight: "V rozhodovaní o peniazoch ti robí problém hranica: kedy je to ešte disciplína a kedy už strach.",
        nextStep: "7 dní: pred väčším rozhodnutím urob 60-sek “limit”: max strata, max zisk, a jedno “ak-tak”.",
        metric: "Počet rozhodnutí s napísaným “max strata” (cieľ: 3× týždenne).",
        trigger: "Keď sa objaví nutkanie kliknúť / kúpiť / investovať impulzívne.",
      };
    }
    return {
      insight: "Tvoj problém nie je plán, ale prechod z plánovania do dokončenia.",
      nextStep: "7 dní: každý deň si vyber 1 “dokončiť-dnes” úlohu a rozbi ju na 2 mikro-kroky (15–25 min).",
      metric: "Počet dní s dokončenou 1 úlohou (cieľ: 4/7).",
      trigger: "Keď začneš skákať medzi úlohami alebo otvárať nové tabu.",
    };
  };

  useEffect(() => {
    const loaded = ensureBaseRunConfig(loadVioraState());
    const withMode = patchVioraState(loaded, { ui: { ...loaded.ui, lastMode: deriveProfileMode(loaded) } });
    saveVioraState(withMode);
    setState(withMode);

    const answered = getAnsweredCount(withMode);
    if (answered > 0) setStep(Math.min(answered - 1, questions.length - 1));

    if (localStorage.getItem(LS_PREMIUM_PRICE_WARNING) === "true") {
      setBillingMessage("0,99 € cena pre Plus modul nie je nakonfigurovaná, použila sa základná cena 2,99 €.");
      localStorage.removeItem(LS_PREMIUM_PRICE_WARNING);
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get("canceled") === "1") setBillingMessage("Platba bola zrušená. Môžeš to skúsiť znova.");

    const sessionId = params.get("session_id");
    if (!sessionId) {
      setHydrated(true);
      return;
    }

    const verify = async () => {
      try {
        setIsVerifying(true);
        const res = await fetch("/api/stripe/verify", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const data = await res.json();

        setState((prev) => {
          if (!prev) return prev;
          if (data?.ok && data?.kind === "full") {
            const next = patchVioraState(prev, {
              unlocks: { ...prev.unlocks, full: true },
              ui: { ...prev.ui, lastMode: "premium_steps", premiumStep: 1 },
            });
            saveVioraState(next);
            return next;
          }
          if (data?.ok && data?.kind === "addon" && typeof data?.moduleSlug === "string" && data.moduleSlug in modulesBySlug) {
            const slug = data.moduleSlug as ModuleSlug;
            const next = patchVioraState(prev, {
              unlocks: { ...prev.unlocks, addons: Array.from(new Set([...(prev.unlocks.addons ?? []), slug])) },
            });
            saveVioraState(next);
            return next;
          }
          if (data?.ok && data?.kind === "mini_report" && typeof data?.moduleSlug === "string" && data.moduleSlug in modulesBySlug) {
            const slug = data.moduleSlug as ModuleSlug;
            const next = patchVioraState(prev, {
              unlocks: { ...prev.unlocks, miniReports: { ...(prev.unlocks.miniReports ?? {}), [slug]: "__UNLOCKED__" } },
            });
            saveVioraState(next);
            setActiveMiniReportModule(slug);
            setMiniReportStatusByModule((prevStatus) => ({ ...prevStatus, [slug]: "collecting" }));
            setMiniReportQuestionByModule((prevIndex) => ({ ...prevIndex, [slug]: 0 }));
            showToast("Mini report odomknutý ✅ Doplň 30–60 sek.");
            window.setTimeout(() => {
              showToast("Otvoril som mini otázky pre presnejší výsledok.");
              document.getElementById(`mini-card-${slug}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 320);
            return next;
          }
          return prev;
        });

        if (data?.ok && data?.kind === "full") setBillingMessage("Platba prebehla úspešne. Hlbší profil je odomknutý.");
        else if (data?.ok && data?.kind === "addon") setBillingMessage("Platba prebehla úspešne. Modul je odomknutý.");
        else if (data?.ok && data?.kind === "mini_report") setBillingMessage("Platba prebehla úspešne. Mini report je odomknutý.");
        else setBillingMessage("Overenie platby sa nepodarilo. Skús obnoviť stránku.");
      } catch {
        setBillingMessage("Overenie platby zlyhalo. Skús to prosím znova.");
      } finally {
        localStorage.removeItem(LS_PENDING_PURCHASE);
        const clean = new URL(window.location.href);
        clean.searchParams.delete("session_id");
        window.history.replaceState({}, "", clean.toString());
        setHydrated(true);
        setIsVerifying(false);
      }
    };

    void verify();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    const deviceSeed = ref || getShareRefId();
    const idx = hashSeedToIndex(deviceSeed, landingHeadlines.length);
    setActiveHeadline(landingHeadlines[idx]);
  }, []);


  useEffect(() => {
    if (!state || mode !== "premium_steps") return;
    if (state.ui.premiumStep === 4) setMiniFlowDone(true);
  }, [state, mode]);

  const goToPremiumStep = (targetStep: 1 | 2 | 3 | 4 | 5) => {
    if (!state) return;
    if ((targetStep === 4 || targetStep === 5) && !miniFlowDone) {
      setMiniFlowNotice("Najprv dokonči mini otázky v kroku 3 alebo ich preskoč.");
      return;
    }
    setMiniFlowNotice(null);
    patchState({ ui: { ...state.ui, premiumStep: targetStep } });
  };

  const openPremiumMiniStep = () => {
    if (!state) return;
    setMiniFlowNotice(null);
    setPremiumMiniModuleIndex(0);
    setPremiumMiniQuestionIndex(0);
    patchState({ ui: { ...state.ui, premiumStep: 3 } });
  };

  const completePremiumMiniStep = () => {
    if (!state) return;
    setMiniFlowDone(true);
    setMiniFlowNotice(null);
    patchState({ ui: { ...state.ui, premiumStep: 4 } });
  };

  const onPremiumMiniSelect = (questionId: number, label: ModuleOptionLabel) => {
    if (!activePremiumMiniModuleSlug || !activePremiumMiniModule) return;
    const moduleAnswerSet = premiumMiniAnswers[activePremiumMiniModuleSlug] ?? {};
    const nextModuleAnswers = { ...moduleAnswerSet, [questionId]: label };
    const nextAllAnswers = { ...premiumMiniAnswers, [activePremiumMiniModuleSlug]: nextModuleAnswers };
    setPremiumMiniAnswers(nextAllAnswers);
    setPremiumMiniTransition("transitioning");

    window.setTimeout(() => {
      const isLastQuestion = premiumMiniQuestionIndex >= activePremiumMiniModule.questions.length - 1;
      if (!isLastQuestion) {
        setPremiumMiniQuestionIndex((value) => value + 1);
        setPremiumMiniTransition("idle");
        return;
      }

      const isLastModule = premiumMiniModuleIndex >= includedPremiumModules.length - 1;
      if (isLastModule) {
        setPremiumMiniTransition("idle");
        completePremiumMiniStep();
        return;
      }

      setPremiumMiniModuleIndex((value) => value + 1);
      setPremiumMiniQuestionIndex(0);
      setPremiumMiniTransition("idle");
    }, 320);
  };

  const openPaymentModal = (intent: PurchaseIntent) => {
    setPurchaseIntent(intent);
    setShowPaymentModal(true);
  };

  const startCheckout = async () => {
    if (!state || !purchaseIntent) return;
    const email = state.identity.email?.trim();
    if (!email) return setBillingMessage("Pred platbou doplň prosím e-mail.");
    if (state.identity.consent !== true) return setBillingMessage("Pred platbou je potrebné potvrdiť súhlas s podmienkami.");

    try {
      setIsPaying(true);
      setBillingMessage(null);
      localStorage.setItem(LS_PENDING_PURCHASE, JSON.stringify({ ...purchaseIntent, timestamp: Date.now() }));
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: purchaseIntent.kind,
          moduleSlug: purchaseIntent.moduleSlug,
          email,
          name: state.identity.name?.trim() ?? "",
          isPremium: purchaseIntent.kind !== "full" ? state.unlocks.full === true : false,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.url) return setBillingMessage(data?.error || "Nepodarilo sa spustiť platbu.");
      if (data?.usedPremiumFallback) localStorage.setItem(LS_PREMIUM_PRICE_WARNING, "true");
      window.location.href = data.url;
    } catch {
      setBillingMessage("Nepodarilo sa spustiť platbu. Skús to prosím znova.");
    } finally {
      setIsPaying(false);
    }
  };

  const onTuningToggle = (focus: (typeof tuningOptions)[number]) => {
    if (!state) return;
    const list = state.tuning.choices ?? [];
    const selected = list.includes(focus);
    const next = selected ? list.filter((x) => x !== focus) : list.length >= 2 ? list : [...list, focus];
    patchState({ tuning: { ...state.tuning, choices: next, done: next.length > 0 } });
    if (next.length > 0) {
      window.setTimeout(() => changePlanRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    }
  };

  const onSelect = (label: OptionLabel) => {
    if (!state) return;
    const nextAnswers = { ...answers, [currentSlotId]: label };
    setTransitionPhase("transitioning");

    window.setTimeout(() => {
      if (step >= questions.length - 1) {
        setIsAnalyzing(true);
        const next = patchVioraState(state, {
          base: { ...state.base, answers: nextAnswers, computedAt: Date.now() },
          ui: { ...state.ui, lastMode: state.unlocks.full ? "premium_steps" : "free_results" },
        });
        setState(next);
        saveVioraState(next);
        setTransitionPhase("idle");
        window.setTimeout(() => setIsAnalyzing(false), 2000);
        return;
      }
      const next = patchVioraState(state, { base: { ...state.base, answers: nextAnswers } });
      setState(next);
      saveVioraState(next);
      setStep((v) => v + 1);
      setTransitionPhase("idle");
    }, 420);
  };

  const onTryAgain = () => {
    if (!state) return;
    const next = resetQuizButKeepUnlocks(state);
    setState(next);
    saveVioraState(next);
    setStep(0);
    setSelectedModule(null);
    setModuleAnswers({});
    setModuleStep(0);
    setPendingModulePurchase(null);
    setModuleNotice(null);
  };

  const startModule = (slug: ModuleSlug) => {
    if (!state) return;
    if (!canAccessModule(slug, state)) {
      setPendingModulePurchase(slug);
      setModuleNotice(state.unlocks.full ? "Tento modul ešte nie je odomknutý. Môžeš ho pridať za 0,99 €." : "Tento modul je Plus. Môžeš ho odomknúť za 2,99 € alebo zvoliť hlbší profil.");
      unlockRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setModuleNotice(null);
    setPendingModulePurchase(null);
    setSelectedModule(slug);
    setModuleAnswers({});
    setModuleStep(0);
  };

  const onModuleSelect = (questionId: number, label: ModuleOptionLabel) => {
    if (!selectedModule || !moduleConfig) return;
    const next = { ...moduleAnswers, [questionId]: label };
    setModuleAnswers(next);
    setModuleTransition("transitioning");
    window.setTimeout(() => {
      if (moduleStep >= moduleConfig.questions.length - 1) {
        const scores = scoreModuleAnswers(selectedModule, next);
        const addon = generateModuleAddon(selectedModule, scored, scores);
        setCompletedAddons((prev) => ({ ...prev, [selectedModule]: addon }));
        setModuleTransition("idle");
        return;
      }
      setModuleStep((v) => v + 1);
      setModuleTransition("idle");
    }, 360);
  };

  const renderAddonArea = (isPremium: boolean) => {
    if (!state) return null;
    return (
      <article className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm md:p-8">
        <h2 className="text-xl font-semibold">Rozšíriť podľa kontextu</h2>
        <p className="mt-2 text-slate-600">Vyber si modul pre doplnkový mini-report.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {modules.map((m) => {
            const status = getModuleStatus(m.slug, state);
            return (
              <button key={m.slug} type="button" onClick={() => startModule(m.slug)} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-slate-400">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h3 className="font-medium text-slate-900">{m.title}</h3>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${status === "free" || status === "included" ? "bg-emerald-100 text-emerald-700" : status === "purchased" ? "bg-sky-100 text-sky-700" : "bg-slate-200 text-slate-700"}`}>
                    {status === "free" ? "Skús zdarma" : status === "included" ? "V cene" : status === "purchased" ? "Odomknuté" : "Plus"}
                  </span>
                </div>
                <p className="text-sm text-slate-600">{m.description}</p>
              </button>
            );
          })}
        </div>

        {moduleNotice && <p className="mt-4 text-sm text-amber-700">{moduleNotice}</p>}

        {pendingModulePurchase && !canAccessModule(pendingModulePurchase, state) && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => openPaymentModal({ kind: "addon", moduleSlug: pendingModulePurchase })} className="inline-flex items-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white">
              {isPremium ? "Pridať za 0,99 €" : "Odomknúť za 2,99 €"}
            </button>
            {!isPremium && (
              <button type="button" onClick={() => openPaymentModal({ kind: "full" })} className="inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">Chcem hlbší profil</button>
            )}
          </div>
        )}

        {selectedModule && moduleConfig && !completedAddons[selectedModule] && activeModuleQuestion && (
          <div className={`mt-8 rounded-xl border border-slate-200 p-5 ${moduleTransition === "transitioning" ? "opacity-70" : "opacity-100"}`}>
            <p className="text-sm text-slate-500">{moduleConfig.title} · Otázka {moduleStep + 1} / {moduleConfig.questions.length}</p>
            <h3 className="mt-3 text-lg font-semibold">{activeModuleQuestion.question}</h3>
            <div className="mt-4 grid gap-3">
              {activeModuleQuestion.options.map((option) => (
                <button key={option.label} type="button" onClick={() => onModuleSelect(activeModuleQuestion.id, option.label)} className="rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-slate-400">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Možnosť {option.label}</p>
                  <p className="mt-1 text-slate-900">{option.text}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {Object.entries(completedAddons).length > 0 && (
          <div className="mt-8 space-y-4">
            {Object.entries(completedAddons).map(([slug, addon]) => {
              if (!addon) return null;
              return (
                <div key={slug} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{modulesBySlug[slug as ModuleSlug].title}</p>
                  <h3 className="mt-1 text-lg font-semibold">{addon.title}</h3>
                  <p className="mt-2 text-sm text-slate-700">{addon.insight}</p>
                </div>
              );
            })}
          </div>
        )}
      </article>
    );
  };

  if (!hydrated || isVerifying || !state) {
    return (
      <main className="relative min-h-screen">
        <div className="fixed inset-0 bg-slate-950/55" />
        <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-12">
          <div className="space-y-6 rounded-2xl border border-slate-200 bg-white/90 px-10 py-10 text-center shadow-sm">
            <div className="mx-auto h-9 w-9 animate-pulse rounded-full border-2 border-slate-300 border-t-slate-700" />
            <h1 className="text-2xl font-semibold">Načítavame tvoj profil…</h1>
          </div>
        </div>
      </main>
    );
  }

  if (mode === "quiz" || isAnalyzing) {
    return (
      <main className="relative min-h-screen">
        <div className="fixed inset-0 bg-slate-950/55" />
        <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-12">
          {isAnalyzing ? (
            <div className="space-y-6 rounded-2xl border border-slate-200 bg-white/90 px-10 py-10 text-center shadow-sm">
              <div className="mx-auto h-9 w-9 animate-pulse rounded-full border-2 border-slate-300 border-t-slate-700" />
              <h1 className="text-2xl font-semibold">Analyzujeme tvoje odpovede…</h1>
              <p className="text-slate-600">Ešte chvíľu, skladáme tvoj profil do jasného obrazu.</p>
            </div>
          ) : (
            <div className={`w-full max-w-2xl rounded-3xl border border-white/20 bg-white/92 p-7 shadow-2xl backdrop-blur-md transition-all duration-500 md:p-10 ${transitionPhase === "transitioning" ? "scale-[0.99] opacity-70" : "scale-100 opacity-100"}`}>
              <div className="mb-7 space-y-3">
                <p className="text-sm font-medium text-slate-500">Otázka {step + 1} / {questions.length}</p>
                <div className="h-1.5 w-full rounded-full bg-slate-200"><div className="h-full rounded-full bg-slate-900 transition-all duration-500" style={{ width: `${progress}%` }} /></div>
              </div>
              <h1 className="text-2xl font-semibold leading-snug text-slate-900 md:text-3xl">{currentQuestion.question}</h1>
              <div className="mt-7 grid gap-4">
                {currentQuestion.options.map((option) => (
                  <button key={option.label} type="button" onClick={() => onSelect(option.label)} className="w-full rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-slate-400 hover:bg-slate-50">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Možnosť {option.label}</p>
                    <p className="mt-2 text-base text-slate-900 md:text-lg">{option.text}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen">
      <div className="fixed inset-0 bg-slate-950/55" />
      <div className="relative z-10 mx-auto w-full max-w-5xl px-6 py-12">
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.16em] text-slate-500">Viora Decision Profile</p>
          <p className="mt-2 text-sm text-slate-600">{activeHeadline}</p>
          {state.identity.name && <p className="mt-1 text-sm text-slate-600">Ahoj, {state.identity.name}</p>}
        </div>

        {shareMessage && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{shareMessage}</div>}
        {billingMessage && <div className="mb-4 rounded-xl border border-slate-200 bg-white/90 px-4 py-2 text-sm text-slate-700">{billingMessage}</div>}
        {microToast && <div className="mb-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm text-sky-700">{microToast}</div>}

        {mode === "free_results" && (
          <section className="space-y-6">
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-semibold">Tvoj rozhodovací podpis</h2><div className="mt-4 whitespace-pre-line text-slate-700">{freeReport.signature}</div><p className="mt-4 text-sm text-slate-600">Zdieľaj svoj podpis. Najlepšie funguje v chate ako 1 veta.</p><div className="mt-3 flex flex-wrap items-center gap-2"><button title="Skopíruje krátky text + link. Bez citlivých dát." type="button" onClick={() => void shareWithLink(`Môj rozhodovací podpis: ${freeReport.signature.split("\n")[0]}`, "Viora podpis")} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">Zdieľať profil</button><button title="Skopíruje krátky text + link. Bez citlivých dát." type="button" onClick={() => void shareWithLink(`Viora karta: ${freeReport.signature.split("\n")[0]}`, "Viora karta")} className="rounded-full border border-slate-300 px-4 py-2 text-sm">Zdieľať ako kartu</button></div><p className="mt-2 text-xs text-slate-500">Pripravujeme odmeny za odporúčania ✨</p></article>
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-semibold">Rizikové miesto</h2><div className="mt-4 whitespace-pre-line text-slate-700">{freeReport.riskSpot}</div></article>
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold">Jeden optimalizačný zásah</h2>
              <div className="mt-4 whitespace-pre-line text-slate-700">{freeReport.intervention}</div>
              <div className="mt-5 flex flex-wrap gap-3">
                <button title="Skopíruje krátky podpis + link. Bez osobných dát." type="button" onClick={() => void shareWithLink(`Môj rozhodovací podpis: ${freeReport.signature.split("\n")[0]}`, "Viora podpis")} className="rounded-full border border-slate-300 px-4 py-2 text-sm">Zdieľať podpis</button>
                <button ref={unlockRef} type="button" onClick={() => openPaymentModal({ kind: "full" })} className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white">Chcem hlbší profil</button>
                <button type="button" onClick={onTryAgain} className="rounded-full border border-slate-300 px-4 py-2 text-sm">Spustiť znova kvíz</button>
              </div>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold">Free vs Premium</h2>
              <p className="mt-2 text-sm text-slate-600">Zaberie to 2 min. Výstup je okamžitý.</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">Free</p>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-700">
                    <li>Rozhodovací podpis</li>
                    <li>Rizikové miesto</li>
                    <li>1 optimalizačný zásah</li>
                  </ul>
                </div>
                <div className="rounded-xl border border-slate-900 bg-slate-900 p-4 text-slate-100">
                  <p className="text-sm font-semibold">Premium (5€)</p>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-200">
                    <li>Viora Deep: kompletná hlboká analýza</li>
                    <li>Viora Plan: 7-dňový checklist zmeny</li>
                    <li>Viora Minis: mini reporty (0.99) – voliteľné</li>
                    <li>Viora Tuning: 1–2 focusy + presný plán</li>
                    <li>Zdieľateľný highlight (1 veta + 1 tip)</li>
                    <li>Doplnenie kontextu (mini otázky)</li>
                  </ul>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-700">Ak ti to nebude dávať zmysel, ozvi sa. Vyriešime to.</p>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {['Viora Deep (preview)', 'Viora Plan (preview)', 'Viora Minis (preview)'].map((item) => (
                  <div key={item} className="rounded-xl border border-slate-200 bg-slate-100/80 p-4">
                    <p className="text-sm font-medium text-slate-800">{item}</p>
                    <div className="mt-3 h-12 rounded-md bg-slate-300/70 blur-[2px]" />
                  </div>
                ))}
              </div>
            </article>
            {renderAddonArea(false)}
            <article className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Čoskoro / plánované upgrady</h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">Plánované</span>
              </div>
              <ul className="mt-4 list-inside list-disc space-y-1 text-sm text-slate-700">
                {plannedUpgradeItems.map((item) => <li key={item}>{item}</li>)}
              </ul>
              <p className="mt-3 text-xs text-slate-500">Rozsah a poradie týchto rozšírení sa môže meniť podľa spätnej väzby používateľov.</p>
            </article>
          </section>
        )}

        {mode === "premium_steps" && (
          <section className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((s) => {
                  const tip = s === 1
                    ? "Tvoj premium priestor: výsledky, doplnky a plán zmeny."
                    : s === 2
                      ? "Vyber 2 oblasti v cene, ktoré zapracujeme do hlbokej analýzy."
                      : s === 3
                        ? "Krátke otázky, aby analýza sedela na tvoj kontext."
                        : s === 4
                        ? "Komplexná analýza + mini-reporty ako samostatný výsledok."
                        : "Checklist zmien pre vybrané focusy na 7 dní.";
                  return (
                    <HoverTip key={s} text={tip}>
                      <button type="button" onClick={() => goToPremiumStep(s as 1 | 2 | 3 | 4 | 5)} className={`rounded-full border px-3 py-1 text-xs ${premiumStep === s ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 text-slate-700"}`}>
                        {premiumStepLabels[s as 1 | 2 | 3 | 4 | 5]}
                      </button>
                    </HoverTip>
                  );
                })}
              </div>
              <button title="Ochutnávka plánovaných upgradeov a budúcich magic funkcií." type="button" onClick={() => setShowComingSoon(true)} className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                Pripravujeme
              </button>
            </div>

            {miniFlowNotice && <p className="text-sm text-amber-700">{miniFlowNotice}</p>}

            {premiumStep === 1 && (
              <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold">Hlboká analýza (Základ)</h2>
                <p className="mt-4 whitespace-pre-line text-slate-700">{fullReport.extendedSignature}</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-700">
                  <li><span className="font-medium">Rýchlosť:</span> {fullReport.dimensionMap.speed}</li>
                  <li><span className="font-medium">Spracovanie:</span> {fullReport.dimensionMap.processing}</li>
                  <li><span className="font-medium">Neistota:</span> {fullReport.dimensionMap.risk}</li>
                  <li><span className="font-medium">Tlak:</span> {fullReport.dimensionMap.pressure}</li>
                  <li><span className="font-medium">Kontrola:</span> {fullReport.dimensionMap.control}</li>
                </ul>
                <div className="mt-5 flex gap-3"><button type="button" onClick={() => patchState({ ui: { ...state.ui, premiumStep: 2 } })} className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white">Pokračovať</button><button type="button" onClick={onTryAgain} className="rounded-full border border-slate-300 px-4 py-2 text-sm">Spustiť znova kvíz</button></div>
              </article>
            )}

            {premiumStep === 2 && (
              <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold">Vybrané oblasti (2 v cene)</h2>
                <p className="mt-2 text-slate-600">Vyber 2 oblasti. Potom doplníme pár krátkych otázok a až potom vygenerujeme analýzu.</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {modules.filter((m) => !m.isFree).map((m) => {
                    const selected = (state.unlocks.included ?? []).includes(m.slug);
                    return (
                      <button key={m.slug} type="button" onClick={() => {
                        const list = state.unlocks.included ?? [];
                        const next = selected ? list.filter((x) => x !== m.slug) : list.length >= 2 ? list : [...list, m.slug];
                        patchState({ unlocks: { ...state.unlocks, included: next } });
                      }} className={`rounded-xl border p-4 text-left ${selected ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white"}`}>
                        <p className="font-medium">{m.title}</p>
                        <p className="mt-1 text-sm text-slate-600">{m.description}</p>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-5"><HoverTip text="Prejdeš na mini doplnenie otázkami."><button type="button" onClick={openPremiumMiniStep} className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white">Pokračovať</button></HoverTip></div>
              </article>
            )}

            {premiumStep === 3 && (
              <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold">Mini doplňujúce otázky</h2>
                <p className="mt-2 text-slate-600">Zaberie to 30–90 sekúnd. Pomôže to spraviť výstup presnejší.</p>
                <p className="mt-1 text-sm text-slate-500">Doplnenie: {Math.min(premiumMiniModuleIndex + 1, includedPremiumModules.length)}/{Math.max(includedPremiumModules.length, 1)} hotovo</p>

                {includedPremiumModules.length === 0 ? (
                  <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                    Nemáš vybrané kontexty. Môžeš pokračovať ďalej, alebo sa vrátiť na Krok 2 a vybrať ich.
                  </div>
                ) : activePremiumMiniModule && activePremiumMiniQuestion && activePremiumMiniModuleSlug ? (
                  <div className={`mt-5 rounded-xl border border-slate-200 p-5 ${premiumMiniTransition === "transitioning" ? "opacity-70" : "opacity-100"}`}>
                    <p className="text-sm text-slate-500">{activePremiumMiniModule.title} · Otázka {premiumMiniQuestionIndex + 1} / {activePremiumMiniModule.questions.length}</p>
                    <h3 className="mt-3 text-lg font-semibold">{activePremiumMiniQuestion.question}</h3>
                    <div className="mt-4 grid gap-3">
                      {activePremiumMiniQuestion.options.map((option) => (
                        <button key={option.label} type="button" onClick={() => onPremiumMiniSelect(activePremiumMiniQuestion.id, option.label)} className="rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-slate-400">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Možnosť {option.label}</p>
                          <p className="mt-1 text-slate-900">{option.text}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="mt-5 flex flex-wrap gap-3">
                  <HoverTip text="Analýza sa spraví z dostupných dát."><button type="button" onClick={completePremiumMiniStep} className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white">Preskočiť mini otázky</button></HoverTip>
                  <button type="button" onClick={() => goToPremiumStep(2)} className="rounded-full border border-slate-300 px-4 py-2 text-sm">Späť na výber oblastí</button>
                </div>
              </article>
            )}

            {premiumStep === 3 && renderAddonArea(true)}

            {premiumStep === 4 && synthesis && (
              <section className="space-y-6">
                <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-semibold">Komplexná analýza</h2>
                  <h3 className="mt-4 text-base font-semibold">Tvoj obraz v skratke</h3>
                  <div className="mt-2 space-y-2 text-slate-700">{synthesis.summary.map((p) => <p key={p}>{p}</p>)}</div>
                  <h3 className="mt-4 text-base font-semibold">Ako sa to prejaví v bežných situáciách</h3>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-slate-700">{synthesis.situations.map((x) => <li key={x}>{x}</li>)}</ul>
                  <h3 className="mt-4 text-base font-semibold">Najčastejšia pasca + čo s tým</h3>
                  <p className="mt-2 text-slate-700">{synthesis.trap}</p>
                </article>

                <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-base font-semibold">Prečo ti vyšla práve táto analýza</h3>
                  <p className="mt-2 text-sm text-slate-600">Personal proof: signály priamo z tvojich odpovedí.</p>
                  <div className="mt-4 space-y-3">
                    {personalProofs.slice(0, 5).map((proof, idx) => (
                      <div key={`${proof.choice}-${idx}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm"><span className="font-medium">Tvoja voľba:</span> {proof.choice}</p>
                        <p className="mt-1 text-sm"><span className="font-medium">Čo to signalizuje:</span> {proof.signal}</p>
                        <p className="mt-1 text-sm"><span className="font-medium">Ako sa to prejaví:</span> {proof.impact}</p>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-base font-semibold">Zdieľateľný highlight</h3>
                  <p className="mt-2 text-sm text-slate-700">Jedna veta + jeden tip. Nie celý report.</p>
                  <p className="mt-2 text-sm text-slate-700"><span className="font-medium">Insight:</span> {synthesis.summary[0]}</p>
                  <p className="mt-1 text-sm text-slate-700"><span className="font-medium">Tip:</span> {synthesis.situations[0]}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <button title="Len highlight, nie celý report." type="button" onClick={() => void shareWithLink(`Highlight: ${synthesis.summary[0]} Tip: ${synthesis.situations[0]}`, "Viora highlight")} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">Zdieľať highlight</button>
                  </div>
                </article>

                <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-semibold">Mini reporty (0.99)</h2>
                  <p className="mt-2 text-slate-600">Krátky samostatný výsledok. Nezasahuje do hlbokej analýzy.</p>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {modules.map((m) => {
                      const saved = state.unlocks.miniReports?.[m.slug];
                      const result = miniReportResultByModule[m.slug];
                      const status = miniReportStatusByModule[m.slug] ?? (saved && saved !== "__UNLOCKED__" ? "ready" : saved === "__UNLOCKED__" ? "collecting" : "locked");
                      const wizardQuestions = modulesBySlug[m.slug].questions.slice(0, 3);
                      const currentIdx = miniReportQuestionByModule[m.slug] ?? 0;
                      const currentQuestion = wizardQuestions[currentIdx];

                      return (
                        <div id={`mini-card-${m.slug}`} key={m.slug} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-medium text-slate-900">{m.title}</h3>
                            <span title="0.99 = samostatný mini výsledok hneď teraz (neovplyvní analýzu)." className="rounded-full bg-slate-200 px-2 py-1 text-xs text-slate-700">0,99 €</span>
                          </div>
                          <p className="mt-1 text-sm text-slate-600">{m.description}</p>

                          {status === "locked" && (
                            <div className="mt-3 flex items-center gap-2">
                              <HoverTip text="Odomkne rýchly mini výsledok pre tento modul."><button type="button" onClick={() => openPaymentModal({ kind: "mini_report", moduleSlug: m.slug })} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">Odomknúť mini report (0.99)</button></HoverTip>
                            </div>
                          )}

                          {status === "collecting" && activeMiniReportModule === m.slug && currentQuestion && (
                            <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                              <p className="text-sm text-slate-500">Mini report: otázka {currentIdx + 1}/{wizardQuestions.length}</p>
                              <p className="mt-1 font-medium text-slate-900">{currentQuestion.question}</p>
                              <div className="mt-3 grid gap-2">
                                {currentQuestion.options.map((option) => (
                                  <button key={option.label} type="button" onClick={() => {
                                    const nextAnswers = { ...(miniReportAnswersByModule[m.slug] ?? {}), [currentQuestion.id]: option.label };
                                    setMiniReportAnswersByModule((prev) => ({ ...prev, [m.slug]: nextAnswers }));
                                    if (currentIdx >= wizardQuestions.length - 1) {
                                      const templ = getMiniReportTemplate(m.slug);
                                      setMiniReportResultByModule((prev) => ({ ...prev, [m.slug]: templ }));
                                      setMiniReportStatusByModule((prev) => ({ ...prev, [m.slug]: "ready" }));
                                      patchState({ unlocks: { ...state.unlocks, miniReports: { ...(state.unlocks.miniReports ?? {}), [m.slug]: `${templ.insight}

${templ.nextStep}

Metrika: ${templ.metric}
Spúšťač: ${templ.trigger}` } } });
                                      setActiveMiniReportModule(null);
                                      showToast("Mini report pripravený ✅");
                                    } else {
                                      setMiniReportQuestionByModule((prev) => ({ ...prev, [m.slug]: currentIdx + 1 }));
                                    }
                                  }} className="rounded-lg border border-slate-200 p-3 text-left text-sm hover:border-slate-400">
                                    {option.label}. {option.text}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {status === "ready" && (result || saved) && (
                            <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
                              <div className="mb-2 flex items-center gap-2"><span title="Tento mini report je už odomknutý." className="rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-700">Už máš</span></div>
                              {result ? (
                                <div className="space-y-2">
                                  <p><span className="font-medium">Insight:</span> {result.insight}</p>
                                  <p><span className="font-medium">Najbližší krok (7 dní):</span> {result.nextStep}</p>
                                  <p><span className="font-medium">Metrika:</span> {result.metric}</p>
                                  <p><span className="font-medium">Spúšťač:</span> {result.trigger}</p>
                                </div>
                              ) : (
                                <div className="whitespace-pre-line">{saved}</div>
                              )}
                              <HoverTip text="Ukáže tvoj mini výsledok pre tento modul."><button type="button" onClick={() => { setActiveMiniReportModule(m.slug); setMiniReportStatusByModule((prev) => ({ ...prev, [m.slug]: "collecting" })); setMiniReportQuestionByModule((prev)=>({ ...prev, [m.slug]: 0 })); }} className="mt-3 rounded-full border border-slate-300 px-4 py-2 text-sm">Zobraziť mini report</button></HoverTip>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-5">
                    <button type="button" onClick={() => goToPremiumStep(5)} className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white">Pokračovať na Tuning</button>
                  </div>
                </article>
              </section>
            )}

            {premiumStep === 5 && (
              <section className="space-y-6">
                <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-semibold">Tuning / model úprav</h2>
                  <p className="mt-2 text-slate-600">Vyber 1–2 focusy. Po výbere ťa presunieme na konkrétny checklist.</p>
                  <p className="mt-1 text-sm text-slate-500">Vybraté focusy: {(state.tuning.choices ?? []).length}/2</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {tuningOptions.map((o) => {
                      const sel = (state.tuning.choices ?? []).includes(o);
                      return <button key={o} title={focusTooltips[o]} type="button" onClick={() => { showToast("Zapisujem fokus…"); onTuningToggle(o); showToast("Presúvam ťa na plán zmeny…"); }} className={`rounded-xl border p-4 text-left ${sel ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white"}`}>{o}</button>;
                    })}
                  </div>
                  <div className="mt-5 flex gap-3">
                    <HoverTip text="Zobrazí tvoj mikro-krokový plán pre vybrané focusy."><button type="button" onClick={() => { showToast("Hotovo. Tu je tvoj 7-dňový plán."); changePlanRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }} className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white">Uložiť úpravy</button></HoverTip>
                  </div>
                </article>

                <article ref={changePlanRef} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-semibold">Tvoj plán zmeny</h2>
                  <p className="mt-2 text-sm text-slate-600">Konkrétne kroky na 7 dní. Stačí robiť 1–2 malé veci denne.</p>
                  {(state.tuning.choices ?? []).length === 0 ? (
                    <p className="mt-3 text-sm text-slate-600">Vyber aspoň jeden fokus v tuningu a zobrazí sa konkrétny 7-dňový checklist.</p>
                  ) : (
                    <div className="mt-4 space-y-5">
                      {(state.tuning.choices ?? []).map((focus) => {
                        const plan = changePlanByFocus[focus as (typeof tuningOptions)[number]];
                        return (
                          <div key={focus} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <h3 className="text-base font-semibold text-slate-900">{plan.title}</h3>
                            <p className="mt-1 text-sm text-slate-600">Horizont: {plan.horizonDays} dní</p>
                            <div className="mt-3 space-y-3">
                              {plan.checklist.map((dayBlock) => (
                                <details key={dayBlock.day} className="rounded-lg border border-slate-200 bg-white p-3" open={dayBlock.day === 1}>
                                  <summary className="cursor-pointer text-sm font-medium text-slate-800">Deň {dayBlock.day}</summary>
                                  <div className="mt-2 space-y-2">
                                    {dayBlock.items.map((item) => (
                                      <label key={item} className="flex items-start gap-2 text-sm text-slate-700">
                                        <input type="checkbox" className="mt-1" />
                                        <span>{item}</span>
                                      </label>
                                    ))}
                                  </div>
                                </details>
                              ))}
                            </div>
                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                              <div className="rounded-lg border border-slate-200 bg-white p-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Spúšťače</p>
                                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-700">{plan.triggers.map((item) => <li key={item}>{item}</li>)}</ul>
                              </div>
                              <div className="rounded-lg border border-slate-200 bg-white p-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Meranie</p>
                                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-700">{plan.metrics.map((item) => <li key={item}>{item}</li>)}</ul>
                              </div>
                              <div className="rounded-lg border border-slate-200 bg-white p-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Pozor na</p>
                                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-700">{plan.pitfalls.map((item) => <li key={item}>{item}</li>)}</ul>
                              </div>
                              <div className="rounded-lg border border-slate-200 bg-white p-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Fallback</p>
                                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-700">{plan.fallback.map((item) => <li key={item}>{item}</li>)}</ul>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </article>
              </section>
            )}
          </section>
        )}

        <div className="mt-8"><Link href="/" title="Vráti ťa na úvod. Výsledky zostanú uložené." className="inline-flex items-center rounded-full border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700">Späť na úvod</Link></div>
      </div>

      {showComingSoon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-6">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl md:p-8">
            <h3 className="text-xl font-semibold">Chystáme pre vás</h3>
            <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-slate-700">
              <li>Viora Coaching</li>
              <li>Viora Weekly</li>
              <li>Viora Review</li>
              <li>Viora Tracker</li>
            </ul>
            <p className="mt-4 text-xs text-slate-500">Pripravujeme. Dostupnosť a rozsah sa môžu meniť.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setShowComingSoon(false)} className="rounded-full border border-slate-300 px-4 py-2 text-sm">Daj mi vedieť</button>
              <button type="button" onClick={() => setShowComingSoon(false)} className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white">Rozumiem</button>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && purchaseIntent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-6">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl md:p-8">
            <h3 className="text-xl font-semibold">Pokračovanie na platbu</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">E-mail</label>
                <input type="email" required value={state.identity.email ?? ""} onChange={(e) => patchState({ identity: { ...state.identity, email: e.target.value } })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="tvoj@email.sk" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Meno (voliteľné)</label>
                <input type="text" value={state.identity.name ?? ""} onChange={(e) => patchState({ identity: { ...state.identity, name: e.target.value } })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Ako ťa môžeme osloviť" />
              </div>
              <label className="flex items-start gap-2 text-sm text-slate-600"><input type="checkbox" checked={state.identity.consent === true} onChange={(e) => patchState({ identity: { ...state.identity, consent: e.target.checked } })} className="mt-1" /><span>Súhlasím s podmienkami a ochranou súkromia.</span></label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setShowPaymentModal(false)} className="rounded-full border border-slate-300 px-4 py-2 text-sm">Zavrieť</button>
              <button type="button" onClick={() => void startCheckout()} disabled={isPaying} className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white">{purchaseIntent.kind === "full" ? "Pokračovať na platbu 4,99 €" : purchaseIntent.kind === "mini_report" ? "Pokračovať na platbu 0,99 €" : `Pokračovať na platbu ${state.unlocks.full ? "0,99 €" : "2,99 €"}`}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
