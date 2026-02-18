import Stripe from "stripe";

let stripeSingleton: Stripe | null = null;

export function getStripe() {
  if (stripeSingleton) return stripeSingleton;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    // Dôležité: NEHÁDŽ toto pri importe route. Toto sa zavolá až v requeste.
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  stripeSingleton = new Stripe(key, {
    apiVersion: "2026-01-28.clover",
  });

  return stripeSingleton;
}
