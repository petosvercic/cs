export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getAppUrl } from "../../../../lib/env";

function safeReturnTo(x: unknown) {
  if (typeof x !== "string") return null;
  const s = x.trim();
  if (!s.startsWith("/")) return null;
  if (s.startsWith("//")) return null;
  return s;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as null | { rid?: unknown; slug?: unknown; returnTo?: unknown; priceId?: unknown };
    const rid = typeof body?.rid === "string" ? body.rid : null;
    const slug = typeof body?.slug === "string" ? body.slug.trim() : "";
    const returnTo = safeReturnTo(body?.returnTo) ?? "/";
    const priceId = (typeof body?.priceId === "string" ? body.priceId : (process.env.STRIPE_PRICE_ID ?? null));
    const appUrl = getAppUrl();
    const key = process.env.STRIPE_SECRET_KEY ?? null;

    if (!rid) return NextResponse.json({ ok: false, error: "MISSING_RID" }, { status: 400 });
    if (!key) return NextResponse.json({ ok: false, error: "MISSING_STRIPE_SECRET_KEY" }, { status: 500 });
    if (!priceId) return NextResponse.json({ ok: false, error: "MISSING_PRICE_ID" }, { status: 500 });

    const stripe = new Stripe(key);

    const success = `${appUrl}${returnTo}?rid=${encodeURIComponent(rid)}&session_id={CHECKOUT_SESSION_ID}`;
    const cancel  = `${appUrl}${returnTo}?rid=${encodeURIComponent(rid)}&canceled=1`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: success,
      cancel_url: cancel,
      metadata: { rid, ...(slug ? { slug } : {}) },
      client_reference_id: rid,
    });

    if (!session.url) return NextResponse.json({ ok: false, error: "NO_CHECKOUT_URL" }, { status: 500 });
    return NextResponse.json({ ok: true, url: session.url }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR", message: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}