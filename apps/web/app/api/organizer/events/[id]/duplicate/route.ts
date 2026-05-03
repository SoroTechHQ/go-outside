import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../../../lib/supabase";

function jsonError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
}

export async function POST(
  _req: NextRequest,
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

  const { data: event } = await supabaseAdmin
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!event || event.organizer_id !== user.id) return jsonError(404, "Event not found");

  const newTitle = `${event.title} (Copy)`;
  const newSlug = slugify(newTitle);

  const { data: newEvent, error } = await supabaseAdmin
    .from("events")
    .insert({
      organizer_id: event.organizer_id,
      category_id: event.category_id,
      title: newTitle,
      slug: newSlug,
      slug_v2: newSlug,
      description: event.description,
      short_description: event.short_description,
      tags: event.tags ?? [],
      banner_url: event.banner_url,
      gallery_urls: event.gallery_urls ?? [],
      start_datetime: event.start_datetime,
      end_datetime: event.end_datetime,
      timezone: event.timezone ?? "Africa/Accra",
      is_online: event.is_online,
      online_link: event.online_link,
      custom_location: event.custom_location,
      venue_id: event.venue_id,
      status: "draft",
      published_at: null,
      total_capacity: event.total_capacity,
    })
    .select("id, slug")
    .single();

  if (error) return jsonError(500, error.message);

  // Copy ticket types (reset sold counts)
  const { data: ticketTypes } = await supabaseAdmin
    .from("ticket_types")
    .select("name, price, price_type, quantity_total, sale_starts_at, sale_ends_at")
    .eq("event_id", id);

  if (ticketTypes?.length) {
    await supabaseAdmin.from("ticket_types").insert(
      ticketTypes.map((tt) => ({
        event_id: newEvent.id,
        name: tt.name,
        price: tt.price,
        price_type: tt.price_type,
        quantity_total: tt.quantity_total,
        quantity_sold: 0,
        sale_starts_at: tt.sale_starts_at,
        sale_ends_at: tt.sale_ends_at,
      })),
    );
  }

  return NextResponse.json({ id: newEvent.id, slug: newEvent.slug }, { status: 201 });
}
