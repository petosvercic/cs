import Link from "next/link";
import { products } from "../../../lib/products";

type EditionItem = {
  slug: string;
  title?: string;
  createdAt?: string;
  updatedAt?: string;
};

async function fetchEditions(baseUrl: string): Promise<EditionItem[] | null> {
  const url = `${baseUrl.replace(/\/+$/, "")}/api/editions/slugs`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.ok !== true || !Array.isArray(data.editions)) return null;
    return data.editions as EditionItem[];
  } catch {
    return null;
  }
}

export default async function ProductDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;

  const product = products.find((p) => p.id === id);
  if (!product) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Product not found</h1>
      </main>
    );
  }

  const baseUrl = product.baseUrl.replace(/\/+$/, "");
  const editions = await fetchEditions(baseUrl);

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600 }}>{product.id}</h1>

      <p style={{ marginTop: 8 }}>
        Base URL:{" "}
        <a href={baseUrl} target="_blank" rel="noreferrer">
          {baseUrl}
        </a>
      </p>

      <p style={{ marginTop: 8 }}>
        <a href={`${baseUrl}/list`} target="_blank" rel="noreferrer">
          Open /list
        </a>
      </p>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Editions</h2>

        {editions ? (
          editions.length ? (
            <ul style={{ marginTop: 12, paddingLeft: 18 }}>
              {editions.map((e) => (
                <li key={e.slug} style={{ marginBottom: 6 }}>
                  <a href={`${baseUrl}/e/${e.slug}`} target="_blank" rel="noreferrer">
                    {e.slug}
                  </a>
                  {e.title ? <span> — {e.title}</span> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ marginTop: 12 }}>No editions found.</p>
          )
        ) : (
          <p style={{ marginTop: 12 }}>
            Could not load editions from <code>/api/editions/slugs</code>.
          </p>
        )}
      </section>

      <p style={{ marginTop: 24 }}>
        <Link href="/products">Back to products</Link>
      </p>
    </main>
  );
}