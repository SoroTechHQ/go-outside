import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { getSupabaseUserIdByClerkId } from "../../../../lib/db/users";

// Resolve organizer's Supabase user_id from their organizer table row
// Accepts either a Supabase UUID or an organization_name slug
async function resolveOrganizerUserId(organizerId: string): Promise<string | null> {
  // Try as direct UUID first
  const { data: byId } = await supabaseAdmin
    .from("organizers")
    .select("user_id")
    .eq("user_id", organizerId)
    .maybeSingle();
  if (byId?.user_id) return byId.user_id as string;

  // Try by slug / name (demo-data IDs are kebab-case org names)
  const nameFromSlug = organizerId.replace(/^org-/, "").replace(/-/g, " ");
  const { data: byName } = await supabaseAdmin
    .from("organizers")
    .select("user_id")
    .ilike("organization_name", `%${nameFromSlug}%`)
    .maybeSingle();
  return (byName?.user_id as string) ?? null;
}

// POST /api/organizers/follow  { organizerId }
export async function POST(req: NextRequest) {
  const clerk = await currentUser();
  if (!clerk) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { organizerId } = (await req.json().catch(() => ({}))) as { organizerId?: string };
  if (!organizerId) return NextResponse.json({ error: "organizerId required" }, { status: 400 });

  const [fromId, orgUserId] = await Promise.all([
    getSupabaseUserIdByClerkId(clerk.id),
    resolveOrganizerUserId(organizerId),
  ]);

  if (!fromId) return NextResponse.json({ error: "Account not set up" }, { status: 400 });
  if (!orgUserId) return NextResponse.json({ error: "Organizer not found" }, { status: 404 });
  if (fromId === orgUserId) return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });

  await Promise.all([
    supabaseAdmin.from("graph_edges").upsert(
      { from_id: fromId, from_type: "user", to_id: orgUserId, to_type: "user", edge_type: "organizer_follows", weight: 2.0, is_active: true },
      { onConflict: "from_id,to_id,edge_type", ignoreDuplicates: false },
    ),
    supabaseAdmin.from("follows").upsert(
      { follower_id: fromId, following_id: orgUserId },
      { onConflict: "follower_id,following_id", ignoreDuplicates: true },
    ),
    supabaseAdmin.from("notifications").insert({
      user_id: orgUserId,
      type: "new_follower",
      title: "New follower",
      body: "Someone started following your organisation.",
      is_read: false,
    }),
  ]);

  return NextResponse.json({ following: true });
}

// DELETE /api/organizers/follow  { organizerId }
export async function DELETE(req: NextRequest) {
  const clerk = await currentUser();
  if (!clerk) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { organizerId } = (await req.json().catch(() => ({}))) as { organizerId?: string };
  if (!organizerId) return NextResponse.json({ error: "organizerId required" }, { status: 400 });

  const [fromId, orgUserId] = await Promise.all([
    getSupabaseUserIdByClerkId(clerk.id),
    resolveOrganizerUserId(organizerId),
  ]);

  if (!fromId || !orgUserId) return NextResponse.json({ following: false });

  await Promise.all([
    supabaseAdmin.from("graph_edges").delete()
      .eq("from_id", fromId).eq("to_id", orgUserId).eq("edge_type", "organizer_follows"),
    supabaseAdmin.from("follows").delete()
      .eq("follower_id", fromId).eq("following_id", orgUserId),
  ]);

  return NextResponse.json({ following: false });
}

// GET /api/organizers/follow?organizerId=
export async function GET(req: NextRequest) {
  const clerk = await currentUser();
  if (!clerk) return NextResponse.json({ following: false });

  const organizerId = req.nextUrl.searchParams.get("organizerId");
  if (!organizerId) return NextResponse.json({ following: false });

  const [fromId, orgUserId] = await Promise.all([
    getSupabaseUserIdByClerkId(clerk.id),
    resolveOrganizerUserId(organizerId),
  ]);

  if (!fromId || !orgUserId) return NextResponse.json({ following: false });

  const { data } = await supabaseAdmin
    .from("graph_edges")
    .select("id")
    .eq("from_id", fromId)
    .eq("to_id", orgUserId)
    .eq("edge_type", "organizer_follows")
    .maybeSingle();

  return NextResponse.json({ following: !!data });
}
