import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

function dataRoot() {
  const cwd = process.cwd();
  if (cwd.endsWith(path.join("apps", "nevedelE"))) return path.join(cwd, "data");
  return path.join(cwd, "apps", "nevedelE", "data");
}

export async function GET() {
  const editionsDir = path.join(dataRoot(), "editions");
  if (!fs.existsSync(editionsDir)) return NextResponse.json({ ok: true, slugs: [] });
  const slugs = fs.readdirSync(editionsDir).filter((x) => x.endsWith(".json")).map((x) => x.replace(/\.json$/, ""));
  return NextResponse.json({ ok: true, slugs });
}
