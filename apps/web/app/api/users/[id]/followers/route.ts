import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clerkId } = await params;
  const type   = (req.nextUrl.searchParams.get("type") ?? "followers") as "followers" | "following";
  const page   = Number(req.nextUrl.searchParams.get("page") ?? 1);
  const limit  = 30;
  const offset = (page - 1) * limit;

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("clerk_id", clerkId)
    .maybeSingle();

  if (!user) return NextResponse.json({ users: [] });

  const userFields = `id, clerk_id, username, first_name, last_name, avatar_url, pulse_tier, pulse_score`;

  let data: { follower?: unknown; following?: unknown }[] | null = null;

  if (type === "followers") {
    const { data: rows } = await supabaseAdmin
      .from("follows")
      .select(`follower:follower_id (${userFields})`)
      .eq("following_id", user.id)
      .range(offset, offset + limit - 1);
    data = rows ?? [];
  } else {
    const { data: rows } = await supabaseAdmin
      .from("follows")
      .select(`following:following_id (${userFields})`)
      .eq("follower_id", user.id)
      .range(offset, offset + limit - 1);
    data = rows ?? [];
  }

  const users = (data ?? []).map((row) =>
    type === "followers" ? row.follower : row.following
  );

  return NextResponse.json({ users });
}
