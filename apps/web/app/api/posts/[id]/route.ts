import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../lib/supabase";

type Params = { params: Promise<{ id: string }> };

// DELETE /api/posts/[id]  — soft-delete own post
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const clerk = await currentUser();
  if (!clerk) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("clerk_id", clerk.id)
    .maybeSingle();

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { error } = await supabaseAdmin
    .from("posts")
    .update({ is_deleted: true })
    .eq("id", id)
    .eq("user_id", (user as { id: string }).id);

  if (error) return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
