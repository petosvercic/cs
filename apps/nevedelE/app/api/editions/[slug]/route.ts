import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

function dataRoot() {
  const cwd = process.cwd();
  if (cwd.endsWith(path.join("apps", "nevedelE"))) return path.join(cwd, "data");
  return path.join(cwd, "apps", "nevedelE", "data");
}

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { slug } = await ctx.params;
  const fp = path.join(dataRoot(), "editions", `${slug}.json`);
  if (!fs.existsSync(fp)) return NextResponse.json({ ok: false, error: "not-found" }, { status: 404 });
  const edition = JSON.parse(fs.readFileSync(fp, "utf8").replace(/^\uFEFF/, ""));
  return NextResponse.json({ ok: true, edition });
}
