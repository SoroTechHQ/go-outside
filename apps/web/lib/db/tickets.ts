import { supabaseAdmin } from "../supabase";
import { adaptTicket, type DbTicketRow } from "./adapters";
import type { AttendeeTicket } from "@gooutside/demo-data";

const TICKET_SELECT = `
  id, status, purchase_price, qr_code, created_at, attendee_name,
  events (
    slug, title, start_datetime, end_datetime,
    is_online, custom_location,
    venues (id, name, city, address)
  ),
  ticket_types (name, price),
  users!tickets_user_id_fkey (first_name, last_name)
`;

export async function getUserTickets(supabaseUserId: string): Promise<AttendeeTicket[]> {
  const { data, error } = await supabaseAdmin
    .from("tickets")
    .select(TICKET_SELECT)
    .eq("user_id", supabaseUserId)
    .in("status", ["active", "used"])
    .order("created_at", { ascending: false });

  if (error) { console.error("[getUserTickets]", error); return []; }
  return (data as unknown as DbTicketRow[]).map(adaptTicket);
}

export async function getTicketById(
  ticketId: string,
  supabaseUserId: string
): Promise<AttendeeTicket | null> {
  const { data, error } = await supabaseAdmin
    .from("tickets")
    .select(TICKET_SELECT)
    .eq("id", ticketId)
    .eq("user_id", supabaseUserId)
    .single();

  if (error || !data) return null;
  return adaptTicket(data as unknown as DbTicketRow);
}
