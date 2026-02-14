export type EnvCheck = { ok: boolean; missing: string[] };

const TRUE = new Set(["1", "true", "yes", "on", "enabled", "y", "t"]);
const FALSE = new Set(["0", "false", "no", "off", "disabled", "n", "f"]);

function checkEnv(keys: string[]): EnvCheck {
  const missing = keys.filter((k) => !(process.env[k] || "").trim());
  return { ok: missing.length === 0, missing };
}

export function getAppUrl() {
  const fromPublic = (process.env.NEXT_PUBLIC_APP_URL || "").trim();
  if (fromPublic) return fromPublic;

  const vercelUrl = (process.env.VERCEL_URL || "").trim();
  if (vercelUrl) return `https://${vercelUrl}`;

  return "http://localhost:3000";
}

export function isEnabled(key: string, fallback = false): boolean {
  const raw = process.env[key];
  if (raw == null) return fallback;

  const value = String(raw).trim().toLowerCase();
  if (TRUE.has(value)) return true;
  if (FALSE.has(value)) return false;

  return fallback;
}

export function paymentsEnabled(): boolean {
  return isEnabled("PAYMENTS_ENABLED", false);
}

/**
 * Called from app/layout.tsx. Keep it non-fatal.
 * Returns a check object so callers can use `.ok` if they want.
 */
export function assertServerEnv(): EnvCheck {
  // Put truly required server vars here if you want later.
  // For now: no hard requirements.
  return { ok: true, missing: [] };
}

/**
 * Used by Stripe routes/pages. MUST return `{ ok }` because callers do `const env = assertPaymentsEnv(); if (!env.ok) ...`
 */
export function assertPaymentsEnv(): EnvCheck {
  if (!paymentsEnabled()) return { ok: true, missing: [] };

  const required = [
    "STRIPE_SECRET_KEY",
    "STRIPE_PRICE_ID",
    "STRIPE_WEBHOOK_SECRET",
    "STRIPE_PUBLISHABLE_KEY"
  ];

  return checkEnv(required);
}
