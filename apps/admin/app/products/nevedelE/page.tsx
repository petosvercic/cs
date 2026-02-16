import { getProduct } from "../../lib/products";

export default function Page() {
  const p = getProduct("nevedelE");
  if (!p) return <main style={{ padding: 24 }}>Unknown product</main>;

  return (
    <main style={{ padding: 24, fontFamily: "ui-sans-serif, system-ui" }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>{p.name}</h1>
      <p><b>ID:</b> {p.id}</p>
      <p><b>Base URL:</b> {p.baseUrl}</p>
      <p style={{ marginTop: 16 }}>
        <a href="/products">← back</a>
      </p>
    </main>
  );
}
