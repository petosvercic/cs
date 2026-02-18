export const dynamic = "force-dynamic";

export default function DeployPage() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 900 }}>
      <h1>Deploy</h1>
      <p style={{ opacity: 0.7 }}>Interné tools pre nevedelE (V1).</p>
      <ul>
        <li><a href="/builder">Builder</a></li>
        <li><a href="/list">Deployed editions (/list)</a></li>
      </ul>
    </main>
  );
}
