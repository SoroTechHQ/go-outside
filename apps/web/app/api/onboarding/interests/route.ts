import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../lib/supabase";

export async function POST(req: NextRequest) {
  const clerk = await currentUser();
  if (!clerk) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { vector } = await req.json() as { interests: string[]; vector: Record<string, number> };

  const { data: sbUser } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("clerk_id", clerk.id)
    .maybeSingle();

  if (!sbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  await supabaseAdmin
    .from("user_interest_vectors")
    .upsert(
      { user_id: sbUser.id, vector, computed_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );

  return NextResponse.json({ ok: true });
}
