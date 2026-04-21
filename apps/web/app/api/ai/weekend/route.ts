import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY_PROD_1 ?? process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  const clerk = await currentUser();
  if (!clerk) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { message } = await req.json() as { message: string };
  if (!message) return NextResponse.json({ error: "message required" }, { status: 400 });

  // Fetch user profile
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, pulse_score, pulse_tier, interests, location_city_name")
    .eq("clerk_id", clerk.id)
    .maybeSingle();

  const profile = user as {
    id: string; pulse_score: number; pulse_tier: string;
    interests: string[] | null; location_city_name: string | null;
  } | null;

  // Fetch top 20 upcoming events (next 7 days)
  const now  = new Date().toISOString();
  const week = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: events } = await supabaseAdmin
    .from("events")
    .select("id, title, slug, category, price_min, start_datetime, venue_name, banner_url, organizers(name)")
    .gte("start_datetime", now)
    .lte("start_datetime", week)
    .eq("is_published", true)
    .order("start_datetime", { ascending: true })
    .limit(20);

  type RawEvent = {
    id: string; title: string; slug: string; category: string;
    price_min: number | null; start_datetime: string; venue_name: string | null;
    banner_url: string | null; organizers: unknown;
  };
  const eventList = (events as RawEvent[] ?? [])
    .map((e) => {
      const date  = new Date(e.start_datetime).toLocaleDateString("en-GH", { weekday: "short", month: "short", day: "numeric" });
      const price = e.price_min === 0 ? "Free" : e.price_min ? `GHS ${e.price_min}` : "TBA";
      return `- "${e.title}" | ${e.category} | ${date} | ${price} | ${e.venue_name ?? "Accra"} | ID:${e.id}`;
    })
    .join("\n");

  const interests = (profile?.interests ?? []).slice(0, 5).join(", ") || "Various";

  const systemPrompt = `You are GoOutside's AI assistant for Accra, Ghana's nightlife and events scene.
The user is asking what to do this weekend. Pick exactly 3 events from the list provided that best match their request and profile.

Format your response as JSON with this exact shape:
{
  "intro": "one short intro sentence",
  "picks": [
    { "event_id": "<ID>", "title": "<title>", "reason": "<one sentence why>" },
    { "event_id": "<ID>", "title": "<title>", "reason": "<one sentence why>" },
    { "event_id": "<ID>", "title": "<title>", "reason": "<one sentence why>" }
  ]
}

Only pick from the provided event list. Be specific and culturally aware.`;

  const userMessage = `User profile: ${profile?.pulse_tier ?? "Explorer"} (${profile?.pulse_score ?? 0} pts), interests: ${interests}

User said: "${message}"

Available events this week:
${eventList || "No events found this week."}`;

  try {
    const completion = await groq.chat.completions.create({
      model:       "llama3-8b-8192",
      messages:    [{ role: "system", content: systemPrompt }, { role: "user", content: userMessage }],
      max_tokens:  500,
      temperature: 0.8,
      response_format: { type: "json_object" },
    });

    const raw  = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as {
      intro: string;
      picks: { event_id: string; title: string; reason: string }[];
    };

    // Enrich picks with full event data
    const pickIds = parsed.picks?.map((p) => p.event_id).filter(Boolean) ?? [];
    const eventMap = new Map(
      (events as RawEvent[] ?? []).map((e) => [e.id, e])
    );

    const enrichedPicks = (parsed.picks ?? []).map((pick) => ({
      ...pick,
      event: eventMap.get(pick.event_id) ?? null,
    }));

    return NextResponse.json({ intro: parsed.intro, picks: enrichedPicks });
  } catch (err) {
    console.error("[POST /api/ai/weekend]", err);
    return NextResponse.json({
      intro: "Here are some great options for your weekend!",
      picks: [],
    });
  }
}
