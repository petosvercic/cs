import { notFound } from "next/navigation";
import { Badge } from "@/app/ui/badge";
import { Card } from "@/app/ui/card";
import { getProductDetail } from "@/lib/repo-data";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const detail = await getProductDetail(id);

  if (!detail) {
    notFound();
  }

  return (
    <div className="stack">
      <h2 className="page-title">Product: {detail.title}</h2>

      <Card title="Identity">
        <p>
          Name: <strong>{detail.name}</strong>
        </p>
        <p>
          Path: <code>{detail.path}</code>
        </p>
        <p>
          Exists:{" "}
          <Badge tone={detail.exists ? "success" : "warning"}>
            {detail.exists ? "yes" : "no"}
          </Badge>
        </p>
        <p>Last modified: {detail.lastModified ?? "n/a"}</p>
      </Card>

      <Card title="Scripts">
        {Object.keys(detail.scripts).length === 0 ? (
          <p>No scripts found.</p>
        ) : (
          <ul>
            {Object.entries(detail.scripts).map(([name, cmd]) => (
              <li key={name}>
                <strong>{name}</strong>: <code>{cmd}</code>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Dependencies summary">
        <p>Total: {detail.dependenciesSummary.count}</p>
        <p>
          {detail.dependenciesSummary.names.slice(0, 12).join(", ") || "none"}
        </p>
      </Card>
    </div>
  );
}
