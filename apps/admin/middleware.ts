import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function middleware(req: NextRequest) {
  const expected = (process.env.ADMIN_TOKEN ?? "").trim();
  const headerToken = (req.headers.get("x-admin-token") ?? "").trim();
  const cookieToken = (req.cookies.get("ADMIN_TOKEN")?.value ?? "").trim();

  if (!expected || (headerToken !== expected && cookieToken !== expected)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|api).*)"],
};
