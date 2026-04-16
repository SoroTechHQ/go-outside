import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../lib/supabase";

export async function GET() {
  const clerk = await currentUser();
  if (!clerk) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("clerk_id", clerk.id)
    .maybeSingle();

  if (error || !data) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const clerk = await currentUser();
  if (!clerk) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as Record<string, unknown>;

  // Whitelist updatable fields
  const allowed = [
    "first_name", "last_name", "username", "bio", "phone",
    "location_city", "interests", "vibe",
    "pulse_score", "pulse_tier", "onboarding_complete",
    "avatar_url",
  ] as const;

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  const { data, error } = await supabaseAdmin
    .from("users")
    .update(updates)
    .eq("clerk_id", clerk.id)
    .select("*")
    .single();

  if (error) {
    console.error("[PATCH /api/users/me]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
