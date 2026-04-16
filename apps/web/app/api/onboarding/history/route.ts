import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../lib/supabase";

interface PastEventEntry {
  id?:      string;   // UUID if it matches a real event in our DB
  name:     string;
  category: string;
  year:     number;
}

export async function POST(req: NextRequest) {
  const clerk = await currentUser();
  if (!clerk) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { events } = await req.json() as { events: PastEventEntry[] };
  if (!Array.isArray(events) || events.length === 0) {
    return NextResponse.json({ ok: true, written: 0 });
  }

  // Resolve Supabase user
  const { data: sbUser } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("clerk_id", clerk.id)
    .maybeSingle();

  if (!sbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const userId = sbUser.id as string;

  // Write to onboarding_past_events
  const pastRows = events.map((e) => ({
    user_id:    userId,
    event_name: e.name,
    event_id:   e.id ?? null,
    category:   e.category,
    year:       e.year,
  }));

  await supabaseAdmin
    .from("onboarding_past_events")
    .upsert(pastRows, { onConflict: "user_id,event_name" });

  // Write graph_edges for events that have a real UUID in our DB
  const edgeRows = events
    .filter((e) => e.id)
    .map((e) => ({
      from_id:   userId,
      from_type: "user",
      to_id:     e.id!,
      to_type:   "event",
      edge_type: "registered",
      weight:    6.0,
      source:    "onboarding_history",
      is_active: true,
    }));

  if (edgeRows.length > 0) {
    await supabaseAdmin
      .from("graph_edges")
      .upsert(edgeRows, { onConflict: "from_id,to_id,edge_type" });
  }

  return NextResponse.json({ ok: true, written: pastRows.length });
}
