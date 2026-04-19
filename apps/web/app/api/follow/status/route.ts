import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../lib/supabase";

async function getSupabaseUserId(clerkId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("clerk_id", clerkId)
    .single();
  return data?.id ?? null;
}

// GET /api/follow/status?targetId=<clerkId>
export async function GET(req: NextRequest) {
  const clerk = await currentUser();
  if (!clerk) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const targetClerkId = req.nextUrl.searchParams.get("targetId");
  if (!targetClerkId) {
    return NextResponse.json({ error: "targetId required" }, { status: 400 });
  }

  const [meId, themId] = await Promise.all([
    getSupabaseUserId(clerk.id),
    getSupabaseUserId(targetClerkId),
  ]);

  if (!meId || !themId) {
    return NextResponse.json({ following: false, followedBy: false, mutual: false });
  }

  const { data: edges } = await supabaseAdmin
    .from("graph_edges")
    .select("from_id, to_id")
    .eq("edge_type", "follows")
    .eq("is_active", true)
    .or(`and(from_id.eq.${meId},to_id.eq.${themId}),and(from_id.eq.${themId},to_id.eq.${meId})`);

  const following = edges?.some((e) => e.from_id === meId && e.to_id === themId) ?? false;
  const followedBy = edges?.some((e) => e.from_id === themId && e.to_id === meId) ?? false;

  return NextResponse.json({ following, followedBy, mutual: following && followedBy });
}
