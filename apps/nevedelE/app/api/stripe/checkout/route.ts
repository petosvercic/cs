export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getAppUrl } from "../../../../lib/env";

function safeReturnTo(x: unknown) {
  if (typeof x !== "string") return null;
  const s = x.trim();
  if (!s.startsWith("/") || s.startsWith("//")) return null;
  return s;
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
    const rid = typeof body?.rid === "string" ? body.rid : "";
    const slug = typeof body?.slug === "string" ? body.slug : "";
    const returnTo = safeReturnTo(body?.returnTo) ?? "/";
    const priceId = typeof body?.priceId === "string" ? body.priceId : process.env.STRIPE_PRICE_ID;

    if (!rid) return NextResponse.json({ ok: false, error: "MISSING_RID" }, { status: 400 });
    if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ ok: false, error: "MISSING_STRIPE_SECRET_KEY" }, { status: 500 });
    if (!priceId) return NextResponse.json({ ok: false, error: "MISSING_PRICE_ID" }, { status: 500 });

    const baseUrl = requestBaseUrl(req);
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const success = `${baseUrl}${returnTo}?session_id={CHECKOUT_SESSION_ID}&rid=${encodeURIComponent(rid)}`;
    const cancel = `${baseUrl}${returnTo}?rid=${encodeURIComponent(rid)}&canceled=1`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: success,
      cancel_url: cancel,
      metadata: { rid, ...(slug ? { slug } : {}) },
      client_reference_id: rid,
    });

    return NextResponse.json({ ok: true, url: session.url });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR", message: String(e?.message ?? e) }, { status: 500 });
  }
}
