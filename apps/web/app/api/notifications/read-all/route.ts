import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../lib/supabase";

export async function POST() {
  const clerk = await currentUser();
  if (!clerk) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: sbUser } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("clerk_id", clerk.id)
    .maybeSingle();

  if (!sbUser) {
    return NextResponse.json({ ok: true });
  }

  await supabaseAdmin
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("user_id", sbUser.id)
    .eq("is_read", false);

  return NextResponse.json({ ok: true });
}
