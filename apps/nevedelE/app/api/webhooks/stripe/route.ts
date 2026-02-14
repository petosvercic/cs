import { promises as fs } from "node:fs";
import path from "node:path";
import Stripe from "stripe";
import { NextResponse } from "next/server";
import { assertPaymentsEnv, paymentsEnabled } from "../../../../lib/env";

const LOG_FILE = path.join(process.cwd(), ".tmp", "gold-entitlements.jsonl");


async function alreadyProcessed(eventId: string): Promise<boolean> {
  try {
    const content = await fs.readFile(LOG_FILE, "utf8");
    return content.split("\n").some((line) => line.includes(`"event_id":"${eventId}"`));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  if (!paymentsEnabled()) return NextResponse.json({ ok: true, disabled: true });

  const env = assertPaymentsEnv();
  if (!env.ok) return NextResponse.json({ ok: false }, { status: 500 });

  const secret = process.env.STRIPE_SECRET_KEY as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ ok: false }, { status: 400 });

  const rawBody = await req.text();

  const stripe = new Stripe(secret);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ ok: true, ignored: true });
  }

  if (await alreadyProcessed(event.id)) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  if (!session.id || session.payment_status !== "paid") {
    return NextResponse.json({ ok: true, ignored: true });
  }

  await fs.mkdir(path.dirname(LOG_FILE), { recursive: true });
  await fs.appendFile(
    LOG_FILE,
    `${JSON.stringify({ event_id: event.id, session_id: session.id, paid: true, ts: new Date().toISOString() })}\n`,
    "utf8",
  );

  return NextResponse.json({ ok: true });
}
