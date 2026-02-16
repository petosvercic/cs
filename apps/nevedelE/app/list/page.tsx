import Link from "next/link";
import { headers } from "next/headers";
import { listEditions } from "../../lib/editions-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type EditionsResponse = {
  ok: boolean;
  editions?: { slug: string; title: string; createdAt?: string; updatedAt?: string }[];
};

async function fetchEditionsFromApi() {
  const h = await headers();
  const host = h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || "https";
  const response = await fetch(`${proto}://${host}/api/editions/slugs`, { cache: "no-store" });
  const json = (await response.json().catch(() => null)) as EditionsResponse | null;

  if (!response.ok || !json?.ok || !Array.isArray(json?.editions)) {
    return [];
  }

  return json.editions;
}

export default async function ListPage() {
  const editions = process.env.VERCEL ? await fetchEditionsFromApi() : listEditions();

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 px-4 py-10">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight">Zoznam edícií</h1>
        <p className="mt-2 text-sm text-neutral-400">Zdroj: editions index</p>

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
