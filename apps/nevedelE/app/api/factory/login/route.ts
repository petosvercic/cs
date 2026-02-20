import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body: any = await req.json().catch(() => null);
  const token = String(body?.token || "").trim();
  const expected = (process.env.FACTORY_TOKEN || "").trim();
  if (!expected) return NextResponse.json({ ok: false, error: "FACTORY_TOKEN_MISSING" }, { status: 500 });
  if (!token || token !== expected) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

  const isProd = process.env.NODE_ENV === "production";
  const res = NextResponse.json({ ok: true }, { status: 200 });
  res.cookies.set("factory", "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return res;
}
