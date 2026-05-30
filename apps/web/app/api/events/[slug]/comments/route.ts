import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabase";

// GET /api/events/[slug]/comments?cursor=&limit=10
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const url = new URL(_req.url);
  const cursor = url.searchParams.get("cursor");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "10"), 30);

  // Resolve event id from slug
  const { data: event } = await supabaseAdmin
    .from("events")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (!event) return NextResponse.json([], { status: 200 });

  let query = supabaseAdmin
    .from("snippets")
    .select(`
      id, body, vibe_tags, gif_url, rating, created_at,
      users ( id, display_name, username, avatar_url )
    `)
    .eq("event_id", event.id)
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[GET /api/events/[slug]/comments]", error);
    return NextResponse.json([], { status: 200 });
  }

  return NextResponse.json(data ?? []);
}
