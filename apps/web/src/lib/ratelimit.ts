import { Ratelimit } from "@upstash/ratelimit";
import { Redis }     from "@upstash/redis";

const hasRedisConfig =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = hasRedisConfig
  ? new Redis({
      url:   process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

function makeLimiter(requests: number, window: string) {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window as any),
    prefix:  "mailmind",
  });
}

// Different limits for different endpoints
export const rateLimiters = {
  // General email fetching — 30 per minute
  emails: makeLimiter(30, "1 m"),

  // AI triage — 20 per minute (Groq has rate limits)
  triage: makeLimiter(20, "1 m"),

  // Draft generation — 10 per minute (streaming is expensive)
  draft: makeLimiter(10, "1 m"),

  // Send email — 5 per minute (prevent spam)
  send: makeLimiter(5, "1 m"),
};

// Helper — returns 429 response if rate limited
// Fails open (allows the request) if Redis is unreachable or not configured,
// so a Redis outage never takes down the whole app
export async function checkRateLimit(
  limiter:    Ratelimit | null,
  identifier: string,
  request?:   Request
): Promise<{ limited: boolean; response?: Response }> {
  if (!limiter) return { limited: false };

  try {
    const ip  = request?.headers.get("x-forwarded-for") ?? "unknown";
    const key = `${identifier}:${ip}`;

    const { success, limit, remaining, reset } = await limiter.limit(key);

    if (!success) {
      return {
        limited: true,
        response: Response.json(
          {
            error:      "Too many requests",
            retryAfter: Math.ceil((reset - Date.now()) / 1000),
          },
          {
            status: 429,
            headers: {
              "X-RateLimit-Limit":     limit.toString(),
              "X-RateLimit-Remaining": remaining.toString(),
              "X-RateLimit-Reset":     reset.toString(),
              "Retry-After":           Math.ceil((reset - Date.now()) / 1000).toString(),
            },
          }
        ),
      };
    }

    return { limited: false };
  } catch (err) {
    console.error("Rate limit check failed, allowing request:", err);
    return { limited: false };
  }
}