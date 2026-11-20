import { createBrowserClient } from "@supabase/ssr";
import { publicEnv, supabaseConfigured } from "@/lib/env";
import type { Database } from "./types";

export function createClient() {
  if (!supabaseConfigured) throw new Error("Supabase is not configured");
  return createBrowserClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL!,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
