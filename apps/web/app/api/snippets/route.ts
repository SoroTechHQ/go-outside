import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../lib/supabase";

export async function POST(req: NextRequest) {
  const clerk = await currentUser();
  if (!clerk) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { body, vibe_tags, event_id, gif_url } = await req.json() as {
    body: string;
    vibe_tags?: string[];
    event_id?: string;
    gif_url?: string;
  };

  if (!body || body.trim().length === 0) {
    return NextResponse.json({ error: "Body is required" }, { status: 400 });
  }
  if (body.length > 300) {
    return NextResponse.json({ error: "Comment must be 300 characters or less" }, { status: 400 });
  }

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("clerk_id", clerk.id)
    .maybeSingle();

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { data: snippet, error } = await supabaseAdmin
    .from("snippets")
    .insert({
      user_id:   (user as { id: string }).id,
      body:      body.trim(),
      vibe_tags: vibe_tags ?? [],
      ...(event_id ? { event_id } : {}),
      ...(gif_url ? { gif_url } : {}),
    })
    .select("id, body, vibe_tags, gif_url, created_at, user_id, event_id")
    .single();

  if (error) {
    console.error("[POST /api/snippets]", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }

  // Award Pulse Points for posting a comment
  if (snippet) {
    void supabaseAdmin.rpc("award_pulse_points", {
      p_user_id: (user as { id: string }).id,
      p_delta: 3,
      p_type: "snippet_posted",
      p_description: "Posted a comment on an event",
      p_event_id: event_id ?? null,
    });
  }

  return NextResponse.json(snippet, { status: 201 });
}
