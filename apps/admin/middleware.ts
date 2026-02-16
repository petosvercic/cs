import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // allow Next internals
  if (pathname.startsWith("/_next") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  const expected = process.env.ADMIN_TOKEN;
  const token = req.headers.get("x-admin-token");

  if (!expected || token !== expected) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  // protect UI only, NOT /api/*
  matcher: ["/((?!_next|favicon.ico|api).*)"],
};
