"use client";

import { useMemo, useState } from "react";

type Option = {
  label: string;
  value: -1 | 1;
};

type Question = {
  id: string;
  text: string;
  options: [Option, Option];
};

const DAILY_SPECTRUM: Question[] = [
  {
    id: "q1",
    text: "Dnes skôr reaguješ spontánne alebo premyslene?",
    options: [
      { label: "Skôr spontánne", value: -1 },
      { label: "Skôr premyslene", value: 1 },
    ],
  },
  {
    id: "q2",
    text: "V rozhovoroch máš dnes viac potrebu hovoriť alebo počúvať?",
    options: [
      { label: "Hovoriť", value: -1 },
      { label: "Počúvať", value: 1 },
    ],
  },
  {
    id: "q3",
    text: "Tvoje tempo je dnes skôr pokojné alebo výkonné?",
    options: [
      { label: "Pokojné", value: -1 },
      { label: "Výkonné", value: 1 },
    ],
  },
  {
    id: "q4",
    text: "Pri neistote sa skôr uzatváraš alebo pýtaš spätnú väzbu?",
    options: [
      { label: "Uzatváram sa", value: -1 },
      { label: "Pýtam spätnú väzbu", value: 1 },
    ],
  },
  {
    id: "q5",
    text: "Vnímaš sa dnes viac v obrane alebo v otvorenosti?",
    options: [
      { label: "Skôr v obrane", value: -1 },
      { label: "Skôr v otvorenosti", value: 1 },
    ],
  },
];

function getResult(score: number) {
  if (score <= -3) {
    return {
      symbol: "🌑",
      title: "Tmavý tieň",
      summary: "Dnes si skôr v ochrannom režime. Pomôcť môže menšie tempo a jasné hranice.",
      toneClass: "bg-violet-950 border-violet-800 text-violet-100",
    };
  }

  if (score <= 1) {
    return {
      symbol: "🟠",
      title: "Oranžový kruh",
      summary: "Si v prechode: časť dňa ide podľa plánu, časť ešte hľadá stabilitu.",
      toneClass: "bg-amber-950 border-amber-800 text-amber-100",
    };
  }

  return {
    symbol: "🟢",
    title: "Zelený palec",
    summary: "Pôsobíš vyrovnane a otvorene. Dnes máš dobrý základ pre spoluprácu.",
    toneClass: "bg-emerald-950 border-emerald-800 text-emerald-100",
  };
}

export default function SocStatPage() {
  const [answers, setAnswers] = useState<Record<string, -1 | 1>>({});

  const answeredCount = Object.keys(answers).length;
  const isComplete = answeredCount === DAILY_SPECTRUM.length;

  const score = useMemo(() => Object.values(answers).reduce((acc, value) => acc + value, 0), [answers]);
  const result = useMemo(() => getResult(score), [score]);

  const canUnlockSocial = isComplete;

  return (
    <main className="min-h-screen px-4 py-8 md:px-8">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <header className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <p className="text-xs uppercase tracking-wide text-neutral-400">soc.stat / MVP demo</p>
          <h1 className="mt-2 text-3xl font-semibold">Denný mentálny checkpoint</h1>
          <p className="mt-3 text-sm text-neutral-300">
            Krátke denné spektrum (1–3 min). Cieľom nie je správna odpoveď, ale orientácia „kde sa dnes nachádzaš“.
          </p>
          <div className="mt-4 text-sm text-neutral-400">Vyplnené: {answeredCount}/{DAILY_SPECTRUM.length}</div>
        </header>

        <section className="space-y-4">
          {DAILY_SPECTRUM.map((question, index) => (
            <article key={question.id} className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
              <p className="text-xs text-neutral-400">Otázka {index + 1}</p>
              <h2 className="mt-1 text-base font-medium">{question.text}</h2>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                {question.options.map((option) => {
                  const isSelected = answers[question.id] === option.value;
                  return (
                    <button
                      type="button"
                      key={option.label}
                      onClick={() => setAnswers((prev) => ({ ...prev, [question.id]: option.value }))}
                      className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                        isSelected
                          ? "border-neutral-100 bg-neutral-100 text-neutral-950"
                          : "border-neutral-700 bg-neutral-800/50 text-neutral-200 hover:border-neutral-500"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </article>
          ))}
        </section>

        {isComplete ? (
          <section className={`rounded-2xl border p-6 ${result.toneClass}`}>
            <p className="text-xs uppercase tracking-wide opacity-80">Tvoj dnešný stav</p>
            <h3 className="mt-2 text-2xl font-semibold">
              <span className="mr-2">{result.symbol}</span>
              {result.title}
            </h3>
            <p className="mt-2 text-sm opacity-90">{result.summary}</p>
            <div className="mt-4 rounded-xl border border-white/20 bg-black/10 p-4 text-sm">
              <p>Tvoje porovnanie s ostatnými je zamknuté.</p>
              <p className="mt-1 opacity-90">
                Odomkni sociálny kontext v Premium: uvidíš, či si bližšie k väčšine alebo k menšine.
              </p>
            </div>
          </section>
        ) : (
          <section className="rounded-2xl border border-dashed border-neutral-700 bg-neutral-900/70 p-6 text-sm text-neutral-300">
            Dokonči všetky otázky a zobrazí sa tvoj symbolický stav.
          </section>
        )}

        <footer className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 text-sm text-neutral-300">
          <p className="font-medium text-neutral-100">Monetizačný náhľad (demo)</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Free: 1 spektrum denne + vlastný stav.</li>
            <li>Premium (1 €/mes): história, porovnania, notifikácie.</li>
            <li>Gold: odomknutie extra kontextu (nie výhoda nad inými).</li>
          </ul>
          <p className="mt-3 text-xs text-neutral-500">
            Sociálne porovnanie je v tomto prototype simulované ako zamknutá vrstva.
            {canUnlockSocial ? " Technicky je pripravený bod na prepojenie s platenou vrstvou." : ""}
          </p>
        </footer>
      </div>
    </main>
  );
}
