import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json({ venues: [] });

  const { data, error } = await supabaseAdmin
    .from("venues")
    .select("id, name, city, address")
    .or(`name.ilike.%${q}%,city.ilike.%${q}%`)
    .limit(8);

  if (error) return NextResponse.json({ venues: [] });

  return NextResponse.json({ venues: data ?? [] });
}
