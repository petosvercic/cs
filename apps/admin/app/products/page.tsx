import Link from "next/link";
import { Table } from "../ui/table";
import { adminFetch } from "@/lib/api-client";
import { ProductListResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const response = await adminFetch<ProductListResponse>("/api/products");
  const rows = response.items.map((product) => [
    product.id,
    product.path,
    product.exists ? "yes" : "no",
    <Link key={product.id} href={`/products/${product.id}`}>Open</Link>
  ]);

  return (
    <div className="stack">
      <h2 className="page-title">Products</h2>
      <Table headers={["ID", "Path", "Exists", "Detail"]} rows={rows} />
    </div>
  );
}
