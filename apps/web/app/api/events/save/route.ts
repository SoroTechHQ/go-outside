import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { getSupabaseUserIdByClerkId } from "../../../../lib/db/users";

// POST /api/events/save  { eventId }  → saves the event
// DELETE /api/events/save { eventId } → unsaves the event
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { eventId } = await req.json();
  if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 });

  const supabaseUserId = await getSupabaseUserIdByClerkId(userId);
  if (!supabaseUserId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { error } = await supabaseAdmin
    .from("saved_events")
    .upsert({ user_id: supabaseUserId, event_id: eventId }, { onConflict: "user_id,event_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ saved: true });
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { eventId } = await req.json();
  if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 });

  const supabaseUserId = await getSupabaseUserIdByClerkId(userId);
  if (!supabaseUserId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { error } = await supabaseAdmin
    .from("saved_events")
    .delete()
    .eq("user_id", supabaseUserId)
    .eq("event_id", eventId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ saved: false });
}
