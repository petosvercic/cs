import EditionClient from "./ui";
import { loadEditionBySlug } from "../../../lib/editions-store";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const edition = loadEditionBySlug(slug);

  if (!edition) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-14">
        <h1 className="text-3xl font-semibold">404</h1>
        <p className="mt-2 text-neutral-500">
          Edícia <b>{slug}</b> neexistuje alebo sa nedá načítať.
        </p>
      </main>
    );
  }

  return <EditionClient slug={slug} edition={edition} />;
}
