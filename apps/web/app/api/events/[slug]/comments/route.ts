import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../../lib/supabase";
import { insertNotification } from "../../../../../lib/db/insert-notification";

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
      users ( id, first_name, last_name, username, avatar_url )
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

// POST /api/events/[slug]/comments  — create an event comment (stored in snippets)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const clerk = await currentUser();
  if (!clerk) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const { body, vibe_tags } = await req.json() as {
    body: string;
    vibe_tags?: string[];
  };

  if (!body?.trim()) return NextResponse.json({ error: "Body required" }, { status: 400 });
  if (body.length > 300) return NextResponse.json({ error: "Too long" }, { status: 400 });

  // Resolve commenter's Supabase user id
  const { data: commenter } = await supabaseAdmin
    .from("users")
    .select("id, first_name, last_name")
    .eq("clerk_id", clerk.id)
    .maybeSingle();

  if (!commenter) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Resolve event — get id, organizer_id, and title for the notification
  const { data: event } = await supabaseAdmin
    .from("events")
    .select("id, organizer_id, title, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const { data: comment, error } = await supabaseAdmin
    .from("snippets")
    .insert({
      user_id:   commenter.id,
      event_id:  event.id,
      body:      body.trim(),
      vibe_tags: vibe_tags ?? [],
      is_public: true,
    })
    .select(`id, body, vibe_tags, gif_url, rating, created_at, users(id, first_name, last_name, username, avatar_url)`)
    .single();

  if (error) {
    console.error("[POST /api/events/[slug]/comments]", error);
    return NextResponse.json({ error: "Failed to post comment" }, { status: 500 });
  }

  // Award pulse points to the commenter (fire-and-forget)
  void supabaseAdmin.rpc("award_pulse_points", {
    p_user_id:    commenter.id,
    p_delta:      3,
    p_type:       "snippet_posted",
    p_description: "Commented on an event",
    p_event_id:   event.id,
  });

  // Notify the event organizer — only if the commenter isn't the organizer
  if (event.organizer_id && event.organizer_id !== commenter.id) {
    const commenterName = [commenter.first_name, commenter.last_name].filter(Boolean).join(" ") || "Someone";
    insertNotification({
      userId:     event.organizer_id,
      type:       "event_comment",
      title:      `New comment on ${event.title}`,
      body:       `${commenterName}: "${body.trim().slice(0, 80)}${body.length > 80 ? "…" : ""}"`,
      actionHref: `/events/${event.slug}`,
      data:       { event_id: event.id, commenter_id: commenter.id },
    });
  }

  return NextResponse.json(comment, { status: 201 });
}
