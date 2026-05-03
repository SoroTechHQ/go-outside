import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";

// Called by Vercel cron: "0 * * * *" (every hour)
// vercel.json: { "crons": [{ "path": "/api/cron/publish-posts", "schedule": "0 * * * *" }] }
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date().toISOString();

  const { data: due, error } = await supabaseAdmin
    .from("scheduled_posts")
    .select("*")
    .eq("status", "scheduled")
    .lte("scheduled_for", now)
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let published = 0;
  for (const sp of due ?? []) {
    const { data: post } = await supabaseAdmin
      .from("posts")
      .insert({
        user_id: sp.organizer_id,
        body: sp.body,
        media_urls: sp.media_urls ?? [],
        event_id: sp.event_id ?? null,
      })
      .select("id")
      .single();

    await supabaseAdmin
      .from("scheduled_posts")
      .update({
        status: "published",
        published_at: now,
        post_id: post?.id ?? null,
      })
      .eq("id", sp.id);

    published++;
  }

  return NextResponse.json({ published });
}
