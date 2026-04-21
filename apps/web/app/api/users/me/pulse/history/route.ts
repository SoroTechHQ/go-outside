import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../../../lib/supabase";

export async function GET() {
  const clerk = await currentUser();
  if (!clerk) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("clerk_id", clerk.id)
    .maybeSingle();

  if (!user) return NextResponse.json({ history: [] });

  try {
    const { data } = await supabaseAdmin
      .from("pulse_score_history")
      .select("id, points, reason, created_at")
      .eq("user_id", (user as { id: string }).id)
      .order("created_at", { ascending: false })
      .limit(50);

    return NextResponse.json({ history: data ?? [] });
  } catch {
    // pulse_score_history table may not exist yet (migration 010 pending)
    return NextResponse.json({ history: [] });
  }
}
