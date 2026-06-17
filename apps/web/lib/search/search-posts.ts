import { supabaseAdmin } from "../supabase";
import type { PostRow } from "./types";

function safeLike(s: string): string {
  return s.replace(/[%_]/g, "\\$&");
}

export async function searchPosts(opts: {
  q: string;
  limit: number;
  offset: number;
}): Promise<PostRow[]> {
  const { q, limit, offset } = opts;

  if (!q) return [];

  // Full-text search on snippets
  const { data, error } = await supabaseAdmin
    .from("snippets")
    .select("id, body, vibe_tags, created_at")
    .textSearch("search_vector", q, { type: "websearch", config: "english" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (!error || (!error.message?.includes("search_vector") && !error.message?.includes("column"))) {
    if (data && data.length > 0) return data as PostRow[];
  }

  // Fallback: body ilike
  const { data: fallback } = await supabaseAdmin
    .from("snippets")
    .select("id, body, vibe_tags, created_at")
    .ilike("body", `%${safeLike(q)}%`)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return (fallback ?? []) as PostRow[];
}
