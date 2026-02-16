import Link from "next/link";
import { Table } from "../ui/table";
import { products } from "@/lib/products";

export const dynamic = "force-dynamic";

export default function ProductsPage() {
  const rows = products.map((product) => [
    product.id,
    product.title,
    product.baseUrl,
    <Link key={product.id} href={`/products/${product.id}`}>Open</Link>
  ]);

  return (
    <div className="stack">
      <h2 className="page-title">Products</h2>
      <Table headers={["ID", "Title", "Base URL", "Detail"]} rows={rows} />
    </div>
  );
}
