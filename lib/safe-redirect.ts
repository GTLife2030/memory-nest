/** Only same-site paths are accepted as a post-login destination; anything else becomes /nest. */
export function safeNextPath(next: string | null | undefined, fallback = "/nest"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  try {
    const url = new URL(next, "http://local.invalid");
    if (url.origin !== "http://local.invalid") return fallback;
    return url.pathname + url.search;
  } catch {
    return fallback;
  }
}
