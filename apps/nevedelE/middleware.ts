import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/builder", "/deploy", "/settings", "/publish", "/editions"];

function isProtected(pathname: string) {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isAuthorized(req: NextRequest) {
  const expected = (process.env.FACTORY_TOKEN || "").trim();
  if (!expected) return false;

  const cookieToken = req.cookies.get("FACTORY_TOKEN")?.value;
  if (cookieToken && cookieToken === expected) return true;

  const headerToken = (req.headers.get("x-factory-token") || "").trim();
  return headerToken === expected;
}

export default function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  if (!isProtected(pathname)) return NextResponse.next();
  if (isAuthorized(req)) return NextResponse.next();

  const nextUrl = req.nextUrl.clone();
  nextUrl.pathname = "/factory-login";
  nextUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(nextUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
