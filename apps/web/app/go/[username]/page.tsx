import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { supabaseAdmin } from "../../../lib/supabase";
import GoProfileClient from "./GoProfileClient";

type Props = { params: Promise<{ username: string }> };

async function getUser(username: string) {
  const { data } = await supabaseAdmin
    .from("users")
    .select("clerk_id, first_name, last_name, username, bio, avatar_url, cover_url, pulse_score, pulse_tier, location_city_name, created_at, interests")
    .eq("username", username)
    .maybeSingle();
  return data;
}

async function getProfileStats(clerkId: string) {
  // Events attended (tickets or checkins)
  const { count: eventsCount } = await supabaseAdmin
    .from("tickets")
    .select("id", { count: "exact", head: true })
    .eq("clerk_id", clerkId);

  // Followers / following — graceful fallback if follows table doesn't exist yet
  let followersCount = 0;
  let followingCount = 0;
  try {
    const { count: fwrs } = await supabaseAdmin
      .from("follows")
      .select("follower_id", { count: "exact", head: true })
      .eq("following_id", clerkId);
    followersCount = fwrs ?? 0;

    const { count: fwng } = await supabaseAdmin
      .from("follows")
      .select("following_id", { count: "exact", head: true })
      .eq("follower_id", clerkId);
    followingCount = fwng ?? 0;
  } catch {
    // follows table may not exist until migration 010 is applied
  }

  return {
    eventsAttended: eventsCount ?? 0,
    followersCount,
    followingCount,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const user = await getUser(username);
  if (!user) return { title: "User not found · GoOutside" };

  const name  = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || username;
  const score = user.pulse_score ?? 0;
  const tier  = user.pulse_tier  ?? "Explorer";

  return {
    title: `${name} on GoOutside`,
    description: `Pulse Score: ${score} · ${tier} · gooutside.club/go/${username}`,
    openGraph: {
      title: `${name} on GoOutside`,
      description: `Pulse Score: ${score} · ${tier}`,
      images: user.avatar_url ? [{ url: user.avatar_url }] : [],
      type: "profile",
    },
    twitter: {
      card: "summary",
      title: `${name} on GoOutside`,
      description: `Pulse Score: ${score} · ${tier}`,
      images: user.avatar_url ? [user.avatar_url] : [],
    },
  };
}

export default async function GoUserProfilePage({ params }: Props) {
  const { username } = await params;
  const [user, stats] = await Promise.all([
    getUser(username),
    // Stats are fetched in parallel; ok to fail silently
    getUser(username).then((u) => u ? getProfileStats(u.clerk_id) : { eventsAttended: 0, followersCount: 0, followingCount: 0 }),
  ]);

  if (!user) notFound();

  const interests: string[] = Array.isArray(user.interests) ? user.interests as string[] : [];

  return (
    <GoProfileClient
      clerkId={user.clerk_id}
      username={username}
      name={`${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || username}
      avatarUrl={user.avatar_url ?? null}
      coverUrl={(user as { cover_url?: string | null }).cover_url ?? null}
      bio={user.bio ?? null}
      pulseScore={user.pulse_score ?? 0}
      pulseTier={user.pulse_tier ?? "Explorer"}
      city={(user as { location_city_name?: string | null }).location_city_name ?? null}
      joinedAt={user.created_at ?? null}
      interests={interests}
      eventsAttended={stats.eventsAttended}
      followersCount={stats.followersCount}
      followingCount={stats.followingCount}
    />
  );
}
