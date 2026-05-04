"use server";

import { supabaseAdmin } from "../../lib/supabase";
import { revalidatePath } from "next/cache";

export async function publishEvent(id: string) {
  await supabaseAdmin.from("events").update({ status: "published" }).eq("id", id);
  revalidatePath("/events");
}

export async function toggleFeature(id: string, current: boolean) {
  await supabaseAdmin.from("events").update({ is_featured: !current }).eq("id", id);
  revalidatePath("/events");
}
