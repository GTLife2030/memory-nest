"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { isPersonaId, PERSONA_COOKIE } from "@/lib/voorbeeld/persona";

/** Mock-up only: remembers through whose eyes the visitor is looking. Not an identity. */
export async function setPersona(formData: FormData) {
  const persona = formData.get("persona");
  if (!isPersonaId(persona)) return;
  (await cookies()).set(PERSONA_COOKIE, persona, {
    path: "/voorbeeld",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });
  revalidatePath("/voorbeeld", "layout");
}
