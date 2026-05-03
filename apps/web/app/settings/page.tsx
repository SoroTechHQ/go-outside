import { notFound } from "next/navigation";
import { getOrCreateSupabaseUser } from "../../lib/db/users";
import { supabaseAdmin } from "../../lib/supabase";
import { SettingsClient } from "../dashboard/settings/SettingsClient";

export const metadata = { title: "Settings — GoOutside" };

export default async function SettingsPage() {
  const user = await getOrCreateSupabaseUser();
  if (!user) notFound();

  const [fullRes, opRes] = await Promise.all([
    supabaseAdmin
      .from("users")
      .select("account_type, is_verified_organizer, notification_prefs, email")
      .eq("id", user.id)
      .maybeSingle(),

    supabaseAdmin
      .from("organizer_profiles")
      .select("organization_name")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const full = fullRes.data;

  const isOrganizer =
    full?.is_verified_organizer === true ||
    full?.account_type === "organizer" ||
    user.role === "organizer" ||
    user.role === "admin";

  const orgName = opRes.data?.organization_name ?? null;

  const rawPrefs = (full?.notification_prefs ?? {}) as Record<string, unknown>;
  const notifPrefs = {
    email:  rawPrefs.email  !== false,
    push:   rawPrefs.push   !== false,
    in_app: rawPrefs.in_app !== false,
  };

  const maskedEmail = (() => {
    const addr = (full?.email ?? user.email ?? "") as string;
    const [local, domain] = addr.split("@");
    if (!local || !domain) return addr;
    const visible = local.slice(0, 2);
    return `${visible}${"•".repeat(Math.max(2, local.length - 2))}@${domain}`;
  })();

  return (
    <main className="page-grid min-h-screen bg-[var(--bg-base)] pb-32 text-[var(--text-primary)]">
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
        maskedEmail={maskedEmail}
      />
    </main>
  );
}
