import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../lib/supabase";

export async function POST() {
  const { userId, sessionClaims } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (sessionClaims?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Seeded users have no real Clerk ID — real users always arrive via the Clerk webhook
  const { data: seededUsers, error: usersErr } = await supabaseAdmin
    .from("users")
    .select("id")
    .is("clerk_id", null);

  if (usersErr) {
    return NextResponse.json({ error: usersErr.message }, { status: 500 });
  }

  const seededIds = (seededUsers ?? []).map((u) => u.id);

  if (seededIds.length === 0) {
    return NextResponse.json({ ok: true, deleted: { events: 0, organizers: 0, users: 0 } });
  }

  // Pull seeded event IDs first so we can clean related tables
  const { data: seededEvents } = await supabaseAdmin
    .from("events")
    .select("id")
    .in("organizer_id", seededIds);

  const seededEventIds = (seededEvents ?? []).map((e) => e.id);

  // Delete in dependency order to avoid FK violations
  const steps: Array<{ table: string; column: string; ids: string[] }> = [
    { table: "snippets",         column: "event_id",   ids: seededEventIds },
    { table: "pulse_points_ledger", column: "event_id", ids: seededEventIds },
    { table: "tickets",          column: "event_id",   ids: seededEventIds },
    { table: "ticket_types",     column: "event_id",   ids: seededEventIds },
    { table: "post_likes",       column: "user_id",    ids: seededIds },
    { table: "posts",            column: "user_id",    ids: seededIds },
    { table: "follows",          column: "follower_id", ids: seededIds },
    { table: "follows",          column: "following_id", ids: seededIds },
    { table: "graph_edges",      column: "source_user_id", ids: seededIds },
    { table: "graph_edges",      column: "target_user_id", ids: seededIds },
    { table: "onboarding_past_events", column: "user_id", ids: seededIds },
    { table: "cart_items",       column: "user_id",    ids: seededIds },
  ];

  for (const { table, column, ids } of steps) {
    if (ids.length === 0) continue;
    const { error } = await supabaseAdmin.from(table as "snippets").delete().in(column, ids);
    // Ignore "relation does not exist" errors — not all tables exist in all DB states
    if (error && !error.message.includes("does not exist")) {
      console.error(`[purge-seed-data] failed deleting ${table}.${column}:`, error.message);
    }
  }

  // Delete events owned by seeded users
  const { count: deletedEvents } = await supabaseAdmin
    .from("events")
    .delete({ count: "exact" })
    .in("organizer_id", seededIds);

  // Delete organizer rows for seeded users (organizer_id = user.id)
  const { count: deletedOrganizers } = await supabaseAdmin
    .from("organizers")
    .delete({ count: "exact" })
    .in("user_id", seededIds);

  // Finally delete the seeded user accounts
  const { count: deletedUsers } = await supabaseAdmin
    .from("users")
    .delete({ count: "exact" })
    .is("clerk_id", null);

  return NextResponse.json({
    ok: true,
    deleted: {
      events: deletedEvents ?? 0,
      organizers: deletedOrganizers ?? 0,
      users: deletedUsers ?? 0,
    },
  });
}
