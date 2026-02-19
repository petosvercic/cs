import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PublishPage() {
  const c = await cookies();
  const ok = c.get("factory")?.value === "1";
  if (!ok) redirect("/factory-login");

  return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 900 }}>
      <h1>Publish</h1>
      <p style={{ opacity: 0.7 }}>
        Publish v tejto fáze ide cez <a href="/builder">/builder</a>.
      </p>
      <p>
        Backend: <code>/api/factory/dispatch</code>
      </p>
    </main>
  );
}
