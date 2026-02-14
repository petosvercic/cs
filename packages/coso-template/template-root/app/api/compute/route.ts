export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { compute } from "coso-engine";
import { EngineInputSchema } from "coso-contract";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const candidate =
      body && typeof body === "object" && "input" in (body as any) ? (body as any).input : null;

    const parsed = (EngineInputSchema as any).safeParse
      ? (EngineInputSchema as any).safeParse(candidate)
      : { success: true, data: (EngineInputSchema as any).parse(candidate) };

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "INVALID_INPUT", details: parsed.error?.issues ?? parsed.error ?? null },
        { status: 400 }
      );
    }

    const result = await compute(parsed.data);
    return NextResponse.json({ ok: true, result }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR", message: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
