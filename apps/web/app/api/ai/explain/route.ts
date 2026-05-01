import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY_PROD_1 ?? process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  const clerk = await currentUser();
  if (!clerk) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId } = await req.json() as { eventId: string };
  if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 });

  // Check cache first
  const cacheKey = `ai_explain:${clerk.id}:${eventId}`;
  const { data: cached } = await supabaseAdmin
    .from("recommendation_cache")
    .select("ai_explanation, expires_at")
    .eq("user_id", clerk.id)
    .eq("section", cacheKey)
    .maybeSingle();

  if (cached?.ai_explanation && cached.expires_at && new Date(cached.expires_at) > new Date()) {
    return NextResponse.json({ explanation: cached.ai_explanation });
  }

  // Fetch user profile + event in parallel
  const [userResult, eventResult] = await Promise.all([
    supabaseAdmin
      .from("users")
      .select("id, pulse_score, pulse_tier, interests, location_city_name")
      .eq("clerk_id", clerk.id)
      .maybeSingle(),
    supabaseAdmin
      .from("events")
      .select("id, title, category, tags, description, price_min, organizer_id, organizers(name)")
      .eq("id", eventId)
      .maybeSingle(),
  ]);

  const user  = userResult.data as {
    id: string; pulse_score: number; pulse_tier: string;
    interests: string[] | null; location_city_name: string | null;
  } | null;
  const event = eventResult.data as {
    id: string; title: string; category: string; tags: string[] | null;
    description: string | null; price_min: number | null;
    organizers: { name: string } | null;
  } | null;

  if (!user || !event) {
    return NextResponse.json({ explanation: "This event looks like a great match for your vibe!" });
  }

  // Fetch recent events user has attended
  const { data: recentTickets } = await supabaseAdmin
    .from("tickets")
    .select("events(title, category)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const recentEvents = (recentTickets ?? [])
    .map((t: { events: unknown }) => {
      const ev = Array.isArray(t.events) ? t.events[0] : t.events;
      return (ev as { title?: string } | null)?.title;
    })
    .filter(Boolean)
    .join(", ") || "None yet";

  const interests = (user.interests ?? []).slice(0, 5).join(", ") || "Various";
  const tags = (event.tags ?? []).join(", ") || event.category;
  const orgRaw = event.organizers;
  const organizer = (Array.isArray(orgRaw) ? (orgRaw[0] as { name?: string } | undefined)?.name : (orgRaw as { name?: string } | null)?.name) ?? "Independent";

  const systemPrompt = `You are GoOutside's recommendation engine for Accra, Ghana.
Explain in exactly 2 short, punchy sentences why a specific event matches a user's profile.
Be conversational and specific — sound like a friend who knows their taste.
No generic phrases. Reference their actual data.`;

  const userMessage = `User: ${user.pulse_tier} (${user.pulse_score} pts), interests: ${interests}, recent events: ${recentEvents}, city: ${user.location_city_name ?? "Accra"}

Event: "${event.title}" | Category: ${event.category} | Tags: ${tags} | By: ${organizer}${event.price_min !== null ? ` | GHS ${event.price_min}` : ""}

Explain in 2 sentences why this is a great match.`;

  try {
    const completion = await groq.chat.completions.create({
      model:       "llama-3.1-8b-instant",
      messages:    [{ role: "system", content: systemPrompt }, { role: "user", content: userMessage }],
      max_tokens:  120,
      temperature: 0.7,
    });

    const explanation = completion.choices[0]?.message?.content?.trim() ?? "Looks like a great match for your scene!";

    // Cache for 1 hour
    await supabaseAdmin
      .from("recommendation_cache")
      .upsert(
        {
          user_id:        clerk.id,
          section:        cacheKey,
          ai_explanation: explanation,
          expires_at:     new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          score:          1,
          event_id:       eventId,
        },
        { onConflict: "user_id,section" }
      );

    return NextResponse.json({ explanation });
  } catch (err) {
    console.error("[POST /api/ai/explain]", err);
    return NextResponse.json({ explanation: "Looks like a great match for your scene!" });
  }
}
