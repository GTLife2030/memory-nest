import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";
import { serverEnv } from "@/lib/server/env";
import type { Database } from "./types";

/**
 * Service-role client: bypasses RLS. Only for server jobs (capsule release, AI pipeline, exports).
 * Never import this from a component; ESLint blocks it and `server-only` fails the build.
 */
export function createAdminClient() {
  const key = serverEnv.SUPABASE_SERVICE_ROLE_KEY;
  if (!publicEnv.NEXT_PUBLIC_SUPABASE_URL || !key) {
    throw new Error("Supabase service role is not configured");
  }
  return createClient<Database>(publicEnv.NEXT_PUBLIC_SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
