import { Ratelimit } from "@upstash/ratelimit";
import { Redis }     from "@upstash/redis";

const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Different limits for different endpoints
export const rateLimiters = {
  // General email fetching — 30 per minute
  emails: new Ratelimit({
    redis,
    limiter:   Ratelimit.slidingWindow(30, "1 m"),
    prefix:    "mailmind:emails",
  }),

  // AI triage — 20 per minute (Groq has rate limits)
  triage: new Ratelimit({
    redis,
    limiter:   Ratelimit.slidingWindow(20, "1 m"),
    prefix:    "mailmind:triage",
  }),

  // Draft generation — 10 per minute (streaming is expensive)
  draft: new Ratelimit({
    redis,
    limiter:   Ratelimit.slidingWindow(10, "1 m"),
    prefix:    "mailmind:draft",
  }),

  // Send email — 5 per minute (prevent spam)
  send: new Ratelimit({
    redis,
    limiter:   Ratelimit.slidingWindow(5, "1 m"),
    prefix:    "mailmind:send",
  }),
};

// Helper — returns 429 response if rate limited
export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<{ limited: boolean; response?: Response }> {
  const { success, limit, remaining, reset } = await limiter.limit(identifier);

  if (!success) {
    return {
      limited:  true,
      response: Response.json(
        {
          error:     "Too many requests",
          retryAfter: Math.ceil((reset - Date.now()) / 1000),
        },
        {
          status:  429,
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
}