import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../lib/supabase";

async function getSupabaseUserId(clerkId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("clerk_id", clerkId)
    .maybeSingle();
  return data?.id ?? null;
}

async function safeInsertFollow(follower_id: string, following_id: string) {
  const { error } = await supabaseAdmin
    .from("follows")
    .insert({ follower_id, following_id });
  // 23505 = unique_violation (already following) — not an error
  if (error && error.code !== "23505") {
    console.error("[follows insert]", error);
  }
}

async function safeInsertEdge(from_id: string, to_id: string) {
  const { error } = await supabaseAdmin.from("graph_edges").insert({
    from_id,
    from_type: "user",
    to_id,
    to_type: "user",
    edge_type: "follows",
    weight: 1.0,
    is_active: true,
  });
  if (error && error.code !== "23505") {
    console.error("[graph_edges follows insert]", error);
    return error;
  }
  return null;
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

  // Write to both tables — INSERT ignoring duplicates (resilient with or without unique constraint)
  await Promise.all([
    safeInsertEdge(fromId, toId),
    safeInsertFollow(fromId, toId),
  ]);

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

  await Promise.all([
    supabaseAdmin.from("graph_edges").delete()
      .eq("from_id", fromId).eq("to_id", toId).eq("edge_type", "follows"),
    supabaseAdmin.from("follows").delete()
      .eq("follower_id", fromId).eq("following_id", toId),
  ]);

  return NextResponse.json({ success: true });
}
