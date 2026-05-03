import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { insertNotification } from "../../../../lib/db/insert-notification";

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

  if (!body.title || typeof body.title !== "string") {
    return jsonError(400, "title is required");
  }
  if (!body.startDatetime) {
    return jsonError(400, "startDatetime is required");
  }

  const slug = await slugify(body.title as string);

  const startDatetime = (body.startDatetime as string) || null;

  // end_datetime is NOT NULL — default to start + 2 h if omitted
  let endDatetime = (body.endDatetime as string) || null;
  if (!endDatetime && startDatetime) {
    const start = new Date(startDatetime);
    if (!isNaN(start.getTime())) {
      endDatetime = new Date(start.getTime() + 2 * 60 * 60 * 1000).toISOString();
    }
  }

  // description is NOT NULL — cascade: description → shortDescription → title
  const shortDesc = (body.shortDescription as string) || "";
  const description = (body.description as string) || shortDesc || (body.title as string);

  // Resolve location fields to satisfy CHECK constraint events_location_mode:
  //   online=true  → online_link IS NOT NULL, venue_id IS NULL
  //   online=false → online_link IS NULL, (venue_id OR custom_location) IS NOT NULL
  const isOnline    = Boolean(body.isOnline);
  const venueId     = !isOnline ? ((body.venueId as string) || null) : null;
  const onlineLink  = isOnline  ? ((body.onlineLink as string) || "TBD") : null;
  const customLoc   = !isOnline
    ? ((body.customLocation as string) || null)
    : null;
  // If offline and no venue/location provided, fall back so constraint passes
  const resolvedCustomLoc = (!isOnline && !venueId && !customLoc)
    ? "Location TBD"
    : customLoc;

  const { data: event, error } = await supabaseAdmin
    .from("events")
    .insert({
      organizer_id:      user.id,
      category_id:       (body.categoryId as string) || null,
      title:             body.title as string,
      slug,
      slug_v2:           slug,
      description,
      short_description: shortDesc || null,
      tags:              (body.tags as string[]) ?? [],
      banner_url:        (body.bannerUrl as string) || null,
      gallery_urls:      (body.galleryUrls as string[]) ?? [],
      start_datetime:    startDatetime,
      end_datetime:      endDatetime,
      timezone:          (body.timezone as string) || "Africa/Accra",
      is_online:         isOnline,
      online_link:       onlineLink,
      custom_location:   resolvedCustomLoc,
      venue_id:          venueId,
      latitude:          body.venueLat != null ? Number(body.venueLat) : null,
      longitude:         body.venueLng != null ? Number(body.venueLng) : null,
      status:            body.publish ? "published" : "draft",
      published_at:      body.publish ? new Date().toISOString() : null,
    })
    .select("id, slug")
    .single();

  if (error) {
    console.error("[POST /api/organizer/events] insert failed:", error);
    return jsonError(500, error.message);
  }

  // Fan-out new event notification to all followers when published
  if (body.publish) {
    const [followerRows, organizerRow] = await Promise.all([
      supabaseAdmin
        .from("follows")
        .select("follower_id")
        .eq("following_id", user.id)
        .then((r) => r.data ?? []),
      supabaseAdmin
        .from("users")
        .select("first_name, last_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle()
        .then((r) => r.data as { first_name: string; last_name: string; avatar_url: string | null } | null),
    ]);

    if ((followerRows as { follower_id: string }[]).length > 0) {
      const organizerName = organizerRow
        ? `${organizerRow.first_name} ${organizerRow.last_name}`.trim()
        : "An organizer";

      for (const f of followerRows as { follower_id: string }[]) {
        insertNotification({
          userId: f.follower_id,
          type: "new_event",
          title: `${organizerName} just dropped a new event`,
          body: body.title as string,
          data: {
            event_id:         event.id,
            event_title:      body.title,
            actor_name:       organizerName,
            actor_avatar_url: organizerRow?.avatar_url ?? null,
          },
          actionHref: `/events/${event.slug}`,
        });
      }
    }
  }

  const ticketTypes = body.ticketTypes as Array<{
    name: string;
    price: number;
    capacity: number | null;
    saleStartsAt: string | null;
    saleEndsAt: string | null;
  }> | undefined;

  if (ticketTypes?.length) {
    await supabaseAdmin.from("ticket_types").insert(
      ticketTypes.map((tt) => ({
        event_id: event.id,
        name: tt.name,
        price: tt.price,
        price_type: tt.price > 0 ? "paid" : "free",
        quantity_total: tt.capacity,
        sale_starts_at: tt.saleStartsAt || null,
        sale_ends_at: tt.saleEndsAt || null,
      }))
    );
  }

  return NextResponse.json({ id: event.id, slug: event.slug }, { status: 201 });
}
