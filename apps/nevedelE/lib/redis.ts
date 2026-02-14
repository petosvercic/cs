import { Redis } from "@upstash/redis";

let _redis: Redis | null = null;

function pick(...vals: (string | undefined)[]) {
  for (const v of vals) {
    const t = (v || "").trim();
    if (t) return t;
  }
  return "";
}

export function getRedis(): Redis | null {
  if (_redis) return _redis;

  const url = pick(
    process.env.UPSTASH_REDIS_REST_URL,
    process.env.UPSTASH_REDIS_REST_API_URL,
    process.env.UPSTASH_REDIS_REST_KV_REST_API_URL,
    process.env.UPSTASH_REDIS_REST_KV_URL,
    process.env.UPSTASH_REDIS_REST_KV_UR,
    process.env.UPSTASH_REDIS_REST_REDIS_URL
  );

  const token = pick(
    process.env.UPSTASH_REDIS_REST_TOKEN,
    process.env.UPSTASH_REDIS_REST_API_TOKEN,
    process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN,
    process.env.UPSTASH_REDIS_REST_KV_REST_API_READ_ONLY_TOKEN
  );

  if (!url || !token) return null;

  _redis = new Redis({ url, token });
  return _redis;
}
