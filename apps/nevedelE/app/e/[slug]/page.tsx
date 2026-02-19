import EditionClient from "./ui";
import { loadEditionBySlug } from "../../../lib/editions-store";
import { parseEditionPackDocument } from "../../../lib/edition-pack";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const edition = loadEditionBySlug(slug);

  if (!edition) {
    return <main className="mx-auto max-w-3xl px-4 py-14"><h1 className="text-3xl font-semibold">404</h1><p className="mt-2 text-neutral-500">Edícia <b>{slug}</b> neexistuje.</p></main>;
  }

  const parsed = parseEditionPackDocument(edition);
  if ("error" in parsed) {
    return <main className="mx-auto max-w-3xl px-4 py-14"><h1 className="text-3xl font-semibold">Invalid edition</h1><p className="mt-2 text-neutral-500">{parsed.error}</p></main>;
  }

  return <EditionClient edition={parsed.data} />;
}
