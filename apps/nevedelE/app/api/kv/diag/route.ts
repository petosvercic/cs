import { NextResponse } from "next/server";
import { kv } from "../../../../lib/kv";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ ok: true, hasKv: Boolean(kv) });
}
