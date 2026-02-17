import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/app/ui/card";
import { getProduct } from "@/lib/products";
import { EditionsPanel } from "./editions-panel";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const product = getProduct(id);

  if (!product) {
    notFound();
  }

  const slugsUrl = `${product.baseUrl}/api/editions/slugs`;
  const response = await fetch(slugsUrl, { cache: "no-store" }).catch(() => null);

  let initialSlugs: string[] = [];
  let initialError: { status: number | string; message: string } | null = null;

  if (!response) {
    initialError = { status: "network", message: "Failed to connect." };
  } else {
    const text = await response.text();

    if (!response.ok) {
      initialError = {
        status: response.status,
        message: text.slice(0, 220)
      };
    } else {
      try {
        const json = JSON.parse(text) as { editions?: Array<{ slug?: string }> };
        if (!Array.isArray(json.editions)) {
          throw new Error("unexpected-shape");
        }
        initialSlugs = json.editions.map((item) => String(item.slug || "")).filter(Boolean);
      } catch {
        initialError = { status: response.status, message: "Could not load editions" };
      }
    }
  }

  return (
    <div className="stack">
      <h2 className="page-title">Product: {product.title}</h2>

      <Card title="Bridge info">
        <p><strong>baseUrl:</strong> <code>{product.baseUrl}</code></p>
        <p><Link href={`${product.baseUrl}/list`}>Open {product.title} /list</Link></p>
      </Card>

      <Card title="Editions slugs (server-side fetch, no-store)">
        <EditionsPanel
          baseUrl={product.baseUrl}
          initialSlugs={initialSlugs}
          initialError={initialError}
        />
      </Card>
    </div>
  );
}
