import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clerkId } = await params;

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("clerk_id", clerkId)
    .maybeSingle();

  if (!user) return NextResponse.json({ snippets: [] });

  const { data: snippets, error } = await supabaseAdmin
    .from("snippets")
    .select("id, body, vibe_tags, created_at, user_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[snippets route]", error.message);
    return NextResponse.json({ snippets: [] });
  }

  return NextResponse.json({ snippets: snippets ?? [] });
}
