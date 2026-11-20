import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publicEnv, supabaseConfigured } from "@/lib/env";
import type { Database } from "./types";

/** Supabase client bound to the visitor's session cookies. All queries run under their RLS. */
export async function createClient() {
  if (!supabaseConfigured) throw new Error("Supabase is not configured");
  const cookieStore = await cookies();
  return createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL!,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          try {
            for (const { name, value, options } of toSet) cookieStore.set(name, value, options);
          } catch {
            // Called from a Server Component, where cookies are read-only. The proxy refreshes
            // the session, so this is safe to ignore.
          }
        },
      },
    },
  );
}
