export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getEditionsIndex } from "../../../../lib/editions-index";

export async function GET() {
  try {
    const editions = (await getEditionsIndex()).map((item) => ({
      slug: item.slug,
      title: item.title,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }));

    return NextResponse.json({ ok: true, editions }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: String(error?.message ?? "Unknown error") }, { status: 500 });
  }
}
