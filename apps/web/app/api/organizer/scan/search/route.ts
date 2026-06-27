import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: actor } = await supabaseAdmin
    .from("users")
    .select("id, role")
    .eq("clerk_id", clerkId)
    .maybeSingle();

  if (!actor) return NextResponse.json({ error: "User not found" }, { status: 401 });
  if (actor.role !== "organizer" && actor.role !== "admin") {
    return NextResponse.json({ error: "Organizer access required" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q")?.trim() ?? "";
  const eventId = searchParams.get("eventId")?.trim() ?? "";

  if (!q || q.length < 2) return NextResponse.json({ tickets: [] });
  if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 });

  // Fetch all tickets for the event with joined user data, then filter in JS.
  // We can't filter on joined columns via Supabase's .or(), so we pull a
  // reasonable cap and match against both attendee_name and the linked user's name.
  const { data: tickets, error } = await supabaseAdmin
    .from("tickets")
    .select(`
      id, status, attendee_name, attendee_email, checked_in_at,
      ticket_types ( name ),
      users ( first_name, last_name, username, avatar_url )
    `)
    .eq("event_id", eventId)
    .limit(300);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const lower = q.toLowerCase();

  const results = (tickets ?? [])
    .map((t) => {
      const u = t.users as unknown as { first_name: string | null; last_name: string | null; username: string | null } | null;
      const name = u
        ? `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || (t.attendee_name ?? "Attendee")
        : (t.attendee_name ?? "Attendee");
      const username = u?.username ?? null;
      return {
        id: t.id,
        name,
        username,
        email: t.attendee_email,
        ticketType: (t.ticket_types as unknown as { name: string } | null)?.name ?? "General",
        status: t.status,
        checkedInAt: (t as unknown as { checked_in_at: string | null }).checked_in_at,
        _attendeeName: t.attendee_name,
      };
    })
    .filter((t) =>
      t.name.toLowerCase().includes(lower) ||
      (t.email ?? "").toLowerCase().includes(lower) ||
      (t.username ?? "").toLowerCase().includes(lower) ||
      (t._attendeeName ?? "").toLowerCase().includes(lower)
    )
    .slice(0, 15)
    .map(({ _attendeeName: _n, ...rest }) => rest);

  return NextResponse.json({ tickets: results });
}
