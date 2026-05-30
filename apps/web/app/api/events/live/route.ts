// POST /api/events/live        — broadcast my location for an event
// DELETE /api/events/live      — stop broadcasting
// GET /api/events/live?event_id=... — fetch attendees (count + friends)

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../lib/supabase";

type LiveLocationRow = {
  user_id:    string;
  event_id:   string;
  lat:        number;
  lng:        number;
  accuracy:   number | null;
  updated_at: string;
  users: {
    id:         string;
    first_name: string | null;
    avatar_url: string | null;
    username:   string | null;
  };
};

// ── GET — attendee list for a specific event ──────────────────────────────────
export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("event_id");
  if (!eventId) return NextResponse.json({ error: "event_id required" }, { status: 400 });

  // Resolve caller's Supabase user id
  const { data: me } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("clerk_id", clerkId)
    .maybeSingle();

  if (!me) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Get all active broadcasters for this event
  const { data: rows } = await supabaseAdmin
    .from("event_live_locations")
    .select("user_id, event_id, lat, lng, accuracy, updated_at, users(id, first_name, avatar_url, username)")
    .eq("event_id", eventId)
    .gt("expires_at", new Date().toISOString());

  const locs = (rows as LiveLocationRow[] | null) ?? [];

  // Get my mutual follows (friends = people who follow me back)
  const [{ data: iFollow }, { data: followMe }] = await Promise.all([
    supabaseAdmin.from("follows").select("following_id").eq("follower_id", me.id),
    supabaseAdmin.from("follows").select("follower_id").eq("following_id", me.id),
  ]);

  const iFollowSet   = new Set((iFollow ?? []).map((r: { following_id: string }) => r.following_id));
  const followMeSet  = new Set((followMe ?? []).map((r: { follower_id: string }) => r.follower_id));
  const friendIds    = new Set([...iFollowSet].filter((id) => followMeSet.has(id)));

  const attendees = locs.map((loc) => {
    const isFriend = friendIds.has(loc.user_id) || loc.user_id === me.id;
    return {
      userId:    loc.user_id,
      lat:       loc.lat,
      lng:       loc.lng,
      isSelf:    loc.user_id === me.id,
      isFriend,
      // Only expose name/avatar for friends + self; others are anonymous
      firstName: isFriend ? (loc.users?.first_name ?? null) : null,
      avatarUrl: isFriend ? (loc.users?.avatar_url ?? null) : null,
      username:  isFriend ? (loc.users?.username ?? null) : null,
      updatedAt: loc.updated_at,
    };
  });

  return NextResponse.json({
    total:       attendees.length,
    friendCount: attendees.filter((a) => a.isFriend && !a.isSelf).length,
    attendees,
  });
}

// ── POST — broadcast / update my location ─────────────────────────────────────
export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { event_id, lat, lng, accuracy } = (await req.json()) as {
    event_id: string;
    lat:      number;
    lng:      number;
    accuracy?: number;
  };

  if (!event_id || typeof lat !== "number" || typeof lng !== "number") {
    return NextResponse.json({ error: "event_id, lat, lng required" }, { status: 400 });
  }

  // Get user + event in parallel
  const [{ data: user }, { data: event }] = await Promise.all([
    supabaseAdmin.from("users").select("id").eq("clerk_id", clerkId).maybeSingle(),
    supabaseAdmin
      .from("events")
      .select("id, start_datetime, end_datetime")
      .eq("id", event_id)
      .maybeSingle(),
  ]);

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const ev = event as { id: string; start_datetime: string; end_datetime: string };
  const now       = Date.now();
  const startMs   = new Date(ev.start_datetime).getTime();
  const endMs     = new Date(ev.end_datetime).getTime();
  const windowStart = startMs - 3 * 60 * 60 * 1000; // 3h before
  const expiresAt   = new Date(endMs + 5 * 60 * 60 * 1000).toISOString(); // 5h after end

  if (now < windowStart) {
    return NextResponse.json({ error: "Live map not yet active — opens 3 hours before the event" }, { status: 403 });
  }
  if (now > endMs + 5 * 60 * 60 * 1000) {
    return NextResponse.json({ error: "Live map has closed for this event" }, { status: 403 });
  }

  const { error } = await supabaseAdmin
    .from("event_live_locations")
    .upsert({
      user_id:    user.id,
      event_id:   event_id,
      lat,
      lng,
      accuracy:   accuracy ?? null,
      updated_at: new Date().toISOString(),
      expires_at: expiresAt,
    }, { onConflict: "user_id,event_id" });

  if (error) {
    console.error("[POST /api/events/live]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, expiresAt });
}

// ── DELETE — stop broadcasting ─────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { event_id } = (await req.json()) as { event_id: string };

  const { data: user } = await supabaseAdmin
    .from("users").select("id").eq("clerk_id", clerkId).maybeSingle();

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  await supabaseAdmin
    .from("event_live_locations")
    .delete()
    .eq("user_id", user.id)
    .eq("event_id", event_id);

  return NextResponse.json({ ok: true });
}
