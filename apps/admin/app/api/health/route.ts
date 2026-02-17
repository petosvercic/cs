import { NextResponse } from "next/server";

export function GET(request: Request) {
  const expected = (process.env.ADMIN_TOKEN ?? "").trim();
  const actual = (request.headers.get("x-admin-token") ?? "").trim();

  return NextResponse.json({
    ok: true,
    hasAdminToken: Boolean(expected),
    hasBaseUrl: Boolean(process.env.NEVEDEL_BASE_URL),
    tokenPresent: Boolean(actual),
    tokenMatch: Boolean(expected) && actual === expected,
  });
}
