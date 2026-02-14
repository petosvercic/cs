import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PREFIXES = [
  "/",
  "/list",
  "/soc-stat",
  "/factory-login",
  "/api/factory/login",
  "/e/",
  "/api/compute",
  "/api/stripe/",
  "/api/pay/",
  "/_next/",
  "/favicon.ico",
];

const PROTECTED_PREFIXES = [
  "/builder",
  "/editions",
  "/api/build",
  "/api/builder",
  "/api/github",
  "/api/factory",
];

function isPublic(pathname: string) {
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p));
}

function isProtected(pathname: string) {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export default function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  if (pathname === "/api/factory/login") return NextResponse.next();

  if (isPublic(pathname) || !isProtected(pathname)) return NextResponse.next();

  const token = (process.env.FACTORY_TOKEN || "").trim();
  if (!token) {
    if (process.env.VERCEL === "1") {
      return new NextResponse("FACTORY_TOKEN_MISSING", { status: 401 });
    }
    return NextResponse.next();
  }

  const cookieOk = req.cookies.get("factory")?.value === "1";
  const headerOk = req.headers.get("x-factory-token") === token;

  if (cookieOk || headerOk) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/factory-login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
