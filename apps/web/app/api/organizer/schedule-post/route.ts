import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../lib/supabase";

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, role")
    .eq("clerk_id", clerkId)
    .maybeSingle();

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.role !== "organizer" && user.role !== "admin") {
    return NextResponse.json({ error: "Organizer access required" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.body || typeof body.body !== "string") {
    return NextResponse.json({ error: "body is required" }, { status: 400 });
  }
  if (!body.scheduledFor) {
    return NextResponse.json({ error: "scheduledFor is required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("scheduled_posts")
    .insert({
      organizer_id: user.id,
      event_id: (body.eventId as string) || null,
      body: body.body as string,
      media_urls: (body.mediaUrls as string[]) ?? [],
      hashtags: (body.hashtags as string[]) ?? [],
      location: (body.location as string) || null,
      scheduled_for: body.scheduledFor as string,
      status: "scheduled",
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ id: data.id }, { status: 201 });
}
