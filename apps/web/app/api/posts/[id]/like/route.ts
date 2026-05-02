import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../../lib/supabase";
import { insertNotification } from "../../../../../lib/db/insert-notification";

type Params = { params: Promise<{ id: string }> };

// GET /api/posts/[id]/like  — check if current user liked this post
export async function GET(_req: NextRequest, { params }: Params) {
  const { id: postId } = await params;
  const clerk = await currentUser();
  if (!clerk) return NextResponse.json({ liked: false });

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("clerk_id", clerk.id)
    .maybeSingle();

  if (!user) return NextResponse.json({ liked: false });

  const { data } = await supabaseAdmin
    .from("post_likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", (user as { id: string }).id)
    .maybeSingle();

  return NextResponse.json({ liked: !!data });
}

// POST /api/posts/[id]/like  — like a post
export async function POST(_req: NextRequest, { params }: Params) {
  const { id: postId } = await params;
  const clerk = await currentUser();
  if (!clerk) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("clerk_id", clerk.id)
    .maybeSingle();

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const userId = (user as { id: string }).id;

  // Upsert like (idempotent)
  await supabaseAdmin
    .from("post_likes")
    .upsert({ post_id: postId, user_id: userId }, { onConflict: "post_id,user_id" });

  // Increment like_count
  await supabaseAdmin.rpc("increment_post_likes", { post_id_arg: postId });

  // Notify post owner — fire and forget, skip if self-like
  const [postRow, likerRow] = await Promise.all([
    supabaseAdmin
      .from("posts")
      .select("user_id, body")
      .eq("id", postId)
      .maybeSingle()
      .then((r) => r.data as { user_id: string; body: string } | null),
    supabaseAdmin
      .from("users")
      .select("first_name, last_name, username, avatar_url")
      .eq("id", userId)
      .maybeSingle()
      .then((r) => r.data as { first_name: string; last_name: string; username: string | null; avatar_url: string | null } | null),
  ]);

  if (postRow && postRow.user_id !== userId) {
    const actorName = likerRow
      ? `${likerRow.first_name} ${likerRow.last_name}`.trim()
      : "Someone";
    insertNotification({
      userId: postRow.user_id,
      type: "post_like",
      title: `${actorName} liked your post`,
      body: postRow.body.slice(0, 80),
      data: {
        actor_id:         userId,
        actor_name:       actorName,
        actor_avatar_url: likerRow?.avatar_url ?? null,
      },
      actionHref: likerRow?.username ? `/go/${likerRow.username}` : undefined,
    });
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/posts/[id]/like  — unlike a post
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id: postId } = await params;
  const clerk = await currentUser();
  if (!clerk) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("clerk_id", clerk.id)
    .maybeSingle();

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const userId = (user as { id: string }).id;

  await supabaseAdmin
    .from("post_likes")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", userId);

  // Decrement like_count (floor at 0)
  await supabaseAdmin.rpc("decrement_post_likes", { post_id_arg: postId });

  return NextResponse.json({ ok: true });
}
