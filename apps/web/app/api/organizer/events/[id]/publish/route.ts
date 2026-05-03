import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../../../lib/supabase";
import { insertNotification } from "../../../../../../lib/db/insert-notification";

function jsonError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

// POST /api/organizer/events/[id]/publish
// Updates a draft event with new data and optionally publishes it.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return jsonError(401, "Unauthorized");

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, role")
    .eq("clerk_id", clerkId)
    .maybeSingle();

  if (!user) return jsonError(404, "User not found");
  if (user.role !== "organizer" && user.role !== "admin") return jsonError(403, "Organizer required");

  const { id } = await params;

  const { data: existing } = await supabaseAdmin
    .from("events")
    .select("id, organizer_id, slug")
    .eq("id", id)
    .maybeSingle();

  if (!existing || existing.organizer_id !== user.id) return jsonError(404, "Event not found");

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return jsonError(400, "Invalid JSON"); }

  const publish = Boolean(body.publish);
  const isOnline = Boolean(body.isOnline);
  const customLoc = !isOnline ? ((body.customLocation as string) || null) : null;
  const resolvedCustomLoc = !isOnline && !body.venueId && !customLoc ? "Location TBD" : customLoc;
  const onlineLink = isOnline ? ((body.onlineLink as string) || "TBD") : null;

  const rawStart = body.startDatetime as string | undefined;
  const placeholder = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const startDatetime = rawStart || placeholder;

  let endDatetime = (body.endDatetime as string) || null;
  if (!endDatetime) {
    const s = new Date(startDatetime);
    endDatetime = new Date(s.getTime() + 2 * 60 * 60 * 1000).toISOString();
  }

  const shortDesc = (body.shortDescription as string) || "";
  const description = shortDesc || (body.title as string) || "Event";

  const { error } = await supabaseAdmin
    .from("events")
    .update({
      category_id:       (body.categoryId as string) || null,
      title:             body.title as string,
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
      venue_id:          !isOnline ? ((body.venueId as string) || null) : null,
      latitude:          body.venueLat != null ? Number(body.venueLat) : null,
      longitude:         body.venueLng != null ? Number(body.venueLng) : null,
      status:            publish ? "published" : "draft",
      published_at:      publish ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error) return jsonError(500, error.message);

  // Insert ticket types if provided
  const ticketTypes = body.ticketTypes as Array<{
    name: string; price: number; capacity: number | null;
    saleStartsAt: string | null; saleEndsAt: string | null;
  }> | undefined;

  if (ticketTypes?.length) {
    // Remove existing ticket types for this draft first
    await supabaseAdmin.from("ticket_types").delete().eq("event_id", id);
    await supabaseAdmin.from("ticket_types").insert(
      ticketTypes.map((tt) => ({
        event_id: id,
        name: tt.name,
        price: tt.price,
        price_type: tt.price > 0 ? "paid" : "free",
        quantity_total: tt.capacity,
        sale_starts_at: tt.saleStartsAt || null,
        sale_ends_at: tt.saleEndsAt || null,
      }))
    );
  }

  // Fan-out notifications if publishing
  if (publish) {
    const [followerRows, organizerRow] = await Promise.all([
      supabaseAdmin.from("follows").select("follower_id").eq("following_id", user.id)
        .then((r) => r.data ?? []),
      supabaseAdmin.from("users").select("first_name, last_name, avatar_url")
        .eq("id", user.id).maybeSingle().then((r) => r.data),
    ]);

    if ((followerRows as { follower_id: string }[]).length > 0) {
      const organizerName = organizerRow
        ? `${(organizerRow as { first_name: string; last_name: string }).first_name} ${(organizerRow as { first_name: string; last_name: string }).last_name}`.trim()
        : "An organizer";
      for (const f of followerRows as { follower_id: string }[]) {
        insertNotification({
          userId: f.follower_id,
          type: "new_event",
          title: `${organizerName} just dropped a new event`,
          body: body.title as string,
          data: { event_id: id, event_title: body.title, actor_name: organizerName },
          actionHref: `/events/${existing.slug}`,
        });
      }
    }
  }

  return NextResponse.json({ id, slug: existing.slug });
}
