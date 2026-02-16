import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const expected = (process.env.ADMIN_TOKEN ?? "").trim();

  // allow health and next assets
  const path = req.nextUrl.pathname;
  if (path.startsWith("/_next") || path === "/favicon.ico" || path === "/api/health" || path === "/api/login") {
    return NextResponse.next();
  }

  const headerToken = (req.headers.get("x-admin-token") ?? "").trim();
  const cookieAuthed = req.cookies.get("admin")?.value === "1";

  const ok = Boolean(expected) && (headerToken === expected || cookieAuthed);

  if (!ok) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};
