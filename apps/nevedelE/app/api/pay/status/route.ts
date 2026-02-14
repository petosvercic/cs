import Stripe from "stripe";
import { NextResponse } from "next/server";
import { getRedis } from "../../../../lib/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const rid = (u.searchParams.get("rid") ?? "").trim();
  const slug = (u.searchParams.get("slug") ?? "").trim();
  const sessionId = (u.searchParams.get("session_id") ?? "").trim();

  const redis = getRedis();
  const envOk = Boolean(getRedis());

  if (sessionId && process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session?.payment_status === "paid") {
        return NextResponse.json({ paid: true, envOk, rid, slug, via: "stripe-session" }, { status: 200 });
      }
    } catch {
      // continue with redis fallback
    }
  }

  if (!rid) {
    return NextResponse.json({ paid: false, error: "missing rid", envOk }, { status: 200 });
  }

  if (!redis) {
    return NextResponse.json({ paid: false, envOk, reason: "redis-not-configured" }, { status: 200 });
  }

  const key1 = `paid:${rid}:${slug}`;
  const key2 = `paid:${rid}`;

  const v1 = slug ? await redis.get<string>(key1) : null;
  const v2 = await redis.get<string>(key2);

  const paid = v1 === "1" || v1 === "true" || v2 === "1" || v2 === "true";

  return NextResponse.json({
    paid,
    envOk,
    rid,
    slug,
    keysTried: slug ? [key1, key2] : [key2],
    values: slug ? { [key1]: v1, [key2]: v2 } : { [key2]: v2 },
  });
}
