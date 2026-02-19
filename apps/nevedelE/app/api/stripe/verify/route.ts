import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: Request) {
  try {
    const body: any = await req.json().catch(() => null);
    const sessionId = String(body?.sessionId || "");
    if (!sessionId) return NextResponse.json({ paid: false, error: "Missing sessionId" }, { status: 400 });
    if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ paid: false, error: "MISSING_STRIPE_SECRET_KEY" }, { status: 500 });

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return NextResponse.json({ paid: session.payment_status === "paid", resultId: session.metadata?.rid || session.metadata?.resultId || null });
  } catch (e: any) {
    return NextResponse.json({ paid: false, error: e?.message || "Stripe verify failed" }, { status: 500 });
  }
}
