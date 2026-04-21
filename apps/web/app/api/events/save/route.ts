import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { enforceRateLimit, enforceSameOrigin, getActorKey, jsonError, jsonNoStore } from "../../../../lib/api-security";
import { getSupabaseUserIdByClerkId } from "../../../../lib/db/users";

// POST /api/events/save  { eventId }  → saves the event
// DELETE /api/events/save { eventId } → unsaves the event
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return jsonError(401, "Unauthenticated");

  const csrfResponse = enforceSameOrigin(req);
  if (csrfResponse) return csrfResponse;

  const rateLimitResponse = enforceRateLimit({
    bucket: "events-save",
    key: getActorKey(req, userId),
    limit: 60,
    windowMs: 60_000,
  });
  if (rateLimitResponse) return rateLimitResponse;

  const { eventId } = await req.json();
  if (!eventId) return jsonError(400, "eventId required");

  const supabaseUserId = await getSupabaseUserIdByClerkId(userId);
  if (!supabaseUserId) return jsonError(404, "User not found");

  const { error } = await supabaseAdmin
    .from("saved_events")
    .upsert({ user_id: supabaseUserId, event_id: eventId }, { onConflict: "user_id,event_id" });

  if (error) {
    console.error("[POST /api/events/save]", error);
    return jsonError(500, "Could not save event");
  }

  return jsonNoStore({ saved: true });
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return jsonError(401, "Unauthenticated");

  const csrfResponse = enforceSameOrigin(req);
  if (csrfResponse) return csrfResponse;

  const rateLimitResponse = enforceRateLimit({
    bucket: "events-unsave",
    key: getActorKey(req, userId),
    limit: 60,
    windowMs: 60_000,
  });
  if (rateLimitResponse) return rateLimitResponse;

  const { eventId } = await req.json();
  if (!eventId) return jsonError(400, "eventId required");

  const supabaseUserId = await getSupabaseUserIdByClerkId(userId);
  if (!supabaseUserId) return jsonError(404, "User not found");

  const { error } = await supabaseAdmin
    .from("saved_events")
    .delete()
    .eq("user_id", supabaseUserId)
    .eq("event_id", eventId);

  if (error) {
    console.error("[DELETE /api/events/save]", error);
    return jsonError(500, "Could not update saved state");
  }

  return jsonNoStore({ saved: false });
}
