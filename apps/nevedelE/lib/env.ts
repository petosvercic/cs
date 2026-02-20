export type EnvCheck = { ok: boolean; missing: string[] };

const TRUE = new Set(["1", "true", "yes", "on", "enabled", "y", "t"]);
const FALSE = new Set(["0", "false", "no", "off", "disabled", "n", "f"]);

function checkEnv(keys: string[]): EnvCheck {
  const missing = keys.filter((k) => !(process.env[k] || "").trim());
  return { ok: missing.length === 0, missing };
}

export function getAppUrl() {
  return (
    (process.env.NEXT_PUBLIC_SITE_URL || "").trim() ||
    (process.env.SITE_URL || "").trim() ||
    (process.env.NEXT_PUBLIC_APP_URL || "").trim() ||
    ((process.env.VERCEL_URL || "").trim() ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
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

export function assertServerEnv(): EnvCheck {
  return { ok: true, missing: [] };
}

export function assertPaymentsEnv(): EnvCheck {
  if (!paymentsEnabled()) return { ok: true, missing: [] };
  return checkEnv(["STRIPE_SECRET_KEY"]);
}
