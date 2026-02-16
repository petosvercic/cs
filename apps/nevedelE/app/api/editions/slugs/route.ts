export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { listEditions } from "../../../../lib/editions-store";

export async function GET() {
  try {
    const editions = listEditions()
      .filter((item) => typeof item.slug === "string" && item.slug.trim())
      .map((item) => ({
        slug: item.slug,
        title: item.title,
        createdAt: item.createdAt
      }));

    return NextResponse.json({ ok: true, editions }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: String(error?.message ?? "Unknown error") }, { status: 500 });
  }
}
