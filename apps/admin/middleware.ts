import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next") || pathname === "/favicon.ico" || pathname === "/api/health") {
    return NextResponse.next();
  }

  const expected = (process.env.ADMIN_TOKEN || "").trim();
  const actual = (request.headers.get("x-admin-token") || "").trim();

  if (!expected || actual !== expected) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|api/health).*)"],
};

