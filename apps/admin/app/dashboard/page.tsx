import Link from "next/link";
import { products } from "@/lib/products";

async function countEditions() {
  const base = (process.env.NEVEDEL_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
  const r = await fetch(`${base}/api/editions/slugs`, { cache: "no-store" }).catch(() => null as any);
  if (!r || !r.ok) return 0;
  const j = await r.json().catch(() => null);
  return Array.isArray(j?.slugs) ? j.slugs.length : 0;
}

export default async function DashboardPage() {
  const productsCount = products.length;
  const editionsCount = await countEditions();

  return (
    <div className="stack">
      <h2 className="page-title">Dashboard</h2>
      <p>Products: <b>{productsCount}</b></p>
      <p>Editions: <b>{editionsCount}</b></p>
      <p><Link href="/products">Open products</Link></p>
    </div>
  );
}
