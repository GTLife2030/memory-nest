import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { ELDER_COOKIE } from "@/lib/elder";
import { supabaseConfigured } from "@/lib/env";
import { safeNextPath } from "@/lib/safe-redirect";
import { logger } from "@/lib/server/logger";
import { createClient } from "@/lib/supabase/server";

const otpTypes: EmailOtpType[] = [
  "magiclink",
  "email",
  "signup",
  "invite",
  "recovery",
  "email_change",
];

/**
 * Landing point of the magic link. Supports both link styles:
 *  - token_hash + type (recommended e-mail template; works when the mail is opened on another device)
 *  - code (PKCE; only works in the browser that requested the link)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const next = safeNextPath(searchParams.get("next"));
  const failed = new URL("/inloggen?fout=link", request.url);
  if (!supabaseConfigured) return NextResponse.redirect(failed);

  const supabase = await createClient();
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");

  // Only the provider's error code is logged: free-text messages can carry an e-mail address.
  let failure: string | undefined;
  if (tokenHash && type && otpTypes.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    failure = error ? (error.code ?? "verify_failed") : undefined;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    failure = error ? (error.code ?? "exchange_failed") : undefined;
  } else {
    failure = "missing_parameters";
  }
  if (failure) {
    logger.warn("auth.confirm_failed", { reason: failure });
    return NextResponse.redirect(failed);
  }

  const response = NextResponse.redirect(new URL(next, request.url));
  const { data: auth } = await supabase.auth.getUser();
  if (auth.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("elder_mode")
      .eq("user_id", auth.user.id)
      .maybeSingle();
    response.cookies.set(ELDER_COOKIE, profile?.elder_mode ? "1" : "0", {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return response;
}
