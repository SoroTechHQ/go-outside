import { supabaseAdmin } from "../supabase";
import type { UserRow } from "./types";

const USER_SELECT =
  "clerk_id, first_name, last_name, username, avatar_url, pulse_tier, pulse_score";

function safeLike(s: string): string {
  return s.replace(/[%_]/g, "\\$&");
}

export async function searchUsers(opts: {
  q: string;
  limit: number;
  offset: number;
}): Promise<UserRow[]> {
  const { q, limit, offset } = opts;

  if (!q) return [];

  const safe = safeLike(q);

  // Short query: prefix match on username / first name
  if (q.length <= 2) {
    const { data } = await supabaseAdmin
      .from("users")
      .select(USER_SELECT)
      .or(`username.ilike.${safe}%,first_name.ilike.${safe}%`)
      .range(offset, offset + limit - 1);
    return (data ?? []) as UserRow[];
  }

  // Try full-text search first
  const { data: ftsData, error: ftsError } = await supabaseAdmin
    .from("users")
    .select(USER_SELECT)
    .textSearch("search_vector", q, { type: "websearch", config: "english" })
    .range(offset, offset + limit - 1);

  if (!ftsError && ftsData && ftsData.length > 0) {
    return ftsData as UserRow[];
  }

  // Fallback: separate ilike queries (avoid raw .or() with user text)
  const [unameRes, firstRes, lastRes] = await Promise.all([
    supabaseAdmin
      .from("users")
      .select(USER_SELECT)
      .ilike("username", `%${safe}%`)
      .limit(limit),
    supabaseAdmin
      .from("users")
      .select(USER_SELECT)
      .ilike("first_name", `%${safe}%`)
      .limit(limit),
    supabaseAdmin
      .from("users")
      .select(USER_SELECT)
      .ilike("last_name", `%${safe}%`)
      .limit(limit),
  ]);

  const seen = new Set<string>();
  const merged: UserRow[] = [];
  for (const row of [
    ...(unameRes.data ?? []),
    ...(firstRes.data ?? []),
    ...(lastRes.data ?? []),
  ]) {
    const r = row as UserRow;
    if (!seen.has(r.clerk_id)) { seen.add(r.clerk_id); merged.push(r); }
  }

  return merged.slice(offset, offset + limit);
}
