import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { NextResponse } from "next/server";
import { generateFacts } from "coso-nevedel-core";

type ProductConfig = {
  engine?: {
    subject?: string;
  };
};

async function readProductConfig(): Promise<ProductConfig> {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const root = path.resolve(here, "..", "..", "..");
  const filePath = path.join(root, "product.config.json");
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as ProductConfig;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const name = typeof body?.name === "string" ? body.name : undefined;
    const birthDate = typeof body?.birthDate === "string" ? body.birthDate : "";

    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      return NextResponse.json({ ok: false, error: "INVALID_INPUT" }, { status: 400 });
    }

    const cfg = await readProductConfig();
    const subject = cfg.engine?.subject ?? "default_subject";
    const isPaid = false;

    const result = generateFacts({
      name,
      birthDate,
      subject,
      isPaid,
    });

    return NextResponse.json({ ok: true, result }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR", message: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
