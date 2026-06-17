import { supabaseAdmin } from "../supabase";
import type { UserRow } from "./types";

const USER_SELECT =
  "clerk_id, first_name, last_name, username, avatar_url, pulse_tier, pulse_score, bio, location_city_name, interests";

function safeLike(s: string): string {
  return s.replace(/[%_]/g, "\\$&");
}

function normaliseRow(row: Record<string, unknown>): UserRow {
  return {
    ...(row as UserRow),
    city: (row.location_city_name as string | null) ?? null,
    interests: Array.isArray(row.interests) ? (row.interests as string[]) : null,
  };
}

export async function searchUsers(opts: {
  q: string;
  limit: number;
  offset: number;
  city?: string;
}): Promise<UserRow[]> {
  const { q, limit, offset, city } = opts;

  // No query + city filter: browse city directory
  if (!q && city) {
    const { data } = await supabaseAdmin
      .from("users")
      .select(USER_SELECT)
      .eq("is_active", true)
      .ilike("location_city_name", `%${safeLike(city)}%`)
      .order("pulse_score", { ascending: false })
      .range(offset, offset + limit - 1);
    return (data ?? []).map(normaliseRow);
  }

  if (!q) return [];

  const safe = safeLike(q);
  const cityPat = city ? `%${safeLike(city)}%` : null;

  // Short query: prefix match on username / first name
  if (q.length <= 2) {
    let base = supabaseAdmin
      .from("users")
      .select(USER_SELECT)
      .or(`username.ilike.${safe}%,first_name.ilike.${safe}%`)
      .range(offset, offset + limit - 1);
    if (cityPat) base = base.ilike("location_city_name", cityPat);
    const { data } = await base;
    return (data ?? []).map(normaliseRow);
  }

  // Try full-text search first
  let ftsQ = supabaseAdmin
    .from("users")
    .select(USER_SELECT)
    .textSearch("search_vector", q, { type: "websearch", config: "english" })
    .range(offset, offset + limit - 1);
  if (cityPat) ftsQ = ftsQ.ilike("location_city_name", cityPat);
  const { data: ftsData, error: ftsError } = await ftsQ;

  if (!ftsError && ftsData && ftsData.length > 0) {
    return ftsData.map(normaliseRow);
  }

  // Fallback: separate ilike queries (avoid raw .or() with user text)
  const [unameQ, firstQ, lastQ] = [
    supabaseAdmin.from("users").select(USER_SELECT).ilike("username", `%${safe}%`).limit(limit),
    supabaseAdmin.from("users").select(USER_SELECT).ilike("first_name", `%${safe}%`).limit(limit),
    supabaseAdmin.from("users").select(USER_SELECT).ilike("last_name", `%${safe}%`).limit(limit),
  ].map((b) => (cityPat ? b.ilike("location_city_name", cityPat) : b));

  const [unameRes, firstRes, lastRes] = await Promise.all([unameQ, firstQ, lastQ]);

  const seen = new Set<string>();
  const merged: UserRow[] = [];
  for (const row of [
    ...(unameRes.data ?? []),
    ...(firstRes.data ?? []),
    ...(lastRes.data ?? []),
  ]) {
    const r = normaliseRow(row as Record<string, unknown>);
    if (!seen.has(r.clerk_id)) { seen.add(r.clerk_id); merged.push(r); }
  }

  return merged.slice(offset, offset + limit);
}
