import { notFound } from "next/navigation";
import { Badge } from "@/app/ui/badge";
import { Card } from "@/app/ui/card";
import { adminFetch } from "@/lib/api-client";
import { ProductDetailResponse } from "@/lib/types";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;

  try {
    const detail = await adminFetch<ProductDetailResponse>(`/api/products/${id}`);

    return (
      <div className="stack">
        <h2 className="page-title">Product: {detail.title}</h2>
        <Card title="Identity">
          <p>Name: <strong>{detail.name}</strong></p>
          <p>Path: <code>{detail.path}</code></p>
          <p>
            Exists: <Badge tone={detail.exists ? "success" : "warning"}>{detail.exists ? "yes" : "no"}</Badge>
          </p>
          <p>Last modified: {detail.lastModified ?? "n/a"}</p>
        </Card>
        <Card title="Scripts">
          <ul>
            {Object.entries(detail.scripts).map(([name, cmd]) => (
              <li key={name}><strong>{name}</strong>: <code>{cmd}</code></li>
            ))}
          </ul>
        </Card>
        <Card title="Dependencies summary">
          <p>Total: {detail.dependenciesSummary.count}</p>
          <p>{detail.dependenciesSummary.names.slice(0, 12).join(", ") || "none"}</p>
        </Card>
      </div>
    );
  } catch {
    notFound();
  }
}
