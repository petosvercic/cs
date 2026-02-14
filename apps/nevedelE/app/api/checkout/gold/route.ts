import Stripe from "stripe";
import { NextResponse } from "next/server";
import { assertPaymentsEnv, paymentsEnabled } from "../../../../lib/env";


export async function POST() {
  if (!paymentsEnabled()) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const env = assertPaymentsEnv();
  if (!env.ok) return NextResponse.json({ ok: false }, { status: 500 });

  const secret = process.env.STRIPE_SECRET_KEY as string;
  const price = process.env.STRIPE_PRICE_ID as string;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL as string;

  // Foundation rule: payment must never alter result truth; Gold is optional depth only.
  const stripe = new Stripe(secret);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price, quantity: 1 }],
    success_url: `${appUrl}/gold/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/gold/cancel`,
    allow_promotion_codes: false,
  });

  return NextResponse.json({ url: session.url });
}
