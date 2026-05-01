import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { supabaseAdmin } from "../../lib/supabase";
import GoProfileClient from "./GoProfileClient";
import OrganizerProfileClient from "./OrganizerProfileClient";

type Props = { params: Promise<{ username: string }> };

const RESERVED = new Set([
  "home", "search", "explore", "events", "e", "go", "organizer", "organizers",
  "dashboard", "api", "admin", "settings", "login", "signup", "sign-in",
  "sign-up", "onboarding", "about", "help", "support", "terms", "privacy",
  "blog", "careers", "press", "null", "undefined", "waitlist", "ad-waitlist",
  "categories",
]);

// Only select columns that are confirmed to exist in the DB.
// New-migration columns (followers_count etc.) are loaded client-side via /api/users/[id]/stats.
const USER_SELECT = `
  id, clerk_id, username, first_name, last_name, bio,
  avatar_url, cover_url, pulse_score, pulse_tier,
  location_city_name, location_city, created_at, interests,
  is_verified_organizer, account_type, twitter_handle
` as const;

async function getUser(username: string) {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select(USER_SELECT)
    .eq("username", username)
    .maybeSingle();

  if (error) console.error("[profile page] user lookup error:", error.message, "username:", username);
  return data;
}

async function getOrganizerProfile(userId: string) {
  const { data } = await supabaseAdmin
    .from("organizer_profiles")
    .select("organization_name, bio, logo_url, website_url, social_links, status, total_events")
    .eq("user_id", userId)
    .maybeSingle();
  return data ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  if (RESERVED.has(username.toLowerCase())) return {};
  const user = await getUser(username);
  if (!user) return { title: "User not found · GoOutside" };

  const name  = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || username;
  const score = user.pulse_score ?? 0;
  const tier  = (user as unknown as Record<string, unknown>).pulse_tier as string ?? "Explorer";

  return {
    title: `${name} on GoOutside`,
    description: `${tier} · Pulse ${score} · gooutside.club/${username}`,
    openGraph: {
      title: `${name} on GoOutside`,
      description: `${tier} · Pulse ${score}`,
      images: user.avatar_url ? [{ url: user.avatar_url }] : [],
      type: "profile",
    },
    twitter: {
      card: "summary",
      title: `${name} on GoOutside`,
      description: `${tier} · Pulse ${score}`,
      images: user.avatar_url ? [user.avatar_url] : [],
    },
  };
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;

  if (RESERVED.has(username.toLowerCase())) notFound();

  const user = await getUser(username);
  if (!user) notFound();

  const u = user as unknown as Record<string, unknown>;

  const isOrganizer =
    u.account_type === "organizer" ||
    u.is_verified_organizer === true;

  const interests: string[] = Array.isArray(u.interests)
    ? (u.interests as string[])
    : [];

  const commonProps = {
    clerkId:            user.clerk_id,
    username:           (u.username as string | null) ?? username,
    name:               `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || username,
    avatarUrl:          (u.avatar_url as string | null) ?? null,
    coverUrl:           (u.cover_url as string | null) ?? null,
    bio:                (u.bio as string | null) ?? null,
    pulseScore:         (u.pulse_score as number | null) ?? 0,
    pulseTier:          (u.pulse_tier as string | null) ?? "Explorer",
    city:               ((u.location_city_name ?? u.location_city) as string | null) ?? null,
    joinedAt:           (u.created_at as string | null) ?? null,
    interests,
    twitterHandle:      (u.twitter_handle as string | null) ?? null,
    isVerifiedOrganizer: u.is_verified_organizer === true,
  };

  if (isOrganizer) {
    const orgProfile = await getOrganizerProfile(user.id);
    return (
      <OrganizerProfileClient
        {...commonProps}
        organizerProfile={orgProfile}
      />
    );
  }

  return <GoProfileClient {...commonProps} />;
}
