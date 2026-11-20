import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { supabaseConfigured } from "@/lib/env";
import { resolveHomeNest } from "@/lib/server/nest";

/** Sends the visitor to their nest, creating the first one when they have none yet. */
export default async function NestIndexPage() {
  if (!supabaseConfigured) redirect("/nest/demo");
  const t = await getTranslations("nest");
  const familyId = await resolveHomeNest(t("defaultFamilyName"));
  redirect(familyId ? `/nest/${familyId}` : "/inloggen");
}
