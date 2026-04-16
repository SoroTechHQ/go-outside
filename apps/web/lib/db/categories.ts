import { supabaseAdmin } from "../supabase";
import { adaptCategory, type DbCategory } from "./adapters";
import type { Category } from "@gooutside/demo-data";

// Full list of active categories ordered by sort_order
export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabaseAdmin
    .from("categories")
    .select("id, name, slug, icon_key, color, is_active, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) { console.error("[getCategories]", error); return []; }
  return (data as DbCategory[]).map(adaptCategory);
}

// Single category by slug
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const { data, error } = await supabaseAdmin
    .from("categories")
    .select("id, name, slug, icon_key, color, is_active, sort_order")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error || !data) return null;
  return adaptCategory(data as DbCategory);
}

// Categories with event counts (for /categories page)
export async function getCategoriesWithCounts(): Promise<(Category & { count: number })[]> {
  const { data, error } = await supabaseAdmin
    .from("categories")
    .select(`
      id, name, slug, icon_key, color, is_active, sort_order,
      events (count)
    `)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) { console.error("[getCategoriesWithCounts]", error); return []; }

  return (data ?? []).map((row: DbCategory & { events: { count: number }[] }) => ({
    ...adaptCategory(row),
    count: row.events?.[0]?.count ?? 0,
  }));
}
