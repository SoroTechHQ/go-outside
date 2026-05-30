// GET /api/organizer/live?event_id=... — full attendee list for organizers
// Organizers see everyone (name, avatar, coordinates) with no anonymisation

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../lib/supabase";

export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("event_id");
  if (!eventId) return NextResponse.json({ error: "event_id required" }, { status: 400 });

  // Verify caller is the organizer of this event
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, role")
    .eq("clerk_id", clerkId)
    .maybeSingle();

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { data: event } = await supabaseAdmin
    .from("events")
    .select("id, organizer_id")
    .eq("id", eventId)
    .maybeSingle();

  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const ev = event as { id: string; organizer_id: string };

  // Allow organizer of this event or platform admins
  if (ev.organizer_id !== user.id && (user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: rows } = await supabaseAdmin
    .from("event_live_locations")
    .select("user_id, lat, lng, accuracy, updated_at, users(id, first_name, last_name, avatar_url, username, email)")
    .eq("event_id", eventId)
    .gt("expires_at", new Date().toISOString())
    .order("updated_at", { ascending: false });

  type OrganizerLiveRow = {
    user_id:    string;
    lat:        number;
    lng:        number;
    accuracy:   number | null;
    updated_at: string;
    users:      { id: string; first_name: string | null; last_name: string | null; avatar_url: string | null; username: string | null; email: string | null } | null;
  };

  const attendees = ((rows as unknown as OrganizerLiveRow[]) ?? []).map((r) => ({
    userId:    r.user_id,
    lat:       r.lat,
    lng:       r.lng,
    accuracy:  r.accuracy,
    updatedAt: r.updated_at,
    firstName: r.users?.first_name ?? null,
    lastName:  r.users?.last_name  ?? null,
    avatarUrl: r.users?.avatar_url ?? null,
    username:  r.users?.username   ?? null,
    email:     r.users?.email      ?? null,
  }));

  return NextResponse.json({ total: attendees.length, attendees });
}
