import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { supabaseAdmin } from "../../../lib/supabase";
import GoProfileClient from "./GoProfileClient";

type Props = { params: Promise<{ username: string }> };

async function getUser(username: string) {
  const { data } = await supabaseAdmin
    .from("users")
    .select("clerk_id, first_name, last_name, username, bio, avatar_url, pulse_score, pulse_tier, location_city_name, created_at")
    .eq("username", username)
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const user = await getUser(username);
  if (!user) return { title: "User not found · GoOutside" };

  const name = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || username;
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
  const user = await getUser(username);

  if (!user) notFound();

  // If the user has a clerk_id, pass it through; the client page uses it for follow/message
  return (
    <GoProfileClient
      clerkId={user.clerk_id}
      username={username}
      name={`${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || username}
      avatarUrl={user.avatar_url ?? null}
      bio={user.bio ?? null}
      pulseScore={user.pulse_score ?? 0}
      pulseTier={user.pulse_tier ?? "Explorer"}
      city={user.location_city_name ?? null}
      joinedAt={user.created_at ?? null}
    />
  );
}
