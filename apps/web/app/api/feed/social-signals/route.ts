import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../lib/supabase";

const WEIGHTS: Record<string, number> = {
  registered: 3.0,
  checked_in: 2.5,
  saved:      1.5,
  shared:     1.0,
  viewed:     0.3,
};

type SignalSummary = {
  event_id:     string;
  score:        number;
  friend_count: number;
  actions:      { edge_type: string; count: number }[];
};

// GET /api/feed/social-signals?eventIds=id1,id2,...
export async function GET(req: NextRequest) {
  const clerk = await currentUser();
  if (!clerk) return NextResponse.json({ signals: [] });

  const eventIds = req.nextUrl.searchParams.get("eventIds")?.split(",").filter(Boolean) ?? [];
  if (eventIds.length === 0) return NextResponse.json({ signals: [] });

  // Get current user's internal ID
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("clerk_id", clerk.id)
    .maybeSingle();

  if (!user) return NextResponse.json({ signals: [] });
  const userId = (user as { id: string }).id;

  // Get friend IDs (from friendships table — bidirectional)
  const { data: friendRows } = await supabaseAdmin
    .from("friendships")
    .select("user_a_id, user_b_id")
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`);

  // Also check follows table if it exists
  const { data: followRows } = await supabaseAdmin
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId)
    .limit(200);

  const friendIds = new Set([
    ...(friendRows ?? []).map((f: { user_a_id: string; user_b_id: string }) =>
      f.user_a_id === userId ? f.user_b_id : f.user_a_id
    ),
    ...(followRows ?? []).map((f: { following_id: string }) => f.following_id),
  ]);

  if (friendIds.size === 0) return NextResponse.json({ signals: [] });

  // Fetch graph edges from friends on these events
  const { data: edges } = await supabaseAdmin
    .from("graph_edges")
    .select("to_id, edge_type, from_id")
    .in("to_id", eventIds)
    .in("from_id", Array.from(friendIds))
    .in("edge_type", Object.keys(WEIGHTS));

  if (!edges || edges.length === 0) return NextResponse.json({ signals: [] });

  // Group by event
  const byEvent = new Map<string, { score: number; friends: Set<string>; actions: Map<string, number> }>();

  for (const edge of edges) {
    const eventId = edge.to_id as string;
    if (!byEvent.has(eventId)) {
      byEvent.set(eventId, { score: 0, friends: new Set(), actions: new Map() });
    }
    const entry = byEvent.get(eventId)!;
    entry.score += WEIGHTS[edge.edge_type as string] ?? 0;
    entry.friends.add(edge.from_id as string);
    entry.actions.set(
      edge.edge_type as string,
      (entry.actions.get(edge.edge_type as string) ?? 0) + 1
    );
  }

  const signals: SignalSummary[] = Array.from(byEvent.entries()).map(([event_id, entry]) => ({
    event_id,
    score:        Math.round(entry.score * 10) / 10,
    friend_count: entry.friends.size,
    actions:      Array.from(entry.actions.entries()).map(([edge_type, count]) => ({ edge_type, count })),
  }));

  return NextResponse.json({ signals });
}
