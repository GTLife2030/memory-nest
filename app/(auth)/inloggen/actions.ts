"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { publicEnv, supabaseConfigured } from "@/lib/env";
import { safeNextPath } from "@/lib/safe-redirect";
import { logger } from "@/lib/server/logger";
import { rateLimit } from "@/lib/server/rate-limit";
import { createClient } from "@/lib/supabase/server";

export type SignInState = { error: "invalidEmail" | "rateLimited" | "generic" | null; email: string };

const emailSchema = z.email().max(254);
const FIFTEEN_MINUTES = 15 * 60 * 1000;

export async function requestMagicLink(_previous: SignInState, formData: FormData): Promise<SignInState> {
  const raw = String(formData.get("email") ?? "").trim().toLowerCase();
  const parsed = emailSchema.safeParse(raw);
  if (!parsed.success) return { error: "invalidEmail", email: raw };
  const email = parsed.data;

  const forwarded = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`ip:${forwarded}`, 10, FIFTEEN_MINUTES) || !rateLimit(`mail:${email}`, 3, FIFTEEN_MINUTES)) {
    return { error: "rateLimited", email };
  }
  if (!supabaseConfigured) return { error: "generic", email };

  const confirm = new URL("/auth/confirm", publicEnv.NEXT_PUBLIC_SITE_URL);
  confirm.searchParams.set("next", safeNextPath(String(formData.get("next") ?? "")));

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: confirm.toString(), shouldCreateUser: true },
  });
  if (error) {
    logger.warn("auth.magic_link_failed", { status: error.status, code: error.code });
    return { error: error.status === 429 ? "rateLimited" : "generic", email };
  }

  // The same screen is shown whether or not the address already had an account.
  redirect(`/inloggen/verstuurd?e=${encodeURIComponent(email)}`);
}
