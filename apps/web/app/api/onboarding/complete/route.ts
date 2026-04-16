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

  // Upsert user row — handles the case where the Clerk webhook hasn't fired yet
  const { data: sbUser, error: upsertErr } = await supabaseAdmin
    .from("users")
    .upsert(
      {
        clerk_id:            clerk.id,
        email:               clerk.emailAddresses[0]?.emailAddress ?? "",
        first_name:          clerk.firstName ?? "User",
        last_name:           clerk.lastName  ?? "",
        role:                "attendee",
        pulse_score,
        pulse_tier,
        onboarding_complete: true,
        updated_at:          new Date().toISOString(),
      },
      { onConflict: "clerk_id" }
    )
    .select("id")
    .single();

  if (upsertErr || !sbUser) {
    console.error("[/api/onboarding/complete] upsert failed", upsertErr);
    return NextResponse.json({ error: "Failed to save user" }, { status: 500 });
  }

  const userId = sbUser.id as string;

  // Insert pulse_score_history entry (best-effort — table may not exist in all envs)
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
