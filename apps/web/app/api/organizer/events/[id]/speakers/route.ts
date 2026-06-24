import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../../../lib/supabase";

type Params = { params: Promise<{ id: string }> };

function jsonError(status: number, msg: string) {
  return NextResponse.json({ error: msg }, { status });
}

// GET /api/organizer/events/[id]/speakers
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from("event_speakers")
    .select("*")
    .eq("event_id", id)
    .order("sort_order");

  if (error) return jsonError(500, error.message);
  return NextResponse.json({ speakers: data });
}

// PUT /api/organizer/events/[id]/speakers
// Replaces the full speaker list for the event (delete-and-reinsert).
export async function PUT(req: NextRequest, { params }: Params) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return jsonError(401, "Unauthorized");

  const { id: eventId } = await params;

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, role")
    .eq("clerk_id", clerkId)
    .maybeSingle();

  if (!user) return jsonError(404, "User not found");
  if (user.role !== "organizer" && user.role !== "admin") return jsonError(403, "Organizer required");

  // Verify ownership
  const { data: event } = await supabaseAdmin
    .from("events")
    .select("organizer_id")
    .eq("id", eventId)
    .maybeSingle();

  if (!event || event.organizer_id !== user.id) return jsonError(404, "Event not found");

  let body: { speakers?: { name: string; role?: string; photoUrl?: string; bio?: string }[] };
  try { body = await req.json(); } catch { return jsonError(400, "Invalid JSON"); }

  const speakers = body.speakers ?? [];

  // Delete existing then insert new
  await supabaseAdmin.from("event_speakers").delete().eq("event_id", eventId);

  if (speakers.length > 0) {
    const rows = speakers.map((s, i) => ({
      event_id:   eventId,
      name:       s.name,
      role:       s.role ?? null,
      photo_url:  s.photoUrl ?? null,
      bio:        s.bio ?? null,
      sort_order: i,
    }));

    const { error } = await supabaseAdmin.from("event_speakers").insert(rows);
    if (error) return jsonError(500, error.message);
  }

  return NextResponse.json({ ok: true });
}
