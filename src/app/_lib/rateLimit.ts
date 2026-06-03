type RateLimitOptions = {
  keyPrefix: string;
  limit: number;
  windowMs: number;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitBucket>();

function getClientKey(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0];
  const realIp = request.headers.get("x-real-ip");
  return (forwardedFor || realIp || "unknown").trim();
}

export async function checkRateLimit(request: Request, options: RateLimitOptions) {
  const now = Date.now();
  const key = `${options.keyPrefix}:${getClientKey(request)}`;
  const distributed = await checkDistributedRateLimit(key, options);

  if (distributed) {
    return distributed;
  }

  const current = buckets.get(key);
  const bucket =
    current && current.resetAt > now
      ? current
      : { count: 0, resetAt: now + options.windowMs };

  bucket.count += 1;
  buckets.set(key, bucket);

  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((bucket.resetAt - now) / 1000),
  );
  const remaining = Math.max(0, options.limit - bucket.count);
  const headers = {
    "RateLimit-Limit": String(options.limit),
    "RateLimit-Remaining": String(remaining),
    "RateLimit-Reset": String(retryAfterSeconds),
    "Retry-After": String(retryAfterSeconds),
  };

  return {
    headers,
    limited: bucket.count > options.limit,
  };
}

async function checkDistributedRateLimit(
  key: string,
  options: RateLimitOptions,
) {
  const url =
    process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!url || !token) return null;

  try {
    const response = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
      body: JSON.stringify([
        ["INCR", key],
        ["PEXPIRE", key, options.windowMs, "NX"],
        ["PTTL", key],
      ]),
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (!response.ok) return null;

    const data = (await response.json()) as Array<{ result?: unknown }>;
    const count = Number(data[0]?.result);
    const ttlMs = Number(data[2]?.result);

    if (!Number.isFinite(count) || !Number.isFinite(ttlMs)) return null;

    const retryAfterSeconds = Math.max(1, Math.ceil(ttlMs / 1000));

    return {
      headers: {
        "RateLimit-Limit": String(options.limit),
        "RateLimit-Remaining": String(Math.max(0, options.limit - count)),
        "RateLimit-Reset": String(retryAfterSeconds),
        "Retry-After": String(retryAfterSeconds),
      },
      limited: count > options.limit,
    };
  } catch {
    return null;
  }
}
