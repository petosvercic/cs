import Link from "next/link";
import { listEditions } from "../../lib/editions-store";

export const dynamic = "force-dynamic";

export default function ListPage() {
  const editions = listEditions();

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 px-4 py-10">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight">Zoznam edícií</h1>
        <p className="mt-2 text-sm text-neutral-400">Zdroj: data/editions.json + data/editions/*.json</p>

        <div className="mt-6 grid gap-3">
          {editions.map((e) => (
            <Link
              key={e.slug}
              href={`/e/${e.slug}`}
              className="block rounded-xl border border-neutral-800 bg-neutral-900 p-4 hover:border-neutral-600"
            >
              <div className="font-semibold">{e.title}</div>
              <div className="mt-1 text-sm text-neutral-400">/e/{e.slug}</div>
            </Link>
          ))}
          {editions.length === 0 && <p className="text-neutral-400">Žiadne edície zatiaľ neexistujú.</p>}
        </div>
      </div>
    </main>
  );
}
