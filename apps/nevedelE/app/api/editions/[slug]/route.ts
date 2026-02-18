import { NextResponse } from "next/server";
import { loadEditionBySlug } from "../../../../lib/editions-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { slug } = await ctx.params;

  const edition = loadEditionBySlug(slug);
  if (!edition) {
    return NextResponse.json({ ok: false, error: "not-found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, edition }, { status: 200 });
}
