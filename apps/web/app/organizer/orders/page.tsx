import { supabaseAdmin } from "../../../lib/supabase";
import { getOrCreateSupabaseUser } from "../../../lib/db/users";
import { redirect } from "next/navigation";
import { OrdersClient } from "./OrdersClient";

export default async function OrganizerOrdersPage() {
  const user = await getOrCreateSupabaseUser();
  if (!user) redirect("/sign-in");

  const { data: tickets } = await supabaseAdmin
    .from("tickets")
    .select(`
      id, status, purchase_price, attendee_name, attendee_email, created_at,
      events!inner(id, title, slug, organizer_id),
      ticket_types(name, price)
    `)
    .eq("events.organizer_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <OrdersClient orders={(tickets ?? []) as unknown as Parameters<typeof OrdersClient>[0]["orders"]} />
  );
}
