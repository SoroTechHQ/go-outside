import { redirect } from "next/navigation";
import { supabaseAdmin } from "../../../lib/supabase";
import { getOrCreateSupabaseUser } from "../../../lib/db/users";
import { AttendeesClient } from "./AttendeesClient";

type TicketRow = {
  id: string;
  status: string;
  user_id: string | null;
  purchase_price: number | null;
  attendee_name: string | null;
  attendee_email: string | null;
  created_at: string;
  checked_in_at: string | null;
  events: { id: string; title: string; slug: string; start_datetime: string | null } | null;
  ticket_types: { name: string; price: number } | null;
  users: { first_name: string | null; last_name: string | null; avatar_url: string | null; username: string | null } | null;
};

export default async function OrganizerAttendeesPage() {
  const user = await getOrCreateSupabaseUser();
  if (!user) redirect("/sign-in");

  const [{ data: rows }, { data: eventRows }] = await Promise.all([
    supabaseAdmin
      .from("tickets")
      .select(`
        id, status, user_id, purchase_price, attendee_name, attendee_email, created_at, checked_in_at,
        events!inner ( id, title, slug, start_datetime, organizer_id ),
        ticket_types ( name, price ),
        users ( first_name, last_name, avatar_url, username )
      `)
      .eq("events.organizer_id", user.id)
      .order("created_at", { ascending: false })
      .limit(500),
    supabaseAdmin
      .from("events")
      .select("id, title, start_datetime")
      .eq("organizer_id", user.id)
      .in("status", ["published", "draft"])
      .order("start_datetime", { ascending: false })
      .limit(20),
  ]);

  const tickets = (rows ?? []) as unknown as TicketRow[];

  const attendees = tickets.map((t) => {
    const u = t.users;
    const name = u
      ? `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim()
      : (t.attendee_name ?? "Guest");
    return {
      id:           t.id,
      userId:       t.user_id ?? null,
      name:         name || "Guest",
      email:        t.attendee_email ?? "",
      avatarUrl:    u?.avatar_url ?? null,
      username:     u?.username ?? null,
      status:       t.checked_in_at ? "checked_in" : (t.status ?? "confirmed"),
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

  const checkedIn = attendees.filter((a) => a.status === "checked_in").length;
  const confirmed = attendees.filter((a) => a.status === "confirmed").length;
  const cancelled = attendees.filter((a) => ["cancelled", "refunded"].includes(a.status)).length;
  const revenue   = attendees.reduce((sum, a) => sum + a.purchasePrice, 0);

  const events = (eventRows ?? []).map((e) => ({
    id:    e.id,
    title: e.title,
    date:  e.start_datetime ?? null,
  }));

  return (
    <AttendeesClient
      attendees={attendees}
      stats={{ total: attendees.length, checkedIn, confirmed, cancelled, revenue }}
      events={events}
    />
  );
}
