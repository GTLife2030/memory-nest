import { z } from "zod";

// Public configuration: safe for the browser. Each variable is referenced literally so the
// bundler can inline it.
const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20).optional(),
  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
});

const blankToUndefined = (value: string | undefined) => (value?.trim() ? value.trim() : undefined);

export const publicEnv = publicSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: blankToUndefined(process.env.NEXT_PUBLIC_SUPABASE_URL),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: blankToUndefined(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  NEXT_PUBLIC_SITE_URL: blankToUndefined(process.env.NEXT_PUBLIC_SITE_URL),
  NEXT_PUBLIC_POSTHOG_KEY: blankToUndefined(process.env.NEXT_PUBLIC_POSTHOG_KEY),
});

/** False when the one required service is missing; the app then only offers the read-only demo nest. */
export const supabaseConfigured = Boolean(
  publicEnv.NEXT_PUBLIC_SUPABASE_URL && publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
