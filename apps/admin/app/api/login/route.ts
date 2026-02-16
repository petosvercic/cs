import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function GET(req: NextRequest) {
  const expected = (process.env.ADMIN_TOKEN ?? "").trim();

  const url = new URL(req.url);
  const token = (url.searchParams.get("token") ?? "").trim();

  if (!expected || token !== expected) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const res = NextResponse.redirect(new URL("/products", req.url));
  res.cookies.set({
    name: "admin",
    value: "1",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 dni
  });

  return res;
}
