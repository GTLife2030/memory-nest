/**
 * Hand-written subset of the database types for the tables phase 0 touches.
 * Replace with `supabase gen types typescript --linked > lib/supabase/types.ts` once the
 * project is linked (see docs/RUNBOOK.md); the shape below matches that output.
 */
export type MembershipRole = "owner" | "co_author" | "recipient" | "legacy_contact" | "viewer";
export type MembershipStatus = "invited" | "active" | "revoked";

type Timestamps = { created_at: string; updated_at: string };

export type FamilyRow = Timestamps & {
  id: string;
  name: string;
  plan: string;
  storage_quota_gb: number;
  storage_used_bytes: number;
  locale: string;
};

export type ProfileRow = Timestamps & {
  id: string;
  user_id: string;
  display_name: string;
  birth_year: number | null;
  elder_mode: boolean;
  phone_e164: string | null;
  preferred_channel: "app" | "email" | "whatsapp" | "phone";
  reminder_freq: "weekly" | "biweekly" | "monthly";
  reminder_time: string | null;
};

export type MembershipRow = Timestamps & {
  id: string;
  family_id: string;
  user_id: string | null;
  role: MembershipRole;
  status: MembershipStatus;
  invited_email: string | null;
};

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      families: Table<FamilyRow, never, Partial<Pick<FamilyRow, "name" | "locale">>>;
      profiles: Table<ProfileRow, Partial<ProfileRow> & { user_id: string }>;
      memberships: Table<MembershipRow>;
    };
    Views: Record<string, never>;
    Functions: {
      create_family: { Args: { p_name: string }; Returns: string };
    };
    Enums: {
      membership_role: MembershipRole;
      membership_status: MembershipStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
