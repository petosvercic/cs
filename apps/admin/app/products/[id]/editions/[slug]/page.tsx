import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Card } from "@/app/ui/card";
import { getProduct } from "@/lib/products";

type PageProps = {
  params: Promise<{ id: string; slug: string }>;
};

export const dynamic = "force-dynamic";

type EditionPayload = {
  ok?: boolean;
  error?: string;
  edition?: {
    title?: string;
    slug?: string;
    createdAt?: string;
    updatedAt?: string;
    engine?: { subject?: string; locale?: string };
    content?: {
      heroTitle?: string;
      heroSubtitle?: string;
      intro?: { title?: string; text?: string };
      paywall?: { headline?: string; bullets?: string[] };
    };
  };
};

export default async function ProductEditionDetailPage({ params }: PageProps) {
  const { id, slug } = await params;
  const product = getProduct(id);

  if (!product) {
    notFound();
  }

  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || "http";
  const base = host ? `${proto}://${host}` : "";

  const response = await fetch(`${base}/api/products/${id}/editions/${slug}`, { cache: "no-store" }).catch(() => null);

  if (!response || response.status === 404) {
    notFound();
  }

  if (!response.ok) {
    return (
      <div className="stack">
        <h2 className="page-title">Edition detail</h2>
        <Card title="Error">
          <p>Could not load edition.</p>
          <p><Link href={`/products/${id}/editions`}>← Back to editions</Link></p>
        </Card>
      </div>
    );
  }

  const json = (await response.json()) as EditionPayload;
  const edition = json?.edition;

  if (!edition || json?.ok === false || json?.error === "not-found") {
    notFound();
  }

  return (
    <div className="stack">
      <h2 className="page-title">Edition detail</h2>
      <p><Link href={`/products/${id}/editions`}>← Back to editions</Link></p>

      <Card title="Basic">
        <p><strong>title:</strong> {edition.title || "-"}</p>
        <p><strong>slug:</strong> <code>{edition.slug || slug}</code></p>
        <p><strong>createdAt:</strong> <code>{edition.createdAt || "-"}</code></p>
        <p><strong>updatedAt:</strong> <code>{edition.updatedAt || "-"}</code></p>
      </Card>

      <Card title="Engine">
        <p><strong>subject:</strong> <code>{edition.engine?.subject || "-"}</code></p>
        <p><strong>locale:</strong> <code>{edition.engine?.locale || "-"}</code></p>
      </Card>

      <Card title="Content">
        <p><strong>heroTitle:</strong> {edition.content?.heroTitle || "-"}</p>
        <p><strong>heroSubtitle:</strong> {edition.content?.heroSubtitle || "-"}</p>
        <p><strong>intro.title:</strong> {edition.content?.intro?.title || "-"}</p>
        <p><strong>intro.text:</strong> {edition.content?.intro?.text || "-"}</p>
      </Card>

      <Card title="Paywall">
        <p><strong>headline:</strong> {edition.content?.paywall?.headline || "-"}</p>
        {Array.isArray(edition.content?.paywall?.bullets) && edition.content?.paywall?.bullets.length > 0 ? (
          <ul>
            {edition.content?.paywall?.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
          </ul>
        ) : (
          <p>-</p>
        )}
      </Card>
    </div>
  );
}
