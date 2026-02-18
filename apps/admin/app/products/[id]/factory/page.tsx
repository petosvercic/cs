import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/app/ui/card";
import { getProduct } from "@/lib/products";
import FactoryClient from "./factory-client";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function ProductFactoryPage({ params }: PageProps) {
  const { id } = await params;
  const product = getProduct(id);

  if (!product) {
    notFound();
  }

  return (
    <div className="stack">
      <h2 className="page-title">Factory: {product.title}</h2>
      <p><Link href={`/products/${id}`}>← Back to product</Link></p>
      <Card title="Manual LLM workflow (read-only)">
        <FactoryClient productId={id} />
      </Card>
    </div>
  );
}
