import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabase";
import { getSupabaseUserIdByClerkId } from "../../../../../lib/db/users";
import { enforceSameOrigin, jsonError, jsonNoStore } from "../../../../../lib/api-security";

const CHECK_IN_POINTS = 50;
const COOLDOWN_HOURS = 22; // one check-in per event per day

async function resolveEventId(slug: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("events")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

// GET /api/events/[slug]/checkin — check if current user is checked in
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { userId } = await auth();
  if (!userId) return jsonNoStore({ checked_in: false });

  const { slug } = await params;
  const eventId = await resolveEventId(slug);
  if (!eventId) return jsonNoStore({ checked_in: false });

  const supabaseUserId = await getSupabaseUserIdByClerkId(userId);
  if (!supabaseUserId) return jsonNoStore({ checked_in: false });

  const cutoff = new Date(Date.now() - COOLDOWN_HOURS * 60 * 60 * 1000).toISOString();

  const { data } = await supabaseAdmin
    .from("graph_edges")
    .select("id")
    .eq("from_id", supabaseUserId)
    .eq("to_id", eventId)
    .eq("edge_type", "checked_in")
    .gte("updated_at", cutoff)
    .maybeSingle();

  return jsonNoStore({ checked_in: !!data, event_id: eventId });
}

// POST /api/events/[slug]/checkin — check in to an event and earn Pulse Points
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { userId } = await auth();
  if (!userId) return jsonError(401, "Unauthenticated");

  const csrfResponse = enforceSameOrigin(req);
  if (csrfResponse) return csrfResponse;

  const { slug } = await params;
  const eventId = await resolveEventId(slug);
  if (!eventId) return jsonError(404, "Event not found");

  const supabaseUserId = await getSupabaseUserIdByClerkId(userId);
  if (!supabaseUserId) return jsonError(404, "User not found");

  const cutoff = new Date(Date.now() - COOLDOWN_HOURS * 60 * 60 * 1000).toISOString();

  // Idempotency: already checked in within cooldown window
  const { data: existing } = await supabaseAdmin
    .from("graph_edges")
    .select("id")
    .eq("from_id", supabaseUserId)
    .eq("to_id", eventId)
    .eq("edge_type", "checked_in")
    .gte("updated_at", cutoff)
    .maybeSingle();

  if (existing) {
    return jsonNoStore({ checked_in: true, already_checked_in: true, points_awarded: 0 });
  }

  // Record check-in edge
  const { error: edgeError } = await supabaseAdmin.from("graph_edges").upsert(
    {
      from_id:   supabaseUserId,
      from_type: "user",
      to_id:     eventId,
      to_type:   "event",
      edge_type: "checked_in",
      weight:    9.0,
      is_active: true,
    },
    { onConflict: "from_id,to_id,edge_type", ignoreDuplicates: false },
  );

  if (edgeError) {
    console.error("[POST /api/events/[slug]/checkin] edge error", edgeError);
    return jsonError(500, "Could not record check-in");
  }

  // Award Pulse Points (fire-and-forget — don't block response)
  void supabaseAdmin.rpc("award_pulse_points", {
    p_user_id:    supabaseUserId,
    p_delta:      CHECK_IN_POINTS,
    p_type:       "check_in",
    p_description: "Checked in at an event",
    p_event_id:   eventId,
  });

  return jsonNoStore({ checked_in: true, already_checked_in: false, points_awarded: CHECK_IN_POINTS });
}
