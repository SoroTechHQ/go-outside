import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../lib/supabase";

type TicketRow = {
  id: string;
  status: string;
  purchase_price: number | null;
  attendee_name: string | null;
  attendee_email: string | null;
  created_at: string;
  checked_in_at: string | null;
  events: { id: string; title: string; slug: string; start_datetime: string | null } | null;
  ticket_types: { name: string; price: number } | null;
  users: { first_name: string | null; last_name: string | null; avatar_url: string | null; username: string | null } | null;
};

export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("clerk_id", clerkId)
    .maybeSingle();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("event_id") ?? undefined;
  const status  = searchParams.get("status") ?? undefined;
  const q       = searchParams.get("q") ?? undefined;

  // Fetch all tickets for this organizer's events
  let query = supabaseAdmin
    .from("tickets")
    .select(`
      id, status, purchase_price, attendee_name, attendee_email, created_at, checked_in_at,
      events!inner ( id, title, slug, start_datetime, organizer_id ),
      ticket_types ( name, price ),
      users ( first_name, last_name, avatar_url, username )
    `)
    .eq("events.organizer_id", user.id)
    .order("created_at", { ascending: false })
    .limit(500);

  if (eventId) {
    query = query.eq("event_id", eventId);
  }

  // Exclude cancelled/refunded from main list unless explicitly requested
  if (status === "cancelled") {
    query = query.in("status", ["cancelled", "refunded"]);
  } else if (status === "checked_in") {
    query = query.not("checked_in_at", "is", null).in("status", ["confirmed", "used"]);
  } else if (status === "confirmed") {
    query = query.is("checked_in_at", null).in("status", ["confirmed"]);
  }

  const { data: rows } = await query;
  const tickets = (rows ?? []) as unknown as TicketRow[];

  // Fetch distinct events for the filter tabs
  const { data: orgEvents } = await supabaseAdmin
    .from("events")
    .select("id, title, start_datetime")
    .eq("organizer_id", user.id)
    .in("status", ["published", "draft"])
    .order("start_datetime", { ascending: false })
    .limit(20);

  // Normalise rows → attendees
  let attendees = tickets.map((t) => {
    const u = t.users;
    const name =
      u
        ? `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim()
        : (t.attendee_name ?? "Guest");
    const email = t.attendee_email ?? "";
    const avatarUrl = u?.avatar_url ?? null;
    const username = u?.username ?? null;
    const isCheckedIn = Boolean(t.checked_in_at);

    return {
      id:           t.id,
      name:         name || "Guest",
      email,
      avatarUrl,
      username,
      status:       isCheckedIn ? "checked_in" : (t.status ?? "confirmed"),
      checkedInAt:  t.checked_in_at ?? null,
      purchasedAt:  t.created_at,
      ticketTier:   t.ticket_types?.name ?? "General Admission",
      purchasePrice: t.purchase_price ?? 0,
      eventId:      t.events?.id ?? "",
      eventTitle:   t.events?.title ?? "",
      eventSlug:    t.events?.slug ?? "",
      eventDate:    t.events?.start_datetime ?? null,
    };
  });

  // Client-side search filter applied server-side for CSV export compat
  if (q) {
    const lower = q.toLowerCase();
    attendees = attendees.filter(
      (a) =>
        a.name.toLowerCase().includes(lower) ||
        a.email.toLowerCase().includes(lower)
    );
  }

  const confirmed  = attendees.filter((a) => a.status === "confirmed").length;
  const checkedIn  = attendees.filter((a) => a.status === "checked_in").length;
  const cancelled  = attendees.filter((a) => ["cancelled", "refunded"].includes(a.status)).length;
  const revenue    = attendees.reduce((sum, a) => sum + a.purchasePrice, 0);

  const eventList = (orgEvents ?? []).map((e) => ({
    id:    e.id,
    title: e.title,
    date:  e.start_datetime ?? null,
  }));

  return NextResponse.json({
    attendees,
    stats: {
      total:     attendees.length,
      checkedIn,
      confirmed,
      cancelled,
      revenue,
    },
    events: eventList,
  });
}
