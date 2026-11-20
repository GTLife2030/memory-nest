import "server-only";

type Window = { count: number; resetAt: number };
const windows = new Map<string, Window>();
const MAX_KEYS = 10_000;

/**
 * Fixed-window limiter kept in process memory. It slows down abuse of the sign-in form on a
 * single instance; it is not a distributed limiter. Supabase Auth applies its own e-mail rate
 * limits behind it, and bot protection (Turnstile) is planned before public launch.
 */
export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  const current = windows.get(key);
  if (!current || current.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    if (windows.size > MAX_KEYS) {
      for (const [k, w] of windows) if (w.resetAt <= now) windows.delete(k);
      // Still full of live keys: someone is inventing them. Drop the oldest rather than grow.
      for (const k of windows.keys()) {
        if (windows.size <= MAX_KEYS) break;
        windows.delete(k);
      }
    }
    return true;
  }
  current.count += 1;
  return current.count <= limit;
}

export function resetRateLimits() {
  windows.clear();
}

export function rateLimitSize() {
  return windows.size;
}
