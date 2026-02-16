import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/app/ui/card";
import { getProduct } from "@/lib/products";

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

  let slugs: string[] = [];
  let fetchError: { status: number | string; message: string } | null = null;

  if (!response) {
    fetchError = { status: "network", message: "Failed to connect." };
  } else {
    const text = await response.text();

    if (!response.ok) {
      fetchError = {
        status: response.status,
        message: text.slice(0, 220)
      };
    } else {
      try {
        const json = JSON.parse(text) as { editions?: Array<{ slug?: string }> };
        slugs = Array.isArray(json.editions)
          ? json.editions.map((item) => String(item.slug || "")).filter(Boolean)
          : [];
      } catch {
        fetchError = { status: response.status, message: "Invalid JSON response." };
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
        {!fetchError ? (
          slugs.length > 0 ? (
            <ul>
              {slugs.map((slug) => (
                <li key={slug}><code>{slug}</code></li>
              ))}
            </ul>
          ) : (
            <p>No slugs returned.</p>
          )
        ) : (
          <div>
            <p><strong>Status:</strong> <code>{String(fetchError.status)}</code></p>
            <p><strong>Message:</strong> <code>{fetchError.message}</code></p>
          </div>
        )}
      </Card>
    </div>
  );
}
