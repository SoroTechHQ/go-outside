import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase";
import { jsonNoStore } from "../../../lib/api-security";

export async function GET() {
  const { data: cats, error } = await supabaseAdmin
    .from("categories")
    .select("id, name, slug, icon_key, color, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) return jsonNoStore({ categories: [] });

  // Get event counts per category from published events
  const { data: counts } = await supabaseAdmin
    .from("events")
    .select("categories(slug)")
    .eq("status", "published")
    .gte("start_datetime", new Date().toISOString());

  const countMap: Record<string, number> = {};
  for (const row of (counts as unknown as Array<{ categories: { slug: string } | null }>) ?? []) {
    const slug = row.categories?.slug;
    if (slug) countMap[slug] = (countMap[slug] ?? 0) + 1;
  }

  const categories = (cats ?? []).map((c: { id: string; name: string; slug: string; icon_key: string; color: string | null; sort_order: number }) => ({
    id:          c.id,
    name:        c.name,
    slug:        c.slug,
    icon_key:    c.icon_key,
    color:       c.color,
    event_count: countMap[c.slug] ?? 0,
  }));

  return jsonNoStore({ categories });
}
