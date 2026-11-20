type CspInput = { nonce: string; supabaseUrl?: string; dev: boolean };

/**
 * Content-Security-Policy. Scripts need the per-request nonce. Styles allow inline because the
 * dialog and toast primitives set inline styles; no user-written HTML is ever rendered.
 */
export function buildCsp({ nonce, supabaseUrl, dev }: CspInput): string {
  const supabase = supabaseUrl ? new URL(supabaseUrl).origin : "";
  const supabaseWs = supabase.replace(/^http/, "ws");
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'", ...(dev ? ["'unsafe-eval'"] : [])],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "blob:", "data:", supabase],
    "media-src": ["'self'", "blob:", supabase],
    "font-src": ["'self'"],
    "connect-src": ["'self'", supabase, supabaseWs, ...(dev ? ["ws:"] : [])],
    "worker-src": ["'self'"],
    "manifest-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    ...(dev ? {} : { "upgrade-insecure-requests": [] }),
  };
  return Object.entries(directives)
    .map(([name, values]) => [name, ...values.filter(Boolean)].join(" "))
    .join("; ");
}
