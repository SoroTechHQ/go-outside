import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  ORGANIZER_USERS, ORG_PROFILES, ATTENDEE_USERS,
  VENUES, EVENTS,
  ALL_USER_IDS, ORG_USER_IDS, ATT_USER_IDS, VENUE_IDS, EVENT_IDS, TICKET_IDS,
  nextM, nextF, resetAvatarCounters,
} from "@/lib/seed/ghana-data";

const SEED_PASSWORD = process.env.SEED_PASSWORD ?? "gooutside2026";

function checkAuth(req: NextRequest): boolean {
  const pw =
    req.headers.get("x-seed-password") ??
    req.nextUrl.searchParams.get("pw");
  return pw === SEED_PASSWORD;
}

// ── GET /api/seed — status ────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = async (table: string, col: string, ids: string[]) => {
    const { count: n } = await supabaseAdmin
      .from(table)
      .select("*", { count: "exact", head: true })
      .in(col, ids);
    return n ?? 0;
  };

  const [users, orgProfiles, venues, events, ticketTypes, follows, graphEdges] =
    await Promise.all([
      count("users",              "id",          ALL_USER_IDS),
      count("organizer_profiles", "user_id",     ORG_USER_IDS),
      count("venues",             "id",          VENUE_IDS),
      count("events",             "id",          EVENT_IDS),
      count("ticket_types",       "id",          TICKET_IDS),
      count("follows",            "follower_id", ATT_USER_IDS),
      count("graph_edges",        "from_id",     EVENT_IDS),
    ]);

  const seeded = users > 0;

  return NextResponse.json({
    seeded,
    counts: { users, orgProfiles, venues, events, ticketTypes, follows, graphEdges },
  });
}

// ── POST /api/seed — seed | teardown ─────────────────────────────────────────
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action } = (await req.json()) as { action: "seed" | "teardown" };

  if (action === "seed") {
    const errors: string[] = [];

    // Fetch category IDs
    const { data: cats } = await supabaseAdmin
      .from("categories")
      .select("id,slug")
      .eq("is_active", true);
    const catMap = Object.fromEntries((cats ?? []).map((c) => [c.slug, c.id]));

    // Reset avatar counters so images are consistent across runs
    resetAvatarCounters();

    // 1. Organizer users
    const orgUserRows = ORGANIZER_USERS.map((u) => ({
      id: u.id,
      clerk_id: `seed_clerk_org_${String(ORGANIZER_USERS.indexOf(u) + 1).padStart(3, "0")}`,
      email: `seed.org.${u.username.replace(/\./g, "")}@gooutside.test`,
      first_name: u.first,
      last_name: u.last,
      role: "organizer",
      account_type: "organizer",
      is_verified_organizer: true,
      location_city: u.city,
      interests: u.interests,
      pulse_score: u.pulse,
      pulse_tier: u.tier,
      pulse_points_balance: 0,
      pulse_points_lifetime: 0,
      onboarding_complete: true,
      avatar_url: u.g === "m" ? nextM() : nextF(),
      bio: u.bio,
      username: u.username,
      organizer_social_links: { instagram: ORG_PROFILES.find((p) => p.user_id === u.id)?.instagram },
      is_active: true,
    }));
    const { error: e1 } = await supabaseAdmin.from("users").upsert(orgUserRows, { onConflict: "id" });
    if (e1) errors.push(`users(organizers): ${e1.message}`);

    // 2. Organizer profiles
    const orgProfileRows = ORG_PROFILES.map((p) => ({
      user_id: p.user_id,
      organization_name: p.name,
      bio: p.bio,
      website_url: p.website,
      social_links: { instagram: p.instagram },
      status: "approved",
      verified_at: new Date().toISOString(),
      total_events: 0,
      total_revenue: 0,
    }));
    const { error: e2 } = await supabaseAdmin
      .from("organizer_profiles")
      .upsert(orgProfileRows, { onConflict: "user_id" });
    if (e2) errors.push(`organizer_profiles: ${e2.message}`);

    // 3. Attendee users
    const attendeeRows = ATTENDEE_USERS.map((u, i) => ({
      id: u.id,
      clerk_id: `seed_clerk_att_${String(i + 1).padStart(3, "0")}`,
      email: `seed.att.${i + 1}@gooutside.test`,
      first_name: u.first,
      last_name: u.last,
      role: "attendee",
      account_type: "user",
      location_city: u.city,
      interests: u.interests,
      pulse_score: u.pulse,
      pulse_tier: u.tier,
      pulse_points_balance: Math.floor(u.pulse * 0.3),
      pulse_points_lifetime: u.pulse,
      onboarding_complete: true,
      avatar_url: u.g === "m" ? nextM() : nextF(),
      is_active: true,
      vibe: {
        frequency: ["monthly", "weekly", "occasionally"][i % 3],
        crew: ["solo", "friends", "partner"][i % 3],
        time: [["evenings", "weekends"][i % 2]],
      },
    }));
    const { error: e3 } = await supabaseAdmin.from("users").upsert(attendeeRows, { onConflict: "id" });
    if (e3) errors.push(`users(attendees): ${e3.message}`);

    // 4. Venues
    const venueRows = VENUES.map((v) => ({
      id: v.id,
      name: v.name,
      address: v.address,
      city: v.city,
      country: "Ghana",
      latitude: v.lat,
      longitude: v.lng,
      capacity: v.cap,
      google_maps_url: `https://maps.google.com/?q=${encodeURIComponent(v.name)}`,
      is_verified: true,
    }));
    const { error: e4 } = await supabaseAdmin.from("venues").upsert(venueRows, { onConflict: "id" });
    if (e4) errors.push(`venues: ${e4.message}`);

    // 5. Events
    const eventRows = EVENTS.map((ev) => ({
      id: ev.id,
      organizer_id: ev.org,
      category_id: catMap[ev.cat],
      venue_id: ev.venue,
      title: ev.title,
      slug: ev.slug,
      description: ev.desc,
      short_description: ev.short,
      tags: ev.tags,
      banner_url: ev.banner,
      gallery_urls: ev.gallery,
      start_datetime: ev.start,
      end_datetime: ev.end,
      timezone: "Africa/Accra",
      is_online: false,
      total_capacity: ev.cap,
      tickets_sold: 0,
      status: "published",
      published_at: new Date().toISOString(),
      is_featured: ev.featured,
      is_landmark: ev.landmark,
      is_sponsored: ev.sponsored,
      views_count: Math.floor(ev.cap * 0.3 + 100),
      saves_count: Math.floor(ev.cap * 0.05 + 10),
    }));
    const { error: e5 } = await supabaseAdmin.from("events").upsert(eventRows, { onConflict: "id" });
    if (e5) errors.push(`events: ${e5.message}`);

    // 6. Ticket types
    const ticketRows = EVENTS.flatMap((ev) =>
      ev.tickets.map((tt, i) => ({
        id: tt.id,
        event_id: ev.id,
        name: tt.name,
        price: tt.price,
        price_type: tt.type,
        currency: "GHS",
        quantity_total: tt.qty,
        quantity_sold: 0,
        max_per_user: 5,
        is_active: true,
        sort_order: i,
      }))
    );
    const { error: e6 } = await supabaseAdmin.from("ticket_types").upsert(ticketRows, { onConflict: "id" });
    if (e6) errors.push(`ticket_types: ${e6.message}`);

    // 7. Follows (attendees → organizers, power-law)
    const follows = ATTENDEE_USERS.flatMap((u, i) => {
      const count = 3 + (i % 6);
      const shuffled = [...ORG_USER_IDS].sort(() => Math.sin(i * 17.3) - 0.5);
      return shuffled.slice(0, count).map((followingId) => ({
        follower_id: u.id,
        following_id: followingId,
      }));
    });
    const { error: e7 } = await supabaseAdmin
      .from("follows")
      .upsert(follows, { onConflict: "follower_id,following_id" });
    if (e7) errors.push(`follows: ${e7.message}`);

    // 8. Graph edges
    const edges: object[] = [];
    EVENTS.forEach((ev, i) => {
      const catId = catMap[ev.cat];
      if (catId) edges.push({ from_id:ev.id, from_type:"event", to_id:catId,   to_type:"category",  edge_type:"belongs_to",  weight:1.0 });
      edges.push(          { from_id:ev.id, from_type:"event", to_id:ev.org,   to_type:"organizer", edge_type:"organized_by", weight:1.0 });
      edges.push(          { from_id:ev.id, from_type:"event", to_id:ev.venue, to_type:"venue",     edge_type:"held_at",      weight:1.0 });
      ATTENDEE_USERS.forEach((u, j) => {
        if ((i + j) % 5 < 2) edges.push({ from_id:u.id, from_type:"user", to_id:ev.id, to_type:"event", edge_type:"save",       weight:5.0 });
        if ((i + j) % 7 < 2) edges.push({ from_id:u.id, from_type:"user", to_id:ev.id, to_type:"event", edge_type:"card_click", weight:2.0 });
      });
    });
    // Batch 100 at a time to avoid PostgREST limits
    for (let i = 0; i < edges.length; i += 100) {
      const { error: ee } = await supabaseAdmin
        .from("graph_edges")
        .upsert(edges.slice(i, i + 100), { onConflict: "from_id,to_id,edge_type" });
      if (ee) errors.push(`graph_edges batch ${i}: ${ee.message}`);
    }

    return NextResponse.json({
      ok: errors.length === 0,
      message: errors.length === 0
        ? "Seeded successfully"
        : `Seeded with ${errors.length} error(s)`,
      errors,
      summary: { users: 50, venues: VENUES.length, events: EVENTS.length, tickets: ticketRows.length, follows: follows.length, edges: edges.length },
    });
  }

  if (action === "teardown") {
    const errors: string[] = [];

    const del = async (table: string, col: string, ids: string[]) => {
      const { error } = await supabaseAdmin.from(table).delete().in(col, ids);
      if (error) errors.push(`${table}(${col}): ${error.message}`);
    };

    // Reverse FK order
    await del("graph_edges",           "from_id",     EVENT_IDS);
    await del("graph_edges",           "to_id",       EVENT_IDS);
    await del("graph_edges",           "from_id",     ALL_USER_IDS);
    await del("graph_edges",           "to_id",       ALL_USER_IDS);
    await del("ticket_types",          "id",          TICKET_IDS);
    await del("scarcity_state",        "event_id",    EVENT_IDS);
    await del("events",                "id",          EVENT_IDS);
    await del("organizer_profiles",    "user_id",     ORG_USER_IDS);
    await del("follows",               "follower_id", ATT_USER_IDS);
    await del("follows",               "following_id",ORG_USER_IDS);
    await del("user_interest_vectors", "user_id",     ALL_USER_IDS);
    await del("venues",                "id",          VENUE_IDS);
    await del("users",                 "id",          ALL_USER_IDS);

    return NextResponse.json({
      ok: errors.length === 0,
      message: errors.length === 0 ? "Teardown complete" : `Teardown with ${errors.length} error(s)`,
      errors,
    });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
