import { Button } from "../ui/button";
import { EmptyState } from "../ui/empty-state";
import { Table } from "../ui/table";
import { listEditionsForProduct } from "@/lib/repo-data";

type PageProps = {
  searchParams?: Promise<{ product?: string }>;
};

export const dynamic = "force-dynamic";

export default async function EditionsPage({ searchParams }: PageProps) {
  const resolved = (await searchParams) ?? {};
  const product = (resolved.product ?? "nevedelE").trim() || "nevedelE";
  const editions = await listEditionsForProduct(product);

  return (
    <div className="stack">
      <div className="row">
        <h2 className="page-title">Editions</h2>
        <form action="/editions" method="get" className="row" style={{ gap: 8 }}>
          <select name="product" defaultValue={product} className="input" style={{ maxWidth: 200 }}>
            <option value="nevedelE">nevedelE</option>
            <option value="admin">admin</option>
          </select>
          <Button type="submit" variant="primary">Refresh</Button>
        </form>
      </div>

      {editions.sourceNotFound ? (
        <EmptyState
          title="Editions source not found"
          description={`Searched: ${editions.searchedPaths.join(", ")}`}
        />
      ) : (
        <Table
          headers={["Slug", "Title", "Updated"]}
          rows={editions.items.map((item) => [item.slug, item.title, item.updatedAt ?? "-"])}
        />
      )}
    </div>
  );
}
