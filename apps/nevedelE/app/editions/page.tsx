export const dynamic = "force-dynamic";

export default function EditionsToolsPage() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 900 }}>
      <h1>Editions</h1>
      <p style={{ opacity: 0.7 }}>
        Prehľad edícií je na <a href="/list">/list</a>.
      </p>
      <p>
        Slug refresh pre builder: <code>/api/editions/slugs</code>
      </p>
    </main>
  );
}
