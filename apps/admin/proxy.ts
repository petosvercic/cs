import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  const expected = (process.env.ADMIN_TOKEN ?? "").trim();

  const headerToken = (req.headers.get("x-admin-token") ?? "").trim();
  const cookieAuthed = req.cookies.get("admin")?.value === "1";

  const ok = Boolean(expected) && (headerToken === expected || cookieAuthed);

  if (!ok) return new NextResponse("Unauthorized", { status: 401 });

  return NextResponse.next();
}

export const config = {
  // middleware chrani iba UI routy, nie /api/*
  matcher: ["/((?!_next|favicon.ico|api).*)"],
};

