import { NextResponse } from "next/server";
import { getStripe } from "../../../lib/stripe";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const sessionId = String(body?.sessionId || "");

    if (!sessionId) {
      return NextResponse.json({ paid: false, error: "Missing sessionId" }, { status: 400 });
    }

    const stripe = getStripe();

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const paid = session.payment_status === "paid";

    // resultId uložené v metadata, fallback necháš na klientovi
    const resultId =
      typeof session.metadata?.resultId === "string" ? session.metadata.resultId : null;

    return NextResponse.json({ paid, resultId });
  } catch (e: any) {
    return NextResponse.json(
      { paid: false, error: e?.message || "Stripe verify failed" },
      { status: 500 }
    );
  }
}
