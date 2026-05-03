import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../../lib/supabase";

function jsonError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

async function slugify(title: string): Promise<string> {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
}

// POST /api/organizer/events/save-draft
// Creates or updates a draft event. Pass { id } to update an existing draft.
export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return jsonError(401, "Unauthorized");

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, role")
    .eq("clerk_id", clerkId)
    .maybeSingle();

  if (!user) return jsonError(404, "User not found");
  if (user.role !== "organizer" && user.role !== "admin") {
    return jsonError(403, "Organizer account required");
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "Invalid JSON");
  }

  if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
    return jsonError(400, "title is required");
  }

  const existingId = body.id as string | undefined;

  // If updating, verify ownership
  if (existingId) {
    const { data: existing } = await supabaseAdmin
      .from("events")
      .select("id, organizer_id, status")
      .eq("id", existingId)
      .maybeSingle();

    if (!existing || existing.organizer_id !== user.id) {
      return jsonError(404, "Draft not found");
    }
    if (existing.status === "published") {
      return jsonError(400, "Cannot overwrite a published event as draft");
    }
  }

  const isOnline = Boolean(body.isOnline);
  const customLoc = !isOnline ? ((body.customLocation as string) || null) : null;
  const resolvedCustomLoc = !isOnline && !body.venueId && !customLoc ? "Location TBD" : customLoc;
  const onlineLink = isOnline ? ((body.onlineLink as string) || "TBD") : null;

  // start_datetime is NOT NULL in schema — use placeholder if not set yet
  const rawStart = body.startDatetime as string | undefined;
  const placeholder = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const startDatetime = rawStart || placeholder;

  let endDatetime = (body.endDatetime as string) || null;
  if (!endDatetime) {
    const s = new Date(startDatetime);
    endDatetime = new Date(s.getTime() + 2 * 60 * 60 * 1000).toISOString();
  }

  const shortDesc = (body.shortDescription as string) || "";
  const description = (body.description as string) || shortDesc || (body.title as string);

  const payload = {
    organizer_id:      user.id,
    category_id:       (body.categoryId as string) || null,
    title:             body.title as string,
    description,
    short_description: shortDesc || null,
    tags:              (body.tags as string[]) ?? [],
    banner_url:        (body.bannerUrl as string) || null,
    start_datetime:    startDatetime,
    end_datetime:      endDatetime,
    timezone:          (body.timezone as string) || "Africa/Accra",
    is_online:         isOnline,
    online_link:       onlineLink,
    custom_location:   resolvedCustomLoc,
    venue_id:          !isOnline ? ((body.venueId as string) || null) : null,
    latitude:          body.venueLat != null ? Number(body.venueLat) : null,
    longitude:         body.venueLng != null ? Number(body.venueLng) : null,
    status:            "draft" as const,
  };

  if (existingId) {
    const { error } = await supabaseAdmin
      .from("events")
      .update(payload)
      .eq("id", existingId);

    if (error) {
      console.error("[save-draft] update failed:", error);
      return jsonError(500, error.message);
    }

    return NextResponse.json({ id: existingId });
  }

  // Create new draft
  const slug = await slugify(body.title as string);

  const { data: event, error } = await supabaseAdmin
    .from("events")
    .insert({ ...payload, slug, slug_v2: slug })
    .select("id")
    .single();

  if (error) {
    console.error("[save-draft] insert failed:", error);
    return jsonError(500, error.message);
  }

  return NextResponse.json({ id: event.id }, { status: 201 });
}
