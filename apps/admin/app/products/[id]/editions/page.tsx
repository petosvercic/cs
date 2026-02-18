import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Card } from "@/app/ui/card";
import { getProduct } from "@/lib/products";
import FilterableEditions from "./filterable-editions";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function ProductEditionsPage({ params }: PageProps) {
  const { id } = await params;
  const product = getProduct(id);

  if (!product) {
    notFound();
  }

  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || "http";
  const base = host ? `${proto}://${host}` : "";

  const response = await fetch(`${base}/api/products/${id}/editions/slugs`, { cache: "no-store" }).catch(() => null);

  if (!response || !response.ok) {
    return (
      <div className="stack">
        <h2 className="page-title">Editions: {product.title}</h2>
        <Card title="Error">
          <p>Could not load editions.</p>
          <p><Link href={`/products/${id}`}>Back to product</Link></p>
        </Card>
      </div>
    );
  }

  const json = (await response.json()) as { editions?: Array<{ slug?: string }> };
  const slugs = Array.isArray(json.editions) ? json.editions.map((e) => String(e?.slug || "")).filter(Boolean) : [];

  return (
    <div className="stack">
      <h2 className="page-title">Editions: {product.title}</h2>
      <p><Link href={`/products/${id}`}>← Back to product</Link></p>
      <Card title="Explorer">
        <FilterableEditions productId={id} baseUrl={product.baseUrl} slugs={slugs} />
      </Card>
    </div>
  );
}
