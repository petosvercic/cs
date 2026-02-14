import Stripe from "stripe";
import { cookies } from "next/headers";
import { createTranslator, detectLanguage } from "../../one-day/localization";
import { signGoldCookie } from "../../../lib/gold-token";
import { assertPaymentsEnv, paymentsEnabled } from "../../../lib/env";

type Props = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function GoldSuccessPage({ searchParams }: Props) {
  const t = createTranslator(detectLanguage());
  const { session_id: sessionId } = await searchParams;

  const enabled = paymentsEnabled();
  const env = assertPaymentsEnv();

  if (enabled && env.ok && sessionId) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
      const signed = signGoldCookie(sessionId, expiresAt);
      const store = await cookies();
      store.set("GOLD", signed, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        expires: new Date(expiresAt),
        path: "/",
      });
      // Foundation rule: Gold entitlement adds optional depth only, never changes core result truth.
    }
  }

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-xl text-center text-neutral-800">
        <p className="text-base">{t("gold.success.text")}</p>
      </div>
    </main>
  );
}
