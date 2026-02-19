import { NextResponse } from "next/server";
import { listEditions } from "../../../lib/editions-store";

export async function GET() {
  return NextResponse.json({ ok: true, slugs: listEditions().map((e) => e.slug) });
}
