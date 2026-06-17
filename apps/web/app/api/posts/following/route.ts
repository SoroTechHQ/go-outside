import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../lib/supabase";

// GET /api/posts/following — recent posts from users the caller follows
export async function GET() {
  const clerk = await currentUser();
  if (!clerk) return NextResponse.json({ posts: [] });

  const { data: me } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("clerk_id", clerk.id)
    .maybeSingle();

  if (!me) return NextResponse.json({ posts: [] });

  const { data: follows } = await supabaseAdmin
    .from("follows")
    .select("following_id")
    .eq("follower_id", (me as { id: string }).id)
    .limit(200);

  const followedIds = (follows ?? []).map((f: { following_id: string }) => f.following_id);
  if (followedIds.length === 0) return NextResponse.json({ posts: [] });

  const { data: posts } = await supabaseAdmin
    .from("posts")
    .select(`
      id, body, media_urls, likes_count, created_at,
      users!posts_user_id_fkey(id, first_name, last_name, username, avatar_url, clerk_id),
      events!posts_event_id_fkey(id, title, slug, banner_url)
    `)
    .in("user_id", followedIds)
    .eq("is_deleted", false)
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(12);

  return NextResponse.json({ posts: posts ?? [] });
}
