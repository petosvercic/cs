export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 900 }}>
      <h1>Settings</h1>
      <p style={{ opacity: 0.7 }}>Interné settings pre nevedelE (V1).</p>
      <p>
        <strong>Auth:</strong> cookie alebo header <code>x-factory-token</code> (guard v proxy.ts)
      </p>
    </main>
  );
}
