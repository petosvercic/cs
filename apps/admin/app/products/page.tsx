import { PRODUCTS } from "../lib/products";

export default function Page() {
  return (
    <main style={{ padding: 24, fontFamily: "ui-sans-serif, system-ui" }}>
      <h1 style={{ fontSize: 24, marginBottom: 12 }}>Products</h1>
      <ul>
        {PRODUCTS.map(p => (
          <li key={p.id} style={{ marginBottom: 8 }}>
            <a href={`/products/${p.id}`}>{p.name}</a>{" "}
            <small style={{ opacity: 0.7 }}>({p.baseUrl})</small>
          </li>
        ))}
      </ul>
    </main>
  );
}
