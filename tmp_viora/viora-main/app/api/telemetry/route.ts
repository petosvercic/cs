import { NextResponse } from "next/server";

type TelemetryEvent =
  | {
      type: "submit";
      at: string;
      rid: string;
      dobISO: string;
      nameHash: string;
      nameLen: number;
      zodiac: string;
      cz: string;
      age: number;
      daysAlive: number;
      factSummary: Array<{
        section: string;
        rows: Array<{ id: string; value: string }>;
      }>;
    }
  | {
      type: "paid";
      at: string;
      rid: string;
      sessionId?: string;
    };

export async function POST(req: Request) {
  if (process.env.TELEMETRY_ENABLED !== "1") {
    return new NextResponse(null, { status: 204 });
  }

  try {
    const body = (await req.json()) as TelemetryEvent;

    if (!body || typeof body !== "object" || !("type" in body) || typeof body.type !== "string") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    console.log("[telemetry]", JSON.stringify(body));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[telemetry:error]", e);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
