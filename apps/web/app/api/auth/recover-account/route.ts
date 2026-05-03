import { NextResponse } from "next/server";
import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../lib/supabase";

/**
 * Checks whether the current Clerk session belongs to a user who already has
 * a complete Supabase account under the same email (e.g. they previously signed
 * up with email/password and are now signing in via OAuth with the same email).
 *
 * If found:
 *   - Re-links the Supabase row to the new Clerk ID
 *   - Marks onboardingComplete in Clerk metadata
 *   - Returns { recovered: true }
 *
 * If not found (genuinely new user):
 *   - Returns { recovered: false }
 */
export async function POST() {
  const clerk = await currentUser();
  if (!clerk) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // If Clerk already knows this user is complete, nothing to do
  if (clerk.unsafeMetadata?.onboardingComplete === true) {
    return NextResponse.json({ recovered: false, alreadyComplete: true });
  }

  const email = clerk.emailAddresses[0]?.emailAddress;
  if (!email) return NextResponse.json({ recovered: false });

  // Look up by email — may find a row with a different clerk_id
  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("id, clerk_id, onboarding_complete, location_city, interests, vibe, pulse_score, pulse_tier")
    .eq("email", email)
    .maybeSingle();

  if (!existing) return NextResponse.json({ recovered: false });

  // Adopt: re-link the existing row to the current Clerk session
  await supabaseAdmin
    .from("users")
    .update({ clerk_id: clerk.id, updated_at: new Date().toISOString() })
    .eq("id", existing.id);

  const wasComplete = Boolean((existing as Record<string, unknown>).onboarding_complete);

  if (wasComplete) {
    const client = await clerkClient();
    await client.users.updateUserMetadata(clerk.id, {
      unsafeMetadata: {
        ...(clerk.unsafeMetadata ?? {}),
        onboardingComplete: true,
        onboardingStep: 5,
      },
    });
  }

  return NextResponse.json({ recovered: true, wasComplete });
}
