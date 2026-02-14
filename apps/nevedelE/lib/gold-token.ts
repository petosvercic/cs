import crypto from "node:crypto";

function tokenSecret(): string {
  return process.env.GOLD_TOKEN_SECRET ?? "local-gold-token-secret";
}

export function signGoldCookie(sessionId: string, expiresAt: number): string {
  const payload = `1.${expiresAt}.${sessionId}`;
  const signature = crypto.createHmac("sha256", tokenSecret()).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

export function verifyGoldCookie(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length < 4) return false;

  const [flag, expiresRaw, sessionId, signature] = parts;
  if (flag !== "1" || !expiresRaw || !sessionId || !signature) return false;

  const expires = Number(expiresRaw);
  if (!Number.isFinite(expires) || Date.now() > expires) return false;

  const payload = `${flag}.${expiresRaw}.${sessionId}`;
  const expected = crypto.createHmac("sha256", tokenSecret()).update(payload).digest("hex");

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
