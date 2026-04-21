import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase";

export const revalidate = 1800; // recompute every 30 min via ISR

type Section = "events" | "organizers" | "topics";

const WINDOW_HOURS = 48;
const TIME_DECAY: { maxHours: number; factor: number }[] = [
  { maxHours: 6,  factor: 1.5 },
  { maxHours: 24, factor: 1.0 },
  { maxHours: 48, factor: 0.6 },
];

function getDecayFactor(createdAt: string): number {
  const ageHours = (Date.now() - new Date(createdAt).getTime()) / 3_600_000;
  for (const { maxHours, factor } of TIME_DECAY) {
    if (ageHours <= maxHours) return factor;
  }
  return 0.6;
}

const EDGE_WEIGHTS: Record<string, number> = {
  card_view:       1.0,
  viewed:          1.0,
  save:            3.0,
  saved:           3.0,
  share:           4.0,
  shared:          4.0,
  ticket_intent:   8.0,
  snippet_post:    5.0,
  checkin:         6.0,
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const section = (searchParams.get("section") ?? "events") as Section;
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 50);

  const since = new Date(Date.now() - WINDOW_HOURS * 3_600_000).toISOString();

  if (section === "events") {
    const { data: edges } = await supabaseAdmin
      .from("graph_edges")
      .select("to_id, edge_type, weight, created_at")
      .eq("to_type", "event")
      .gte("created_at", since);

    if (!edges?.length) {
      const { data: events } = await supabaseAdmin
        .from("events")
        .select("id, title, slug, banner_url, start_datetime, price_label, trending_score")
        .eq("is_published", true)
        .order("trending_score", { ascending: false })
        .limit(limit);
      return NextResponse.json({ section, events: events ?? [], topics: [], organizers: [] });
    }

    const scores: Record<string, number> = {};
    for (const edge of edges) {
      const w = EDGE_WEIGHTS[edge.edge_type] ?? 1.0;
      const decay = getDecayFactor(edge.created_at);
      scores[edge.to_id] = (scores[edge.to_id] ?? 0) + w * decay;
    }

    const topIds = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id);

    const { data: events } = await supabaseAdmin
      .from("events")
      .select("id, title, slug, banner_url, start_datetime, price_label, trending_score")
      .in("id", topIds)
      .eq("is_published", true);

    const sorted = (events ?? []).sort(
      (a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0),
    );

    await supabaseAdmin
      .from("events")
      .upsert(
        sorted.map((e) => ({
          id: e.id,
          trending_score: Math.round(scores[e.id] ?? 0),
          trending_updated_at: new Date().toISOString(),
        })),
        { onConflict: "id" },
      )
      .select("id");

    return NextResponse.json({ section, events: sorted, topics: [], organizers: [] });
  }

  if (section === "organizers") {
    const { data: edges } = await supabaseAdmin
      .from("graph_edges")
      .select("to_id, edge_type, created_at")
      .eq("to_type", "organizer")
      .gte("created_at", since);

    const scores: Record<string, number> = {};
    for (const edge of edges ?? []) {
      const w = edge.edge_type === "follows" ? 3.0 : 1.0;
      const decay = getDecayFactor(edge.created_at);
      scores[edge.to_id] = (scores[edge.to_id] ?? 0) + w * decay;
    }

    const topIds = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id);

    if (!topIds.length) {
      const { data: orgs } = await supabaseAdmin
        .from("organizers")
        .select("id, name, logo_url, follower_count")
        .limit(limit);
      return NextResponse.json({ section, events: [], topics: [], organizers: orgs ?? [] });
    }

    const { data: orgs } = await supabaseAdmin
      .from("organizers")
      .select("id, name, logo_url, follower_count")
      .in("id", topIds);

    const sorted = (orgs ?? []).sort(
      (a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0),
    );

    return NextResponse.json({ section, events: [], topics: [], organizers: sorted });
  }

  if (section === "topics") {
    const { data: snippets } = await supabaseAdmin
      .from("snippets")
      .select("vibe_tags")
      .gte("created_at", since);

    const tagCounts: Record<string, number> = {};
    for (const snippet of snippets ?? []) {
      for (const tag of snippet.vibe_tags ?? []) {
        tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
      }
    }

    const topics = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([tag, count]) => ({ tag, count }));

    return NextResponse.json({ section, events: [], topics, organizers: [] });
  }

  return NextResponse.json({ error: "Invalid section" }, { status: 400 });
}
