import { supabaseAdmin } from "../supabase";
import { adaptOrganizer, type DbOrganizerRow } from "./adapters";
import type { Organizer } from "@gooutside/demo-data";

const ORGANIZER_SELECT = `
  user_id, organization_name, status, total_events,
  users!organizer_profiles_user_id_fkey (
    id, first_name, last_name, location_city
  )
`;

// All approved organizers
export async function getOrganizers(): Promise<Organizer[]> {
  const { data, error } = await supabaseAdmin
    .from("organizer_profiles")
    .select(ORGANIZER_SELECT)
    .eq("status", "approved")
    .order("total_events", { ascending: false });

  if (error) { console.error("[getOrganizers]", error); return []; }
  return (data as unknown as DbOrganizerRow[]).map(adaptOrganizer);
}

// Single organizer by their user UUID
export async function getOrganizerByUserId(userId: string): Promise<Organizer | null> {
  const { data, error } = await supabaseAdmin
    .from("organizer_profiles")
    .select(ORGANIZER_SELECT)
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  return adaptOrganizer(data as unknown as DbOrganizerRow);
}
