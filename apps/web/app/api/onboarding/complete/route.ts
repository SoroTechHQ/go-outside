import { NextRequest, NextResponse } from "next/server";
import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../lib/supabase";

export async function POST(req: NextRequest) {
  const clerk = await currentUser();
  if (!clerk) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { pulse_score, pulse_tier } = await req.json() as {
    pulse_score: number;
    pulse_tier:  string;
  };

  // Resolve Supabase user
  const { data: sbUser } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("clerk_id", clerk.id)
    .maybeSingle();

  if (!sbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const userId = sbUser.id as string;

  // Update user record
  await supabaseAdmin
    .from("users")
    .update({
      pulse_score,
      pulse_tier,
      onboarding_complete: true,
      updated_at:          new Date().toISOString(),
    })
    .eq("id", userId);

  // Insert pulse_score_history entry
  await supabaseAdmin
    .from("pulse_score_history")
    .insert({
      user_id: userId,
      delta:   pulse_score,
      reason:  "onboarding_completion",
    });

  // Mark onboarding complete in Clerk metadata
  const client = await clerkClient();
  await client.users.updateUserMetadata(clerk.id, {
    unsafeMetadata: {
      ...(clerk.unsafeMetadata ?? {}),
      onboardingComplete: true,
      onboardingStep:     5,
    },
  });

  return NextResponse.json({ ok: true });
}
