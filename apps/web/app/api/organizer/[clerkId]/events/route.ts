import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clerkId: string }> }
) {
  const { clerkId } = await params;
  const filter = (req.nextUrl.searchParams.get("filter") ?? "upcoming") as "upcoming" | "past";

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("clerk_id", clerkId)
    .maybeSingle();

  if (!user) return NextResponse.json({ events: [] });

  const now = new Date().toISOString();

  let query = supabaseAdmin
    .from("events")
    .select(
      "id, title, slug, banner_url, start_datetime, end_datetime, tickets_sold, total_capacity, price_label, status"
    )
    .eq("organizer_id", user.id)
    .eq("status", "published");

  if (filter === "upcoming") {
    query = query.gte("start_datetime", now).order("start_datetime", { ascending: true });
  } else {
    query = query.lt("start_datetime", now).order("start_datetime", { ascending: false });
  }

  const { data } = await query.limit(20);
  return NextResponse.json({ events: data ?? [] });
}
