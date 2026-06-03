type UsageBucket = {
  count: number;
  resetAt: number;
};

type UsageLimitOptions = {
  keyPrefix: string;
  limit: number;
  windowMs: number;
};

const usageBuckets = new Map<string, UsageBucket>();

const DAY_MS = 24 * 60 * 60 * 1000;
const MONTH_MS = 30 * DAY_MS;

const DEFAULT_DAILY_LIMITS = {
  flash: 150,
  pro: 80,
  ultra: 30,
};

const DEFAULT_MONTHLY_LIMITS = {
  flash: 2_000,
  pro: 1_000,
  ultra: 300,
};

export type UsageTier = keyof typeof DEFAULT_DAILY_LIMITS;

export function resolveAnonymousUsageSubject(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0];
  const realIp = request.headers.get("x-real-ip");
  return `anonymous:${(forwardedFor || realIp || "unknown").trim()}`;
}

export async function checkQuantumUsageLimit(
  request: Request,
  tier: UsageTier,
  subject = resolveAnonymousUsageSubject(request),
) {
  const dailyLimit = Number(
    process.env[`QUANTUM_USAGE_DAILY_${tier.toUpperCase()}`] ||
      DEFAULT_DAILY_LIMITS[tier],
  );
  const monthlyLimit = Number(
    process.env[`QUANTUM_USAGE_MONTHLY_${tier.toUpperCase()}`] ||
      DEFAULT_MONTHLY_LIMITS[tier],
  );
  const daily = await checkUsageBucket({
    keyPrefix: `daily:${tier}:${subject}`,
    limit: dailyLimit,
    windowMs: DAY_MS,
  });
  const monthly = await checkUsageBucket({
    keyPrefix: `monthly:${tier}:${subject}`,
    limit: monthlyLimit,
    windowMs: MONTH_MS,
  });
  const limited = daily.limited || monthly.limited;
  const retryAfterSeconds = Math.max(
    daily.retryAfterSeconds,
    monthly.retryAfterSeconds,
  );

  return {
    headers: {
      "X-Quantum-Usage-Daily-Limit": String(dailyLimit),
      "X-Quantum-Usage-Daily-Remaining": String(daily.remaining),
      "X-Quantum-Usage-Monthly-Limit": String(monthlyLimit),
      "X-Quantum-Usage-Monthly-Remaining": String(monthly.remaining),
      ...(limited ? { "Retry-After": String(retryAfterSeconds) } : {}),
    },
    limited,
    retryAfterSeconds,
    subject,
  };
}

async function checkUsageBucket(options: UsageLimitOptions) {
  const distributed = await checkDistributedUsageBucket(options);
  if (distributed) return distributed;

  const now = Date.now();
  const current = usageBuckets.get(options.keyPrefix);
  const bucket =
    current && current.resetAt > now
      ? current
      : { count: 0, resetAt: now + options.windowMs };

  bucket.count += 1;
  usageBuckets.set(options.keyPrefix, bucket);

  return {
    limited: bucket.count > options.limit,
    remaining: Math.max(0, options.limit - bucket.count),
    retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
  };
}

async function checkDistributedUsageBucket(options: UsageLimitOptions) {
  const url =
    process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!url || !token) return null;

  try {
    const response = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
      body: JSON.stringify([
        ["INCR", options.keyPrefix],
        ["PEXPIRE", options.keyPrefix, options.windowMs, "NX"],
        ["PTTL", options.keyPrefix],
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

    return {
      limited: count > options.limit,
      remaining: Math.max(0, options.limit - count),
      retryAfterSeconds: Math.max(1, Math.ceil(ttlMs / 1000)),
    };
  } catch {
    return null;
  }
}
