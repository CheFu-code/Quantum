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

export function checkRateLimit(request: Request, options: RateLimitOptions) {
  const now = Date.now();
  const key = `${options.keyPrefix}:${getClientKey(request)}`;
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
