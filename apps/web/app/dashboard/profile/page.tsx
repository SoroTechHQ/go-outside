import { notFound } from "next/navigation";
import { getOrCreateSupabaseUser } from "../../../lib/db/users";
import { getUserTickets } from "../../../lib/db/tickets";
import { supabaseAdmin } from "../../../lib/supabase";
import { ProfileClient } from "./ProfileClient";
import type { UserProfile } from "./types";
import { PULSE_TIERS } from "./types";
import type { AttendeeTicket, EventItem } from "@gooutside/demo-data";
import { adaptEvent, type DbEventRow } from "../../../lib/db/adapters";

const EVENT_SELECT = `
  id, slug, title, description, short_description,
  banner_url, gallery_urls, start_datetime, end_datetime,
  total_capacity, tickets_sold, status, is_featured,
  avg_rating, reviews_count, saves_count, tags,
  organizer_id, is_online, custom_location,
  categories (id, name, slug, icon_key, color, is_active, sort_order),
  venues (id, name, city, address),
  ticket_types (id, name, price, price_type, quantity_total, quantity_sold, is_active)
`;

function resolvePulseTier(tier: string): UserProfile["pulseTier"] {
  const tierName = tier
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const found = PULSE_TIERS.find((t) => t.name.toLowerCase() === tier.toLowerCase());
  return (found?.name ?? "Newcomer") as UserProfile["pulseTier"];
}

export default async function ProfilePage() {
  const user = await getOrCreateSupabaseUser();
  if (!user) notFound();

  // Parallel: tickets + follower/following counts
  const [tickets, followerRes, followingRes] = await Promise.all([
    getUserTickets(user.id),

    supabaseAdmin
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("following_id", user.id),

    supabaseAdmin
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("follower_id", user.id),
  ]);

  const pastTickets  = tickets.filter((t) => t.status === "past" || t.status === "used");
  const activeCount  = tickets.filter((t) => t.status === "active").length;

  // Fetch the actual event records for past tickets
  const slugs     = pastTickets.map((t) => t.eventSlug).filter(Boolean);
  const pastEvents: EventItem[] = [];
  if (slugs.length > 0) {
    const { data: evRows } = await supabaseAdmin
      .from("events")
      .select(EVENT_SELECT)
      .in("slug", slugs);
    if (evRows) {
      for (const row of evRows as unknown as DbEventRow[]) {
        pastEvents.push(adaptEvent(row));
      }
    }
  }

  const joinedDate = new Date(
    (user as unknown as { created_at?: string }).created_at ?? Date.now()
  );
  const joinedAt = joinedDate.toLocaleDateString("en-US", {
    month: "long",
    year:  "numeric",
  });

  const profile: UserProfile = {
    id:               user.id,
    name:             `${user.first_name} ${user.last_name}`.trim(),
    handle:           (user as unknown as { username?: string }).username
                        ?? user.first_name.toLowerCase().replace(/\s/g, "."),
    bio:              (user as unknown as { bio?: string }).bio ?? "",
    location:         user.location_city ?? "Accra",
    avatarUrl:        user.avatar_url,
    coverUrl:         null,
    joinedAt,
    pulseScore:       user.pulse_score ?? 0,
    pulseTier:        resolvePulseTier(user.pulse_tier ?? "newcomer"),
    neighbourhoodRank: 0,
    cityRankPercent:   0,
    eventsAttended:   pastTickets.length,
    friendCount:      followerRes.count ?? 0,
    followingCount:   followingRes.count ?? 0,
    snippetCount:     0,
    topCategories:    (user.interests ?? [])
                        .slice(0, 3)
                        .map((s) => s.charAt(0).toUpperCase() + s.slice(1)),
    importedTweetIds: [],
    isOwnProfile:     true,
  };

  return (
    <main className="page-grid min-h-screen bg-[var(--bg-base)] pb-32 text-[var(--text-primary)]">
      <ProfileClient
        profile={profile}
        pastTickets={pastTickets as AttendeeTicket[]}
        pastEvents={pastEvents}
      />
    </main>
  );
}
