export default function Home() {
  return (
    <main className="min-h-screen p-6 flex items-center justify-center">
      <div className="w-full max-w-2xl rounded-2xl bg-neutral-900 p-6 border border-neutral-800 shadow-xl">
        <h1 className="text-2xl font-semibold">nevedelE</h1>
        <p className="text-neutral-300 mt-2 text-sm">Produktová appka (monorepo) – UI skeleton.</p>
        <div className="mt-6 flex flex-wrap gap-4">
          <a href="/one-day" className="rounded-xl bg-neutral-100 text-neutral-950 px-4 py-2 font-semibold">One Day</a>
          <a href="/list" className="rounded-xl bg-neutral-100 text-neutral-950 px-4 py-2 font-semibold">Zoznamy</a>
          <a href="/builder" className="rounded-xl bg-neutral-100 text-neutral-950 px-4 py-2 font-semibold">Builder</a>
          <a href="/soc-stat" className="rounded-xl bg-emerald-400 text-emerald-950 px-4 py-2 font-semibold">soc.stat demo</a>
        </div>
      </div>
    </main>
  );
}
