import "server-only";

type Window = { count: number; resetAt: number };
const windows = new Map<string, Window>();

/**
 * Fixed-window limiter kept in process memory. It slows down abuse of the sign-in form on a
 * single instance; it is not a distributed limiter. Supabase Auth applies its own e-mail rate
 * limits behind it, and bot protection (Turnstile) is planned before public launch.
 */
export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  const current = windows.get(key);
  if (!current || current.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    if (windows.size > 10_000) {
      for (const [k, w] of windows) if (w.resetAt <= now) windows.delete(k);
    }
    return true;
  }
  current.count += 1;
  return current.count <= limit;
}

export function resetRateLimits() {
  windows.clear();
}
