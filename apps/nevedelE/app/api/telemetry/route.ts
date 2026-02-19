import { NextResponse } from "next/server";

export async function POST(req: Request) {
  if (process.env.TELEMETRY_ENABLED !== "1") return new NextResponse(null, { status: 204 });
  try {
    const body = await req.json();
    if (!body || typeof body !== "object" || typeof (body as any).type !== "string") return NextResponse.json({ ok: false }, { status: 400 });
    console.log("[telemetry]", JSON.stringify(body));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
