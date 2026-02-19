import Link from "next/link";
import { getProduct } from "../../../lib/products";

export const dynamic = "force-dynamic";

const toolPaths = ["builder", "deploy", "settings", "publish", "editions", "list"] as const;

export default function ProductPage({ params }: { params: { id: string } }) {
  const product = getProduct(params.id);

  if (!product) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 900 }}>
        <h1>Unknown product</h1>
        <p style={{ opacity: 0.7 }}>
          Product <b>{params.id}</b> is not configured in admin registry.
        </p>
        <ul>
          <li>
            <Link href="/products">Back to products</Link>
          </li>
        </ul>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 900 }}>
      <h1>Product: {product.title}</h1>
      <p style={{ opacity: 0.7 }}>Admin = dohľad. Otváraj tools priamo v produkte.</p>

      <ul>
        <li>
          <Link href="/products">Back to products</Link>
        </li>
      </ul>

      <h2>Open product tools</h2>
      <ul>
        {toolPaths.map((tool) => (
          <li key={tool}>
            <a href={`${product.baseUrl}/${tool}`}>Open /{tool}</a>
          </li>
        ))}
      </ul>
    </main>
  );
}
