"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function FactoryLoginPage() {
  const [token, setToken] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [nextPath, setNextPath] = useState("/builder");
  const router = useRouter();

  useEffect(() => {
    const n = new URL(window.location.href).searchParams.get("next");
    if (n?.startsWith("/")) setNextPath(n);
  }, []);

  return (
    <main className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold">Factory login</h1>
      <input className="mt-4 w-full border p-2 text-black" type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="FACTORY_TOKEN" />
      <button
        className="mt-3 rounded bg-white px-4 py-2 text-black"
        onClick={async () => {
          setErr(null);
          const r = await fetch("/api/factory/login", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ token }),
          });
          const j = await r.json().catch(() => null);
          if (!r.ok || !j?.ok) {
            setErr(j?.error || "LOGIN_FAILED");
            return;
          }
          router.push(nextPath);
        }}
      >
        Login
      </button>
      {err ? <p className="mt-2 text-red-400">{err}</p> : null}
    </main>
  );
}
