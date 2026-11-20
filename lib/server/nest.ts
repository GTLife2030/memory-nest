import "server-only";
import { supabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { MembershipRole } from "@/lib/supabase/types";
import { demoFamily } from "@/lib/demo/de-wit";

export type NestView = {
  familyId: string;
  familyName: string;
  role: MembershipRole;
  displayName: string;
  demo: boolean;
};

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

// Shown first when a person holds several roles in one family.
const rolePriority: MembershipRole[] = [
  "owner",
  "co_author",
  "viewer",
  "legacy_contact",
  "recipient",
];

/**
 * Loads one nest for the signed-in visitor. Returns null when it does not exist or the visitor is
 * not a member; the two cases are deliberately indistinguishable. Access is decided by RLS, not here.
 */
export async function getNest(familyId: string): Promise<NestView | null> {
  if (!supabaseConfigured) {
    if (familyId !== demoFamily.id) return null;
    return {
      familyId: demoFamily.id,
      familyName: demoFamily.name,
      role: "owner",
      displayName: demoFamily.viewerName,
      demo: true,
    };
  }
  if (!isUuid(familyId)) return null;

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const [family, memberships, profile] = await Promise.all([
    supabase.from("families").select("id, name").eq("id", familyId).maybeSingle(),
    supabase
      .from("memberships")
      .select("role")
      .eq("family_id", familyId)
      .eq("user_id", auth.user.id)
      .eq("status", "active"),
    supabase.from("profiles").select("display_name").eq("user_id", auth.user.id).maybeSingle(),
  ]);
  const roles = (memberships.data ?? []).map((row) => row.role);
  const role = rolePriority.find((candidate) => roles.includes(candidate));
  if (!family.data || !role) return null;

  return {
    familyId: family.data.id,
    familyName: family.data.name,
    role,
    displayName: profile.data?.display_name ?? "",
    demo: false,
  };
}

/** The family a signed-in visitor lands in; creates their first nest when they have none. */
export async function resolveHomeNest(defaultName: string): Promise<string | null> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const { data: memberships, error } = await supabase
    .from("memberships")
    .select("family_id, role, created_at")
    .eq("user_id", auth.user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Could not load memberships: ${error.message}`);

  const first = memberships?.[0];
  if (first) return first.family_id;

  const { data: familyId, error: createError } = await supabase.rpc("create_family", {
    p_name: defaultName,
  });
  if (createError || !familyId)
    throw new Error(`Could not create the first nest: ${createError?.message}`);
  return familyId;
}
