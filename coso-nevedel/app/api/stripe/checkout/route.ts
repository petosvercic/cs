import { NextResponse } from "next/server";
import { getStripe } from "../../../lib/stripe";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const resultId = String(body?.resultId || "");

    if (!resultId) {
      return NextResponse.json({ error: "Missing resultId" }, { status: 400 });
    }

    const stripe = getStripe();

    const origin = req.headers.get("origin") || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Odomknutie výsledku",
              description: `Výsledok ID: ${resultId}`,
            },
            unit_amount: 100, // 1.00 €
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/?session_id={CHECKOUT_SESSION_ID}&rid=${encodeURIComponent(resultId)}`,
      cancel_url: `${origin}/?rid=${encodeURIComponent(resultId)}`,
      metadata: { resultId },
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Stripe checkout failed" },
      { status: 500 }
    );
  }
}
