import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/builder", "/deploy", "/settings", "/publish", "/editions"];

function isProtected(pathname: string) {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isAuthorized(req: NextRequest) {
  const expected = (process.env.FACTORY_TOKEN || "").trim();
  if (!expected) return false;

  const cookieOk = req.cookies.get("factory")?.value === "1";
  if (cookieOk) return true;

  const headerOk = req.headers.get("x-factory-token") === expected;
  return Boolean(headerOk);
}

export default function proxy(req: NextRequest) {
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
