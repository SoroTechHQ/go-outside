import { notFound } from "next/navigation";
import { clerkClient } from "@clerk/nextjs/server";
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
    messages_email: rawPrefs.messages_email !== false && rawPrefs.email !== false,
    messages_push: rawPrefs.messages_push !== false && rawPrefs.push !== false,
    messages_in_app: rawPrefs.messages_in_app !== false && rawPrefs.in_app !== false,
    messages_email_delay_mins:
      typeof rawPrefs.messages_email_delay_mins === "number"
        ? rawPrefs.messages_email_delay_mins
        : 60,
  };

  const maskedEmail = (() => {
    const addr = (full?.email ?? user.email ?? "") as string;
    const [local, domain] = addr.split("@");
    if (!local || !domain) return addr;
    const visible = local.slice(0, 2);
    return `${visible}${"•".repeat(Math.max(2, local.length - 2))}@${domain}`;
  })();

  const clerky = await clerkClient();
  const sessionsList = await clerky.sessions
    .getSessionList({ userId: user.clerk_id, status: "active" })
    .catch(() => ({ data: [] }));
  const activeSessions = (sessionsList.data ?? []).map((s) => ({
    id: s.id,
    lastActiveAt: s.lastActiveAt,
    createdAt: s.createdAt,
    latestActivity: s.latestActivity
      ? (() => {
          const a = s.latestActivity as unknown as Record<string, unknown>;
          return {
            deviceType:  (a.deviceType  as string  | null) ?? null,
            browserName: (a.browserName as string  | null) ?? null,
            country:     (a.country     as string  | null) ?? null,
            city:        (a.city        as string  | null) ?? null,
            ipAddress:   (a.ipAddress   as string  | null) ?? null,
            isMobile:    (a.isMobile    as boolean | null) ?? null,
          };
        })()
      : null,
  }));

  return (
    <main className="page-grid go-stream-page bg-[var(--bg-base)] text-[var(--text-primary)]">
      <SettingsClient
        isOrganizer={isOrganizer}
        orgName={orgName}
        notifPrefs={notifPrefs}
        maskedEmail={maskedEmail}
        activeSessions={activeSessions}
      />
    </main>
  );
}
