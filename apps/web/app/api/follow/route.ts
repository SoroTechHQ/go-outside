import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../lib/supabase";

async function getSupabaseUserId(clerkId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("clerk_id", clerkId)
    .single();
  return data?.id ?? null;
}

// POST /api/follow — follow a user
export async function POST(req: NextRequest) {
  const clerk = await currentUser();
  if (!clerk) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { targetClerkId?: string };
  if (!body.targetClerkId) {
    return NextResponse.json({ error: "targetClerkId required" }, { status: 400 });
  }
  if (body.targetClerkId === clerk.id) {
    return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
  }

  const [fromId, toId] = await Promise.all([
    getSupabaseUserId(clerk.id),
    getSupabaseUserId(body.targetClerkId),
  ]);

  if (!fromId) return NextResponse.json({ error: "Your account is not fully set up" }, { status: 400 });
  if (!toId) return NextResponse.json({ error: "Target user not found" }, { status: 404 });

  const [edgeResult] = await Promise.all([
    supabaseAdmin.from("graph_edges").upsert(
      { from_id: fromId, from_type: "user", to_id: toId, to_type: "user", edge_type: "follows", weight: 1.0, is_active: true },
      { onConflict: "from_id,to_id,edge_type", ignoreDuplicates: false },
    ),
    // Mirror into follows table for RLS-based queries
    supabaseAdmin.from("follows").upsert(
      { follower_id: fromId, following_id: toId },
      { onConflict: "follower_id,following_id", ignoreDuplicates: true },
    ),
  ]);

  if (edgeResult.error) {
    console.error("[POST /api/follow]", edgeResult.error);
    return NextResponse.json({ error: "Could not follow user" }, { status: 500 });
  }

  // Notify the target — fire and forget
  void supabaseAdmin.from("notifications").insert({
    user_id: toId,
    type: "new_follower",
    title: "New follower",
    body: "Someone started following you.",
    is_read: false,
  });

  return NextResponse.json({ success: true });
}

// DELETE /api/follow — unfollow a user
export async function DELETE(req: NextRequest) {
  const clerk = await currentUser();
  if (!clerk) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { targetClerkId?: string };
  if (!body.targetClerkId) {
    return NextResponse.json({ error: "targetClerkId required" }, { status: 400 });
  }

  const [fromId, toId] = await Promise.all([
    getSupabaseUserId(clerk.id),
    getSupabaseUserId(body.targetClerkId),
  ]);

  if (!fromId || !toId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const [edgeResult] = await Promise.all([
    supabaseAdmin.from("graph_edges").delete()
      .eq("from_id", fromId).eq("to_id", toId).eq("edge_type", "follows"),
    supabaseAdmin.from("follows").delete()
      .eq("follower_id", fromId).eq("following_id", toId),
  ]);

  if (edgeResult.error) {
    console.error("[DELETE /api/follow]", edgeResult.error);
    return NextResponse.json({ error: "Could not unfollow user" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
