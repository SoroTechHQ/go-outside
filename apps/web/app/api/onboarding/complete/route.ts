import { NextRequest, NextResponse } from "next/server";
import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { humanizeDbError } from "../../../../lib/db-errors";

const COOKIE_OPTS = {
  path:     "/",
  sameSite: "lax" as const,
  secure:   process.env.NODE_ENV === "production",
  maxAge:   30 * 24 * 60 * 60, // 30 days
};

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
    .select("id, location_city, interests, vibe")
    .single();

  if (upsertErr || !sbUser) {
    console.error("[/api/onboarding/complete] upsert failed", upsertErr);
    if (upsertErr) {
      const { message, status } = humanizeDbError(upsertErr);
      return NextResponse.json({ error: message }, { status });
    }
    return NextResponse.json({ error: "Failed to finalise your profile. Please try again." }, { status: 500 });
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

  // Build response and set cookies
  const res = NextResponse.json({ ok: true });

  // go_done — HttpOnly, read by /home server component to skip Clerk round-trip
  res.cookies.set("go_done", "1", { ...COOKIE_OPTS, httpOnly: true });

  // go_prefs — client-readable, used by feed for instant personalization
  const prefs = {
    city:      (sbUser as Record<string, unknown>).location_city as string ?? "",
    interests: ((sbUser as Record<string, unknown>).interests as string[]) ?? [],
    vibe:      ((sbUser as Record<string, unknown>).vibe as Record<string, unknown> | null) ?? null,
    score:     pulse_score,
    tier:      pulse_tier,
  };
  res.cookies.set("go_prefs", JSON.stringify(prefs), { ...COOKIE_OPTS, httpOnly: false });

  return res;
}
