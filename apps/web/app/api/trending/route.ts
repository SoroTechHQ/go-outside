import { NextRequest, NextResponse } from "next/server";
import {
  getTrendingEvents,
  getTrendingOrganizers,
  getTrendingTopics,
} from "../../../lib/trending/server";
import type { TrendSection, TrendingResponse } from "../../../lib/trending/types";

export const revalidate = 1800;

function isSection(value: string | null): value is TrendSection {
  return value === "events" || value === "organizers" || value === "topics";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawSection = searchParams.get("section");
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 20), 1), 50);

  if (rawSection && !isSection(rawSection)) {
    return NextResponse.json({ error: "Invalid section" }, { status: 400 });
  }

  const section: TrendSection = isSection(rawSection) ? rawSection : "events";

  const payload: TrendingResponse = {
    section,
    events: [],
    organizers: [],
    topics: [],
    generated_at: new Date().toISOString(),
    window_hours: 48,
  };

  if (section === "events") {
    payload.events = await getTrendingEvents(limit, true);
  } else if (section === "organizers") {
    payload.organizers = await getTrendingOrganizers(limit);
  } else {
    payload.topics = await getTrendingTopics(limit);
  }

  return NextResponse.json(payload);
}
