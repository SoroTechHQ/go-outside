import { supabaseAdmin } from "../supabase";
import { adaptOrganizer, type DbOrganizerRow } from "./adapters";
import type { Organizer } from "@gooutside/demo-data";

const ORGANIZER_SELECT = `
  user_id, organization_name, status, total_events,
  users!organizer_profiles_user_id_fkey (
    id, first_name, last_name, location_city
  )
`;

// All approved organizers — deduplicated with real follower counts
export async function getOrganizers(): Promise<Organizer[]> {
  const { data, error } = await supabaseAdmin
    .from("organizer_profiles")
    .select(ORGANIZER_SELECT)
    .eq("status", "approved")
    .order("total_events", { ascending: false });

  if (error) { console.error("[getOrganizers]", error); return []; }

  // Dedup by user_id — keep first (highest total_events due to ORDER BY)
  const seen = new Set<string>();
  const unique = (data as unknown as DbOrganizerRow[]).filter((row) => {
    if (seen.has(row.user_id)) return false;
    seen.add(row.user_id);
    return true;
  });

  if (!unique.length) return [];

  // Fetch real follower counts from the follows table
  const userIds = unique.map((row) => row.user_id);
  const { data: followRows } = await supabaseAdmin
    .from("follows")
    .select("following_id")
    .in("following_id", userIds);

  const followerCounts = new Map<string, number>();
  for (const row of followRows ?? []) {
    followerCounts.set(row.following_id, (followerCounts.get(row.following_id) ?? 0) + 1);
  }

  // Fetch real published event counts
  const { data: eventRows } = await supabaseAdmin
    .from("events")
    .select("organizer_id")
    .in("organizer_id", userIds)
    .eq("status", "published");

  const eventCounts = new Map<string, number>();
  for (const row of eventRows ?? []) {
    eventCounts.set(row.organizer_id, (eventCounts.get(row.organizer_id) ?? 0) + 1);
  }

  return unique.map((row) =>
    adaptOrganizer({
      ...row,
      follower_count: followerCounts.get(row.user_id) ?? 0,
      total_events: eventCounts.get(row.user_id) ?? row.total_events ?? 0,
    }),
  );
}

// Single organizer by their user UUID
export async function getOrganizerByUserId(userId: string): Promise<Organizer | null> {
  const { data, error } = await supabaseAdmin
    .from("organizer_profiles")
    .select(ORGANIZER_SELECT)
    .eq("user_id", userId)
    .limit(1)
    .single();

  if (error || !data) return null;

  const [followRes, eventRes] = await Promise.all([
    supabaseAdmin.from("follows").select("id", { count: "exact", head: true }).eq("following_id", userId),
    supabaseAdmin.from("events").select("id", { count: "exact", head: true }).eq("organizer_id", userId).eq("status", "published"),
  ]);

  return adaptOrganizer({
    ...(data as unknown as DbOrganizerRow),
    follower_count: followRes.count ?? 0,
    total_events: eventRes.count ?? (data as unknown as DbOrganizerRow).total_events ?? 0,
  });
}
