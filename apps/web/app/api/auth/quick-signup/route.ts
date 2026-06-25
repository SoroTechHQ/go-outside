import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { sendWelcomeEmail } from "../../../../lib/email";

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clerk = await clerkClient();

  // Mark onboarding as complete so they skip the 5-step flow
  // quickSignup: true lets us show "complete your profile" prompts later
  await clerk.users.updateUserMetadata(userId, {
    unsafeMetadata: {
      onboardingComplete: true,
      quickSignup: true,
      onboardingStep: 0,
    },
  });

  // Fetch user details to sync to Supabase and send welcome email
  const clerkUser = await clerk.users.getUser(userId);
  const email = clerkUser.emailAddresses[0]?.emailAddress;
  const firstName = clerkUser.firstName ?? "there";

  // Upsert minimal user record in Supabase (Clerk webhook may not have fired yet)
  if (email) {
    await supabaseAdmin.from("users").upsert(
      {
        clerk_id:   userId,
        email,
        first_name: firstName,
        last_name:  clerkUser.lastName ?? "",
        avatar_url: clerkUser.imageUrl ?? null,
        created_at: new Date().toISOString(),
      },
      { onConflict: "clerk_id", ignoreDuplicates: false },
    );

    // Send welcome email (fire and forget)
    sendWelcomeEmail({ to: email, firstName }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
