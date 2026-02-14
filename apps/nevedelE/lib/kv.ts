import { Redis } from "@upstash/redis";

function pick(...vals: (string | undefined)[]) {
  for (const v of vals) {
    const t = (v || "").trim();
    if (t) return t;
  }
  return "";
}

// Podporíme oba sety názvov, lebo Upstash/Vercel to vie pomenovať rôzne.
const url = pick(
  process.env.UPSTASH_REDIS_REST_API_URL,
  process.env.UPSTASH_REDIS_REST_KV_REST_API_URL,
  process.env.UPSTASH_REDIS_REST_URL
);

const token = pick(
  process.env.UPSTASH_REDIS_REST_API_TOKEN,
  process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN
);

export const kv = url && token ? new Redis({ url, token }) : null;

export async function kvGet<T = any>(key: string): Promise<T | null> {
  if (!kv) return null;
  const v = await kv.get<T>(key);
  return (v ?? null) as any;
}

export async function kvSet(key: string, value: any, ttlSeconds?: number) {
  if (!kv) return;
  if (ttlSeconds && ttlSeconds > 0) {
    await kv.set(key, value, { ex: ttlSeconds });
  } else {
    await kv.set(key, value);
  }
}