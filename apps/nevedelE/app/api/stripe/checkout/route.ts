import { NextResponse } from "next/server";
import { getAppUrl } from "../../../../lib/env";
import Stripe from "stripe";

function baseUrl(req: Request) {
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (host) return `${proto}://${host}`;
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "http://localhost:3000").trim();
}

function requestBaseUrl(req: Request) {
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (host) return `${proto}://${host}`;
  return getAppUrl();
}

export async function POST(req: Request) {
  try {
    const body: any = await req.json().catch(() => null);
    const rid = String(body?.rid || "").trim();
    const returnTo = String(body?.returnTo || "/");
    const priceId = String(body?.priceId || process.env.STRIPE_PRICE_ID || "").trim();
    if (!rid) return NextResponse.json({ ok: false, error: "MISSING_RID" }, { status: 400 });
    if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ ok: false, error: "MISSING_STRIPE_SECRET_KEY" }, { status: 500 });
    if (!priceId) return NextResponse.json({ ok: false, error: "MISSING_PRICE_ID" }, { status: 500 });

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const appUrl = baseUrl(req);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}${returnTo}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}${returnTo}?canceled=1`,
      metadata: { rid },
      client_reference_id: rid,
    });
    return NextResponse.json({ ok: true, url: session.url });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR", message: String(e?.message ?? e) }, { status: 500 });
  }
}
