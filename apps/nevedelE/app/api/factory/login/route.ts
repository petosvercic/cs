import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const expected = (process.env.FACTORY_TOKEN || "").trim();
  if (!expected) {
    return NextResponse.json({ ok: false, error: "FACTORY_TOKEN_MISSING" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({} as any));
  const got = String(body?.token ?? "").trim();

  if (!got || got !== expected) {
    return NextResponse.json({ ok: false, error: "LOGIN_FAILED" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("factory", "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}