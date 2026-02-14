// /apps/nevedelE/app/api/stripe/webhook/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getRedis } from "../../../../lib/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function stripeClient(): Stripe {
  // Stripe klient vytvárame až v runtime (v handleri), nie pri importe.
  const key = mustEnv("STRIPE_SECRET_KEY");
  return new Stripe(key);
}

export async function POST(req: Request) {
  try {
    const stripe = stripeClient();

    // Stripe webhook signature
    const sig = req.headers.get("stripe-signature");
    if (!sig) return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });

    const secret = mustEnv("STRIPE_WEBHOOK_SECRET");
    const rawBody = await req.text();

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, secret);
    } catch (err: any) {
      return NextResponse.json({ error: `Webhook signature verification failed: ${err?.message ?? err}` }, { status: 400 });
    }

    // OPTIONAL: ak používaš redis na uloženie "paid" statusu
    // Nech to nepadne pri importe: redis si berieme lazy.
    const redis = getRedis();

    // Tu si doplň svoje eventy podľa toho čo používaš
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // typicky: session.client_reference_id alebo metadata.rid/slug
      const rid = (session.client_reference_id ?? session.metadata?.rid ?? "").toString();
      const slug = (session.metadata?.slug ?? "").toString();

      if (redis && rid) {
        // napr: uložiť "paid" na rid (+ slug ak chceš)
        const key = slug ? `paid:${rid}:${slug}` : `paid:${rid}`;
        await redis.set(key, "1", { ex: 60 * 60 * 24 * 30 }); // 30 dní
      }
    }

    // Vráť 200 vždy, keď to spracuješ (inak Stripe retry spam)
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    // Runtime chyba (env chýba, redis problém atď.)
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}
