import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { slug } = await ctx.params;

  const editionPath = path.join(process.cwd(), "vendor", "coso-sites", "editions", `${slug}.json`);

  try {
    const raw = await fs.readFile(editionPath, "utf8");
    const json = JSON.parse(raw);
    return NextResponse.json(json, { status: 200 });
  } catch (e: unknown) {
    const errCode = typeof e === "object" && e !== null && "code" in e ? (e as { code?: string }).code : undefined;
    const msg =
      errCode === "ENOENT"
        ? `Edition not found: ${slug}`
        : `Edition read/parse failed: ${e instanceof Error ? e.message : "unknown error"}`;

    return NextResponse.json({ error: msg, slug }, { status: 404 });
  }
}