import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabase";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id: clerkId } = await params;

  // Get internal user id first
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("clerk_id", clerkId)
    .maybeSingle();

  if (!user) return NextResponse.json({ events_attended: 0, followers_count: 0, following_count: 0 });

  const userId = user.id;

  // Events attended (tickets)
  const { count: eventsCount } = await supabaseAdmin
    .from("tickets")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  // Followers / following — graceful fallback if table doesn't exist yet
  let followersCount = 0;
  let followingCount = 0;
  try {
    const [fwrs, fwng] = await Promise.all([
      supabaseAdmin.from("follows").select("follower_id", { count: "exact", head: true }).eq("following_id", userId),
      supabaseAdmin.from("follows").select("following_id", { count: "exact", head: true }).eq("follower_id", userId),
    ]);
    followersCount = fwrs.count ?? 0;
    followingCount = fwng.count ?? 0;
  } catch {
    // follows table not yet migrated
  }

  return NextResponse.json({
    events_attended:  eventsCount  ?? 0,
    followers_count:  followersCount,
    following_count:  followingCount,
  });
}
