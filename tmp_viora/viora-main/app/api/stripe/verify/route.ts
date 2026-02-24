import { NextResponse } from "next/server";
import { getStripe } from "../../../lib/stripe";

type VerifyBody = {
  sessionId?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as VerifyBody;
    const sessionId = String(body?.sessionId || "");

    if (!sessionId) {
      return NextResponse.json({ ok: false, error: "Missing sessionId" }, { status: 400 });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json({ ok: false });
    }

    const kind = session.metadata?.kind === "addon" ? "addon" : session.metadata?.kind === "full" ? "full" : session.metadata?.kind === "mini_report" ? "mini_report" : null;
    const moduleSlug = typeof session.metadata?.moduleSlug === "string" ? session.metadata.moduleSlug : undefined;
    const name = typeof session.metadata?.name === "string" ? session.metadata.name : undefined;

    if (!kind) {
      return NextResponse.json({ ok: false });
    }

    return NextResponse.json({ ok: true, kind, moduleSlug, name });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Stripe verify failed" }, { status: 500 });
  }
}
