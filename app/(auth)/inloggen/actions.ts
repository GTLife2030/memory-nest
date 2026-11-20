"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ELDER_COOKIE } from "@/lib/elder";
import { supabaseConfigured } from "@/lib/env";
import { safeNextPath } from "@/lib/safe-redirect";
import { logger } from "@/lib/server/logger";
import { rateLimit } from "@/lib/server/rate-limit";
import { createClient } from "@/lib/supabase/server";

export type SignInState = {
  error: "invalidEmail" | "missingPassword" | "wrongCredentials" | "rateLimited" | "generic" | null;
  email: string;
};

const emailSchema = z.email().max(254);
const FIFTEEN_MINUTES = 15 * 60 * 1000;

/**
 * Sign in with e-mail address and password (ADR-010, interim). Accounts are created by the
 * founder in the Supabase dashboard; there is no public sign-up and no password reset by mail.
 */
export async function signIn(_previous: SignInState, formData: FormData): Promise<SignInState> {
  const raw = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const parsed = emailSchema.safeParse(raw);
  if (!parsed.success) return { error: "invalidEmail", email: raw };
  const email = parsed.data;
  if (!password) return { error: "missingPassword", email };

  // Slows down password guessing: per address and per client.
  const forwarded = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (
    !rateLimit(`ip:${forwarded}`, 20, FIFTEEN_MINUTES) ||
    !rateLimit(`login:${email}`, 5, FIFTEEN_MINUTES)
  ) {
    return { error: "rateLimited", email };
  }
  if (!supabaseConfigured) return { error: "generic", email };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    logger.warn("auth.sign_in_failed", { status: error?.status, code: error?.code });
    if (error?.status === 429) return { error: "rateLimited", email };
    // One message for "unknown address" and "wrong password": never reveal which accounts exist.
    return { error: error?.status === 400 ? "wrongCredentials" : "generic", email };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("elder_mode")
    .eq("user_id", data.user.id)
    .maybeSingle();
  (await cookies()).set(ELDER_COOKIE, profile?.elder_mode ? "1" : "0", {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  redirect(safeNextPath(String(formData.get("next") ?? "")));
}
