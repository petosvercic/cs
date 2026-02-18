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
  const healthUrl = `${product.baseUrl}/api/health`;
  const healthStart = Date.now();
  const healthResponse = await fetch(healthUrl, { cache: "no-store" }).catch(() => null);
  const healthMs = Date.now() - healthStart;

  let initialSlugs: string[] = [];
  let initialError: { status: number | string; message: string } | null = null;
  let healthStatus: "ok" | "error" = "error";
  let healthVersion: string | null = null;
  let healthError: string | null = null;

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

  if (!healthResponse) {
    healthError = "Health check failed";
  } else {
    const healthText = await healthResponse.text();

    if (!healthResponse.ok) {
      healthError = "Health check failed";
    } else {
      try {
        const healthJson = JSON.parse(healthText) as { status?: unknown; ok?: unknown; version?: unknown };
        healthStatus = healthJson.status === "ok" || healthJson.ok === true ? "ok" : "error";
        healthVersion = typeof healthJson.version === "string" ? healthJson.version : null;
      } catch {
        healthError = "Health check failed";
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

      <Card title="Health">
        <p><strong>Status:</strong> <code>{healthStatus}</code></p>
        <p><strong>responseTimeMs:</strong> <code>{healthMs}</code></p>
        {healthVersion ? <p><strong>Version:</strong> <code>{healthVersion}</code></p> : null}
        {healthError ? <p>{healthError}</p> : null}
      </Card>

      <Card title="Editions slugs (server-side fetch, no-store)">
        <EditionsPanel
          baseUrl={product.baseUrl}
          initialSlugs={initialSlugs}
          initialError={initialError}
          initialRefreshedAt={new Date().toISOString()}
        />
      </Card>
    </div>
  );
}
