import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  getTrendingEvents,
  getTrendingOrganizers,
  getTrendingTopics,
} from "../../../lib/trending/server";
import { supabaseAdmin } from "../../../lib/supabase";
import type { TrendSection, TrendingResponse } from "../../../lib/trending/types";

export const dynamic = "force-dynamic";

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

  // Resolve user's city for location-aware ranking
  let userCity: string | null = null;
  try {
    const { userId: clerkId } = await auth();
    if (clerkId) {
      const { data } = await supabaseAdmin
        .from("users")
        .select("location_city_name")
        .eq("clerk_id", clerkId)
        .maybeSingle();
      userCity = (data as { location_city_name: string | null } | null)?.location_city_name ?? null;
    }
  } catch {
    // non-fatal — trending works without location
  }

  const payload: TrendingResponse = {
    section,
    events: [],
    organizers: [],
    topics: [],
    generated_at: new Date().toISOString(),
    window_hours: 48,
  };

  if (section === "events") {
    payload.events = await getTrendingEvents(limit, true, userCity);
  } else if (section === "organizers") {
    payload.organizers = await getTrendingOrganizers(limit);
  } else {
    payload.topics = await getTrendingTopics(limit);
  }

  return NextResponse.json(payload);
}
