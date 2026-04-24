import { supabaseAdmin } from "./supabase";

export type TopCategory = { slug: string; weight: number };

export type UserGraphContext = {
  userId: string;
  pulseScore: number;
  pulseTier: string | null;
  interests: string[];
  locationCity: string | null;
  bio: string | null;
  recentlySavedEventIds: string[];
  recentlyAttendedTitles: string[];
  topCategories: TopCategory[];
  recentInteractionTypes: string[];
  friendsGoingEventIds: string[];
};

export async function buildUserGraphContext(clerkId: string): Promise<UserGraphContext | null> {
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, pulse_score, pulse_tier, interests, location_city_name, bio")
    .eq("clerk_id", clerkId)
    .maybeSingle();

  if (!user) return null;

  const [edgesResult, vectorResult, ticketsResult] = await Promise.all([
    supabaseAdmin
      .from("graph_edges")
      .select("to_id, edge_type, weight, created_at")
      .eq("from_id", user.id)
      .order("created_at", { ascending: false })
      .limit(120),
    supabaseAdmin
      .from("user_interest_vectors")
      .select("category_weights")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabaseAdmin
      .from("tickets")
      .select("event_id, events!inner(title)")
      .eq("user_id", user.id)
      .limit(15),
  ]);

  const edges = edgesResult.data ?? [];

  const recentlySavedEventIds = edges
    .filter((e) => e.edge_type === "save")
    .map((e) => e.to_id)
    .slice(0, 10);

  const categoryWeights =
    (vectorResult.data?.category_weights as Record<string, number> | null) ?? {};
  const topCategories: TopCategory[] = Object.entries(categoryWeights)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([slug, weight]) => ({ slug, weight }));

  const recentlyAttendedTitles = (ticketsResult.data ?? [])
    .map((t) => (t.events as unknown as { title: string } | null)?.title)
    .filter((t): t is string => Boolean(t));

  const recentInteractionTypes = [
    ...new Set(
      edges
        .filter((e) =>
          ["card_click", "card_long_dwell", "save", "ticket_intent", "registered"].includes(
            e.edge_type,
          ),
        )
        .slice(0, 40)
        .map((e) => e.edge_type),
    ),
  ];

  const friendIds = edges
    .filter((e) => e.edge_type === "friends" || e.edge_type === "follows")
    .map((e) => e.to_id)
    .slice(0, 25);

  let friendsGoingEventIds: string[] = [];
  if (friendIds.length > 0) {
    const { data: friendTickets } = await supabaseAdmin
      .from("tickets")
      .select("event_id")
      .in("user_id", friendIds)
      .limit(30);
    friendsGoingEventIds = [
      ...new Set((friendTickets ?? []).map((t) => t.event_id).filter(Boolean)),
    ];
  }

  const effectiveTopCategories =
    topCategories.length > 0
      ? topCategories
      : (user.interests ?? []).map((interest: string) => ({ slug: interest, weight: 1.0 }));

  return {
    userId: user.id,
    pulseScore: user.pulse_score ?? 0,
    pulseTier: user.pulse_tier,
    interests: user.interests ?? [],
    locationCity: user.location_city_name,
    bio: user.bio,
    recentlySavedEventIds,
    recentlyAttendedTitles,
    topCategories: effectiveTopCategories,
    recentInteractionTypes,
    friendsGoingEventIds,
  };
}

export function buildPersonalizedSystemPrompt(ctx: UserGraphContext | null): string {
  const ghTime = new Date().toLocaleString("en-GH", {
    weekday: "long",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Africa/Accra",
  });

  const base = `You are GoOutside's AI assistant for event discovery in Ghana — Accra, Kumasi, and Takoradi.
Help users find events based on their mood, schedule, interests, and social graph.
Current time in Accra: ${ghTime}.
Be conversational, warm, and direct — 2-4 sentences max.
Only recommend events from the provided CANDIDATES list. Never invent event details.
Prices are in GHS. When recommending, explain WHY it fits this specific user's history and interests.
Respond ONLY with valid JSON: { "message": "...", "picks": [{"event_id":"...", "reason":"..."}], "followUps": ["...","...","..."] }
Keep picks to 0–4 events. followUps should be 3 short natural follow-up questions.`;

  if (!ctx) return base;

  const lines: string[] = [];
  if (ctx.pulseTier) lines.push(`Pulse tier: ${ctx.pulseTier} (score: ${ctx.pulseScore})`);
  if (ctx.locationCity) lines.push(`Based in: ${ctx.locationCity}`);
  if (ctx.interests.length > 0) lines.push(`Stated interests: ${ctx.interests.join(", ")}`);
  if (ctx.topCategories.length > 0)
    lines.push(`Top engaged categories: ${ctx.topCategories.map((c) => c.slug).join(", ")}`);
  if (ctx.recentlyAttendedTitles.length > 0)
    lines.push(`Recently attended: ${ctx.recentlyAttendedTitles.slice(0, 4).join("; ")}`);
  if (ctx.recentlySavedEventIds.length > 0)
    lines.push(`Has ${ctx.recentlySavedEventIds.length} saved events`);
  if (ctx.friendsGoingEventIds.length > 0)
    lines.push(`${ctx.friendsGoingEventIds.length} events have friends already going`);
  if (
    ctx.recentInteractionTypes.includes("ticket_intent") ||
    ctx.recentInteractionTypes.includes("registered")
  )
    lines.push("Actively buys tickets");

  return `${base}\n\nUSER PROFILE:\n${lines.join("\n")}`;
}

export function formatEventsForPrompt(
  events: Array<{
    id: string;
    title: string;
    start_datetime: string;
    price_label: string;
    venue_name: string | null;
    city: string | null;
    category_name: string | null;
    short_description: string;
    friendsGoing?: boolean;
    userSaved?: boolean;
  }>,
): string {
  if (events.length === 0) return "No events available.";
  return events
    .map((e, i) => {
      const date = new Date(e.start_datetime).toLocaleDateString("en-GH", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      const extras = [e.friendsGoing ? "friends going" : null, e.userSaved ? "you saved this" : null]
        .filter(Boolean)
        .join(", ");
      return (
        `${i + 1}. [id:${e.id}] "${e.title}" — ${date}, ${e.price_label}, ` +
        `${e.venue_name ?? e.city ?? "Accra"}, ${e.category_name ?? "event"}` +
        (extras ? ` (${extras})` : "") +
        (e.short_description ? `\n   ${e.short_description.slice(0, 100)}` : "")
      );
    })
    .join("\n");
}
