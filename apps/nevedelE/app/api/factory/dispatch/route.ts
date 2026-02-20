import { NextResponse } from "next/server";

function isAuthorized(req: Request) {
  const expected = (process.env.FACTORY_TOKEN || "").trim();
  if (!expected) return false;
  const header = (req.headers.get("x-factory-token") || "").trim();
  if (header && header === expected) return true;
  const cookie = req.headers.get("cookie") || "";
  return /(?:^|;\s*)factory=1(?:;|$)/.test(cookie);
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  return NextResponse.json({ ok: true, message: "Dispatch placeholder (protected)." });
}
