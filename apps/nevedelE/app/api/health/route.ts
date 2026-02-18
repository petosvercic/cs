import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    app: "nevedelE",
    version: process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GIT_SHA ?? null,
    ts: new Date().toISOString()
  });
}
