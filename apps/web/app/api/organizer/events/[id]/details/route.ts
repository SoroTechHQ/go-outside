import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../../../lib/supabase";

function jsonError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

async function resolveUser(clerkId: string) {
  const { data } = await supabaseAdmin
    .from("users")
    .select("id, role")
    .eq("clerk_id", clerkId)
    .maybeSingle();
  return data;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return jsonError(401, "Unauthorized");

  const user = await resolveUser(clerkId);
  if (!user) return jsonError(404, "User not found");
  if (user.role !== "organizer" && user.role !== "admin") return jsonError(403, "Organizer required");

  const { id } = await params;

  const { data: event } = await supabaseAdmin
    .from("events")
    .select("id, organizer_id")
    .eq("id", id)
    .maybeSingle();

  if (!event || event.organizer_id !== user.id) return jsonError(404, "Event not found");

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "Invalid JSON");
  }

  const update: Record<string, unknown> = {};
  if ("description" in body) update.description = (body.description as string | null) || null;
  if ("shortDescription" in body) update.short_description = body.shortDescription ?? null;
  if ("bannerUrl" in body) update.banner_url = body.bannerUrl ?? null;
  if ("tags" in body) update.tags = Array.isArray(body.tags) ? body.tags : [];
  if ("activities" in body) update.activities = body.activities ?? null;
  if ("policies" in body) update.policies = body.policies ?? null;
  if ("videoUrl" in body) update.video_url = body.videoUrl ?? null;

  const { error } = await supabaseAdmin.from("events").update(update).eq("id", id);
  if (error) return jsonError(500, error.message);

  return NextResponse.json({ success: true });
}
