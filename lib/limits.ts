import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { redis, isConfigured } from "./reactions";

/**
 * Anyone can post without an account, so the only thing standing between the
 * comment box and a bot is this.
 */

let likeLimiter: Ratelimit | null = null;
let commentLimiter: Ratelimit | null = null;

export function likeLimit() {
  if (!likeLimiter) {
    likeLimiter = new Ratelimit({
      redis: redis(),
      limiter: Ratelimit.slidingWindow(40, "1 m"),
      prefix: "hs:rl:like",
      analytics: false,
    });
  }
  return likeLimiter;
}

export function commentLimit() {
  if (!commentLimiter) {
    commentLimiter = new Ratelimit({
      redis: redis(),
      // generous enough for a real thread, since phone carriers put
      // many readers behind one address
      limiter: Ratelimit.slidingWindow(8, "5 m"),
      prefix: "hs:rl:comment",
      analytics: false,
    });
  }
  return commentLimiter;
}

/** `request.ip` was removed in Next 15; the proxy header is what is left. */
export function callerId(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  const ip = fwd?.split(",")[0]?.trim();
  return ip && ip.length > 0 ? ip : "unknown";
}

export { isConfigured };
