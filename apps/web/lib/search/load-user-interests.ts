import { supabaseAdmin } from "../supabase";
import type { UserInterests } from "./types";

export async function loadUserInterests(clerkId: string): Promise<UserInterests | null> {
  try {
    const { data } = await supabaseAdmin
      .from("users")
      .select("vibe, interests, pulse_score, city")
      .eq("clerk_id", clerkId)
      .single();

    if (!data) return null;

    const vibe = (data.vibe as { categories?: string[] } | null) ?? {};
    const topCategories = (vibe.categories ?? []).slice(0, 5);
    const interests = ((data.interests as string[] | null) ?? []).slice(0, 10);
    const pulseScore = (data.pulse_score as number | null) ?? 0;
    const city = (data.city as string | null) ?? undefined;

    return { topCategories, interests, pulseScore, city };
  } catch {
    return null;
  }
}
