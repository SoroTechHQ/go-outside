import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../lib/supabase";

// GET /api/posts?clerkId=   — list posts for a user (by their clerk_id)
export async function GET(req: NextRequest) {
  const clerkId = req.nextUrl.searchParams.get("clerkId");
  const cursor  = req.nextUrl.searchParams.get("cursor");

  if (!clerkId) return NextResponse.json({ posts: [] });

  const { data: targetUser } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("clerk_id", clerkId)
    .maybeSingle();

  if (!targetUser) return NextResponse.json({ posts: [] });

  let query = supabaseAdmin
    .from("posts")
    .select(`
      id, body, media_urls, likes_count, created_at, event_id,
      users!posts_user_id_fkey(id, first_name, last_name, username, avatar_url, clerk_id),
      events!posts_event_id_fkey(id, title, slug, banner_url)
    `)
    .eq("user_id", (targetUser as { id: string }).id)
    .eq("is_deleted", false)
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(20);

  if (cursor) query = query.lt("created_at", cursor);

  const { data } = await query;
  return NextResponse.json({ posts: data ?? [] });
}

// POST /api/posts   — create a new post
export async function POST(req: NextRequest) {
  const clerk = await currentUser();
  if (!clerk) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { body, image_url, event_id } = await req.json() as {
    body: string;
    image_url?: string;
    event_id?: string;
  };

  if (!body || body.trim().length === 0) {
    return NextResponse.json({ error: "Post body is required" }, { status: 400 });
  }
  if (body.length > 500) {
    return NextResponse.json({ error: "Post must be 500 characters or less" }, { status: 400 });
  }

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("clerk_id", clerk.id)
    .maybeSingle();

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { data: post, error } = await supabaseAdmin
    .from("posts")
    .insert({
      user_id:    (user as { id: string }).id,
      body:       body.trim(),
      media_urls: image_url ? [image_url] : [],
      event_id:   event_id ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error("[POST /api/posts]", error);
    return NextResponse.json({ error: "Failed to create post", detail: error.message }, { status: 500 });
  }

  return NextResponse.json(post, { status: 201 });
}
