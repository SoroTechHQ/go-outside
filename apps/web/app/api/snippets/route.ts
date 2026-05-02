import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../lib/supabase";

export async function POST(req: NextRequest) {
  const clerk = await currentUser();
  if (!clerk) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { body, vibe_tags } = await req.json() as {
    body: string;
    vibe_tags?: string[];
  };

  if (!body || body.trim().length === 0) {
    return NextResponse.json({ error: "Body is required" }, { status: 400 });
  }
  if (body.length > 300) {
    return NextResponse.json({ error: "Snippet must be 300 characters or less" }, { status: 400 });
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
    })
    .select("id, body, vibe_tags, created_at, user_id")
    .single();

  if (error) {
    console.error("[POST /api/snippets]", error);
    return NextResponse.json({ error: "Failed to create snippet" }, { status: 500 });
  }

  return NextResponse.json(snippet, { status: 201 });
}
