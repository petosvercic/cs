import Image from "next/image";
import Link from "next/link";

const profileMetrics = [
  "Rýchlosť rozhodovania",
  "Štýl spracovania informácií",
  "Tolerancia neistoty",
  "Reakcia pod tlakom",
  "Potreba kontroly",
];

const steps = [
  "Odpovieš na 7 krátkych otázok",
  "Získaš svoj rozhodovací podpis",
  "Môžeš si odomknúť detailnú analýzu a 7-dňový optimalizačný plán",
];

const audience = [
  "lepšie rozumieť reakciám pod tlakom",
  "znížiť zbytočné váhanie",
  "zlepšiť kvalitu rozhodnutí",
];

export default function Home() {
  return (
    <main className="text-slate-900">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 md:px-8">
        <Link href="/" className="inline-flex items-center" aria-label="Viora domov">
          <Image src="/brand/logo.png" alt="Viora" width={120} height={36} priority className="h-9 w-auto" />
        </Link>
      </header>

      <section className="mx-auto w-full max-w-6xl px-6 pb-20 md:px-8 md:pb-28">
        <div className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/10 shadow-sm backdrop-blur-[1px]">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/70 via-slate-900/55 to-slate-800/40" />

          <div className="relative z-10 mx-auto flex min-h-[470px] max-w-3xl flex-col items-start justify-center gap-6 px-8 py-16 text-white md:px-12">
            <p className="text-sm uppercase tracking-[0.18em] text-white/80">Viora: Personal Analysis</p>
            <h1 className="text-4xl font-semibold leading-tight md:text-5xl">Pochop, ako sa rozhoduješ.</h1>
            <p className="max-w-2xl text-base leading-relaxed text-white/90 md:text-lg">
              Viora: Personal Analysis je krátky behaviorálny profil generovaný pomocou AI analýzy tvojich odpovedí.
              Za 2 minúty získaš jasný pohľad na svoje rozhodovacie vzorce pod tlakom a v neistote.
            </p>
            <Link
              href="/profile"
              className="inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
            >
              Spustiť profil (2 minúty)
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-16 px-6 pb-24 md:px-8 md:pb-32">
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold md:text-3xl">Čo profil meria</h2>
          <ul className="grid gap-3 text-slate-700 md:grid-cols-2">
            {profileMetrics.map((item) => (
              <li key={item} className="rounded-xl border border-slate-200 bg-slate-50/85 px-4 py-3 backdrop-blur-sm">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-semibold md:text-3xl">Ako to funguje</h2>
          <ol className="space-y-3 text-slate-700">
            {steps.map((step, index) => (
              <li key={step} className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-300 text-sm font-medium">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-semibold md:text-3xl">Pre koho je Viora</h2>
          <ul className="list-inside list-disc space-y-2 text-slate-700">
            {audience.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/85 p-6 backdrop-blur-sm">
          <h2 className="text-xl font-semibold">Pre organizácie</h2>
          <p className="mt-2 text-slate-700">Coming soon</p>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap gap-6 px-6 text-sm text-slate-600 md:px-8">
          <span>Privacy</span>
          <span>Terms</span>
          <span>Contact</span>
        </div>
      </footer>
    </main>
  );
}
