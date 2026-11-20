import "server-only";

/**
 * Server-only secrets. Importing this file from a client component fails the build
 * (via `server-only`), which is how "no secrets client-side" is enforced.
 */
const read = (name: string): string | undefined => {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
};

export const serverEnv = {
  get SUPABASE_SERVICE_ROLE_KEY() {
    return read("SUPABASE_SERVICE_ROLE_KEY");
  },
  get SENTRY_DSN() {
    return read("SENTRY_DSN");
  },
  /** Reads any server variable by name; used by the adapter registry. */
  get: read,
};
