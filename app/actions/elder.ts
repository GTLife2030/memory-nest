"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { ELDER_COOKIE } from "@/lib/elder";
import { supabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/** Turns large-type mode on or off: always in the cookie, and on the profile when signed in. */
export async function setElderMode(formData: FormData) {
  const enabled = formData.get("enabled") === "1";
  (await cookies()).set(ELDER_COOKIE, enabled ? "1" : "0", {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
  if (supabaseConfigured) {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (auth.user) {
      await supabase.from("profiles").update({ elder_mode: enabled }).eq("user_id", auth.user.id);
    }
  }
  revalidatePath("/", "layout");
}
