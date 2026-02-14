import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const slug = String(u.searchParams.get("slug") ?? "").trim() || "demo-odomykanie";

  const cwd = process.cwd();

  const p1 = path.join(cwd, "data", "editions", `${slug}.json`);
  const p2 = path.join(cwd, "apps", "nevedelE", "data", "editions", `${slug}.json`);

  const e1 = fs.existsSync(p1);
  const e2 = fs.existsSync(p2);

  return NextResponse.json({
    cwd,
    slug,
    paths: { p1, p2 },
    exists: { p1: e1, p2: e2 },
  });
}
