import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabase";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id: clerkId } = await params;

  // Get internal user id
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("clerk_id", clerkId)
    .maybeSingle();

  if (!user) return NextResponse.json({ events: [] });

  // Events they have tickets for (attended)
  const { data: tickets } = await supabaseAdmin
    .from("tickets")
    .select("event_id")
    .eq("user_id", user.id)
    .limit(20);

  if (!tickets || tickets.length === 0) return NextResponse.json({ events: [] });

  const eventIds = tickets.map((t: { event_id: string }) => t.event_id);

  const { data: events } = await supabaseAdmin
    .from("events")
    .select("id, title, slug, banner_url, start_datetime")
    .in("id", eventIds)
    .order("start_datetime", { ascending: false });

  return NextResponse.json({ events: events ?? [] });
}
