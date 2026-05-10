import { ShellCard } from "@gooutside/ui";
import { supabaseAdmin } from "../../../lib/supabase";
import { DashboardShell } from "../../../components/dashboard-shell";
import { MetricTile, MiniPill, PageGuide } from "../../../components/dashboard-primitives";

export default async function OrganizerProfilePage() {
  // Fetch organizer with full details
  const { data: orgProfile } = await supabaseAdmin
    .from("organizer_profiles")
    .select(`
      id, organization_name, status, verified_at, bio, logo_url,
      total_events, total_revenue, paystack_subaccount,
      user_id,
      organizer:users!organizer_profiles_user_id_fkey(
        id, first_name, last_name, email, location_city, is_active, is_verified_organizer
      )
    `)
    .eq("status", "active")
    .not("verified_at", "is", null)
    .order("total_revenue", { ascending: false })
    .limit(1)
    .single();

  const userId = orgProfile?.user_id ?? null;
  const orgUser = orgProfile?.organizer as {
    first_name?: string;
    last_name?: string;
    email?: string;
    location_city?: string;
    is_active?: boolean;
    is_verified_organizer?: boolean;
  } | null;

  // Follower count (users following this organizer)
  const { count: followerCount } = userId
    ? await supabaseAdmin
        .from("follows")
        .select("id", { count: "exact", head: true })
        .eq("following_id", userId)
    : { count: 0 };

  // Average rating from tickets/reviews
  // (Using events count and ticket sold as proxy since reviews table may not exist)
  const { data: events } = userId
    ? await supabaseAdmin
        .from("events")
        .select("id, tickets_sold, total_capacity")
        .eq("organizer_id", userId)
        .eq("status", "published")
        .limit(50)
    : { data: [] };

  const allEvents = events ?? [];
  const totalTickets = allEvents.reduce((s, e) => s + (e.tickets_sold ?? 0), 0);
  const totalCapacity = allEvents.reduce((s, e) => s + (e.total_capacity ?? 0), 0);
  const fillRate = totalCapacity > 0 ? Math.round((totalTickets / totalCapacity) * 100) : 0;

  const orgName = orgProfile?.organization_name ?? "Your Organisation";
  const bio = (orgProfile as { bio?: string } | null)?.bio ?? "No bio added yet.";
  const city = orgUser?.location_city ?? "Ghana";
  const ownerName = orgUser ? `${orgUser.first_name ?? ""} ${orgUser.last_name ?? ""}`.trim() : "";
  const email = orgUser?.email ?? "";
  const isVerified = !!orgProfile?.verified_at;
  const hasPaystack = !!(orgProfile as { paystack_subaccount?: string } | null)?.paystack_subaccount;
  const totalRevenue = Number(orgProfile?.total_revenue ?? 0);

  const verificationChecks = [
    { label: "Account verified by GoOutside", ok: isVerified },
    { label: "Payout account connected (Paystack)", ok: hasPaystack },
    { label: "Organizer profile active", ok: orgProfile?.status === "active" },
    { label: "User account active", ok: orgUser?.is_active === true },
  ];

  return (
    <DashboardShell mode="organizer" subtitle="Public brand presence and trust signals" title="Profile">
      <div className="space-y-6">
        <PageGuide
          title="Manage your public profile and brand presence"
          tips={[
            "Your follower count and event fill rate are visible to users browsing GoOutside.",
            "A complete bio helps attendees understand what kind of events you run — keep it up to date.",
            "All verification checks must be green before you can receive payouts from ticket sales.",
          ]}
        />

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <MetricTile
            accent="brand"
            label="Followers"
            meta="Users following your organizer page"
            trend="All time"
            value={(followerCount ?? 0).toLocaleString()}
          />
          <MetricTile
            accent="cyan"
            label="Published events"
            meta="Events visible in the app"
            trend="Live"
            value={String(allEvents.length)}
          />
          <MetricTile
            accent="violet"
            label="Avg fill rate"
            meta="Tickets sold vs capacity"
            trend={`${fillRate}%`}
            value={`${fillRate}%`}
          />
          <MetricTile
            accent="amber"
            label="Total revenue"
            meta="All-time from ticket sales"
            trend="All time"
            value={`₵${totalRevenue.toLocaleString("en-GH", { minimumFractionDigits: 0 })}`}
          />
        </div>

        <ShellCard className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
          <div className="rounded-[24px] bg-[linear-gradient(135deg,rgba(56,189,248,0.2),rgba(61,220,151,0.08),transparent)] p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--accent-cyan)]">Brand card</p>
            <h2 className="mt-4 font-display text-3xl font-semibold text-[var(--text-primary)]">{orgName}</h2>
            {ownerName && (
              <p className="mt-1 text-sm text-[var(--text-tertiary)]">{ownerName} · {city}</p>
            )}
            {email && (
              <p className="mt-1 text-xs text-[var(--text-tertiary)]">{email}</p>
            )}
            <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">
              {bio}
            </p>
            <div className="mt-4">
              {isVerified && <MiniPill tone="brand">Verified</MiniPill>}
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
              Verification status
            </p>
            {verificationChecks.map((check) => (
              <div
                key={check.label}
                className="flex items-center gap-3 rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-4 text-sm"
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    check.ok
                      ? "bg-[var(--status-live-bg)] text-[var(--status-live-text)]"
                      : "bg-[rgba(251,113,133,0.1)] text-[var(--accent-coral)]"
                  }`}
                >
                  {check.ok ? "✓" : "✗"}
                </span>
                <span className={check.ok ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}>
                  {check.label}
                </span>
              </div>
            ))}
          </div>
        </ShellCard>
      </div>
    </DashboardShell>
  );
}
