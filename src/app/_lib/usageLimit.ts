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

export function resolveUsageSubject(request: Request) {
  const userId = request.headers.get("x-quantum-user-id")?.trim();
  if (userId) return `user:${userId}`;

  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0];
  const realIp = request.headers.get("x-real-ip");
  return `anonymous:${(forwardedFor || realIp || "unknown").trim()}`;
}

export function checkQuantumUsageLimit(request: Request, tier: UsageTier) {
  const subject = resolveUsageSubject(request);
  const dailyLimit = Number(
    process.env[`QUANTUM_USAGE_DAILY_${tier.toUpperCase()}`] ||
      DEFAULT_DAILY_LIMITS[tier],
  );
  const monthlyLimit = Number(
    process.env[`QUANTUM_USAGE_MONTHLY_${tier.toUpperCase()}`] ||
      DEFAULT_MONTHLY_LIMITS[tier],
  );
  const daily = checkUsageBucket({
    keyPrefix: `daily:${tier}:${subject}`,
    limit: dailyLimit,
    windowMs: DAY_MS,
  });
  const monthly = checkUsageBucket({
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

function checkUsageBucket(options: UsageLimitOptions) {
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
