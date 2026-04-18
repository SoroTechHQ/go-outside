import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getOrCreateSupabaseUser } from "../../../../../lib/db/users";
import { supabaseAdmin } from "../../../../../lib/supabase";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: targetUserId } = await params;

  const clerkUser = await currentUser();
  if (!clerkUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await getOrCreateSupabaseUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (me.id === targetUserId) return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("follows")
    .upsert({ follower_id: me.id, following_id: targetUserId }, { onConflict: "follower_id,following_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Create a notification for the target user
  await supabaseAdmin.from("notifications").insert({
    user_id: targetUserId,
    type: "new_follower",
    title: "New follower",
    body: `${me.first_name} ${me.last_name} started following you.`,
    is_read: false,
  }).then(() => {/* fire and forget */});

  return NextResponse.json({ following: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: targetUserId } = await params;

  const clerkUser = await currentUser();
  if (!clerkUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await getOrCreateSupabaseUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabaseAdmin
    .from("follows")
    .delete()
    .eq("follower_id", me.id)
    .eq("following_id", targetUserId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ following: false });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: targetUserId } = await params;

  const clerkUser = await currentUser();
  if (!clerkUser) return NextResponse.json({ following: false });

  const me = await getOrCreateSupabaseUser();
  if (!me) return NextResponse.json({ following: false });

  const { data } = await supabaseAdmin
    .from("follows")
    .select("id")
    .eq("follower_id", me.id)
    .eq("following_id", targetUserId)
    .maybeSingle();

  return NextResponse.json({ following: !!data });
}
