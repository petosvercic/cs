import { NextResponse } from "next/server";
import { getStripe } from "../../../lib/stripe";

type CheckoutBody = {
  kind?: "full" | "addon" | "mini_report";
  moduleSlug?: string;
  email?: string;
  name?: string;
  isPremium?: boolean;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CheckoutBody;
    const kind = body?.kind;
    const moduleSlug = body?.moduleSlug;
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const isPremium = Boolean(body?.isPremium);

    if (kind !== "full" && kind !== "addon" && kind !== "mini_report") {
      return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
    }

    if ((kind === "addon" || kind === "mini_report") && !moduleSlug) {
      return NextResponse.json({ error: "Missing moduleSlug" }, { status: 400 });
    }

    const stripe = getStripe();

    const priceFull = process.env.STRIPE_PRICE_FULL || "price_1T45iMP8pde7A7bVFbmhYpRa";
    const priceAddonBase = process.env.STRIPE_PRICE_ADDON_BASE || "price_1T45k9P8pde7A7bViFY3i64o";
    const priceAddonPremium = process.env.STRIPE_PRICE_ADDON_PREMIUM;
    const priceMiniReport = process.env.STRIPE_PRICE_MINI_REPORT || process.env.STRIPE_PRICE_ADDON_PREMIUM || "price_1T45k9P8pde7A7bViFY3i64o";

    let price = priceFull;
    let usedPremiumFallback = false;

    if (kind === "addon") {
      if (isPremium && priceAddonPremium) {
        price = priceAddonPremium;
      } else {
        price = priceAddonBase;
        if (isPremium && !priceAddonPremium) usedPremiumFallback = true;
      }
    }

    if (kind === "mini_report") {
      price = priceMiniReport;
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || req.headers.get("origin") || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{ price, quantity: 1 }],
      success_url: `${baseUrl}/profile?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/profile?canceled=1`,
      customer_email: email || undefined,
      metadata: {
        kind,
        moduleSlug: moduleSlug || "",
        name,
      },
    });

    return NextResponse.json({ url: session.url, usedPremiumFallback });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Stripe checkout failed" }, { status: 500 });
  }
}
