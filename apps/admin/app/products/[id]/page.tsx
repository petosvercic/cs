import Link from "next/link";
import { Card } from "../../ui/card";
import { getProduct, products } from "../../../lib/products";

type PageProps = {
  params: any;
};

export default async function ProductDetailPage({ params }: PageProps) {
  const p = await Promise.resolve(params);
  const id = decodeURIComponent(String(p?.id ?? "")).trim();

  const product = getProduct(id);

  if (!product) {
    return (
      <div>
        <h2 style={{ margin: "0 0 12px 0" }}>Product not found</h2>
        <Card title="Debug">
          <p><strong>requested id:</strong> <code>{id || "(empty)"}</code></p>
          <p><strong>known ids:</strong> <code>{products.map(x => x.id).join(", ")}</code></p>
        </Card>

        <p style={{ marginTop: 12 }}>
          <Link href="/products">Back to products</Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ margin: "0 0 12px 0" }}>{product.title}</h2>

      <Card title="Bridge info">
        <p><strong>id:</strong> <code>{product.id}</code></p>
        <p><strong>baseUrl:</strong> <code>{product.baseUrl}</code></p>
        <p style={{ marginTop: 8 }}>
          <Link href={`${product.baseUrl}/list`}>Open {product.title} /list</Link>
        </p>
      </Card>

      <p style={{ marginTop: 12 }}>
        <Link href="/products">Back to products</Link>
      </p>
    </div>
  );
}
