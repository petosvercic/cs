import { notFound } from "next/navigation";
import Link from "next/link";
import { products } from "@/lib/products";

type PageProps = {
  params: { id: string };
};

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = params;

  const product = products.find((p) => p.id === id);

  if (!product) {
    notFound();
  }

  return (
    <div>
      <h1>{product.title}</h1>

      <div style={{ marginTop: 24 }}>
        <p>
          <strong>baseUrl:</strong>{" "}
          <code>{product.baseUrl}</code>
        </p>

        <p>
          <Link href={`${product.baseUrl}/list`}>
            Open {product.title} /list
          </Link>
        </p>
      </div>
    </div>
  );
}
