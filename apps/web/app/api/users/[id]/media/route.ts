import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clerkId } = await params;

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("clerk_id", clerkId)
    .maybeSingle();

  if (!user) return NextResponse.json({ media: [] });

  const { data: media } = await supabaseAdmin
    .from("user_media")
    .select(`
      id, url, thumbnail_url, media_type, caption,
      width, height, duration_s, likes_count, views_count,
      created_at,
      events (id, title, slug)
    `)
    .eq("user_id", user.id)
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(48);

  return NextResponse.json({ media: media ?? [] });
}
