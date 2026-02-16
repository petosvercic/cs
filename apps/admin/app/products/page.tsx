import Link from "next/link";
import { Table } from "../ui/table";
import { listProducts } from "@/lib/repo-data";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await listProducts();

  const rows = products.map((product) => [
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
