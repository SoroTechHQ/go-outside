import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../supabase";

export type SupabaseUser = {
  id:                string;
  clerk_id:          string;
  email:             string;
  first_name:        string;
  last_name:         string;
  avatar_url:        string | null;
  role:              "admin" | "organizer" | "attendee";
  interests:         string[];
  location_city:     string | null;
  pulse_score:       number | null;
  pulse_tier:        string | null;
  onboarding_complete: boolean | null;
};

/**
 * Returns the current Clerk user's Supabase record.
 * Creates the record on first call if it doesn't exist yet.
 * Returns null if the user is not signed in.
 */
export async function getOrCreateSupabaseUser(): Promise<SupabaseUser | null> {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  // Try to find existing record
  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("clerk_id", clerkUser.id)
    .maybeSingle();

  if (existing) return existing as SupabaseUser;

  // Create new Supabase user record from Clerk data
  const primaryEmail = clerkUser.emailAddresses.find(
    (e) => e.id === clerkUser.primaryEmailAddressId
  );

  const { data: created, error } = await supabaseAdmin
    .from("users")
    .insert({
      clerk_id:   clerkUser.id,
      email:      primaryEmail?.emailAddress ?? "",
      first_name: clerkUser.firstName ?? "User",
      last_name:  clerkUser.lastName ?? "",
      avatar_url: clerkUser.imageUrl ?? null,
      role:       "attendee",
    })
    .select("*")
    .single();

  if (error) {
    console.error("[getOrCreateSupabaseUser]", error);
    return null;
  }

  return created as SupabaseUser;
}

// Lightweight lookup — just the ID (useful for joins without full profile)
export async function getSupabaseUserIdByClerkId(clerkId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("clerk_id", clerkId)
    .maybeSingle();
  return data?.id ?? null;
}
