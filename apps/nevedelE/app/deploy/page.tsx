import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DeployPage() {
  const c = await cookies();
  const ok = c.get("factory")?.value === "1";
  if (!ok) redirect("/factory-login");

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
