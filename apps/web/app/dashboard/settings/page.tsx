import { notFound } from "next/navigation";
import { getOrCreateSupabaseUser } from "../../../lib/db/users";
import { supabaseAdmin } from "../../../lib/supabase";
import { SettingsClient } from "./SettingsClient";

export const metadata = { title: "Settings — GoOutside" };

export default async function SettingsPage() {
  const user = await getOrCreateSupabaseUser();
  if (!user) notFound();

  const { data: full } = await supabaseAdmin
    .from("users")
    .select("account_type, is_verified_organizer, notification_prefs")
    .eq("id", user.id)
    .maybeSingle();

  const isOrganizer =
    full?.is_verified_organizer === true ||
    full?.account_type === "organizer" ||
    user.role === "organizer" ||
    user.role === "admin";

  // Fetch organizer profile name if applicable
  let orgName: string | null = null;
  if (isOrganizer) {
    const { data: op } = await supabaseAdmin
      .from("organizer_profiles")
      .select("organization_name")
      .eq("user_id", user.id)
      .maybeSingle();
    orgName = op?.organization_name ?? null;
  }

  const rawPrefs = (full?.notification_prefs ?? {}) as Record<string, unknown>;
  const notifPrefs = {
    email:  rawPrefs.email  !== false,
    push:   rawPrefs.push   !== false,
    in_app: rawPrefs.in_app !== false,
  };

  return (
    <main className="page-grid min-h-screen bg-[var(--bg-base)] pb-32 text-[var(--text-primary)]">
      {/* Header */}
      <div className="border-b border-[var(--border-subtle)] px-4 py-5 md:px-6">
        <h1 className="font-display text-[22px] font-bold italic text-[var(--text-primary)]">
          Settings
        </h1>
        <p className="mt-0.5 text-[12px] text-[var(--text-tertiary)]">
          Manage your account and preferences
        </p>
      </div>

      <SettingsClient
        isOrganizer={isOrganizer}
        orgName={orgName}
        notifPrefs={notifPrefs}
      />
    </main>
  );
}
