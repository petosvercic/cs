import { NextResponse } from "next/server";

export function GET() {
  const hasAdminToken = Boolean(process.env.ADMIN_TOKEN);
  const hasBaseUrl = Boolean(process.env.NEVEDEL_BASE_URL);
  return NextResponse.json({ ok: true, hasAdminToken, hasBaseUrl });
}
