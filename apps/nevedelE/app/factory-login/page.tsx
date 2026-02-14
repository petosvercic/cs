"use client";

import { useState } from "react";

export default function FactoryLogin() {
  const [token, setToken] = useState("");
  const [err, setErr] = useState("");

  async function go() {
    setErr("");
    const url = new URL(window.location.href);
    const next = url.searchParams.get("next") || "/builder";

    const r = await fetch("/api/factory/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    });

    const j = await r.json().catch(() => null);
    if (!j?.ok) {
      setErr(j?.error || "LOGIN_FAILED");
      return;
    }
    window.location.href = next;
  }

  return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 520 }}>
      <h1>Factory login</h1>
      <p style={{ opacity: 0.7 }}>Zadaj FACTORY_TOKEN pre prístup k builderu.</p>

      <input
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="FACTORY_TOKEN"
        style={{ width: "100%", padding: 12 }}
      />
      <button onClick={go} style={{ padding: 12, marginTop: 10 }}>Login</button>

      {err ? <p style={{ color: "crimson" }}>{err}</p> : null}
    </main>
  );
}