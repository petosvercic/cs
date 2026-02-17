import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

export async function GET() {
  try {
    const editionsDir = path.join(process.cwd(), "data", "editions");
    const files = fs.readdirSync(editionsDir);

    const slugs = files
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(".json", ""));

    return NextResponse.json({ slugs });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to read editions" },
      { status: 500 }
    );
  }
}
