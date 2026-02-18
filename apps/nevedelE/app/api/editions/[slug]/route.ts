import { NextResponse } from "next/server";
import { loadEditionBySlug } from "../../../../lib/editions-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const edition = loadEditionBySlug(slug);

  if (!edition) {
    return NextResponse.json({ ok: false, error: "not-found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, edition }, { status: 200 });
}
