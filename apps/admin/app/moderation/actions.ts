"use server";

import { supabaseAdmin } from "../../lib/supabase";
import { revalidatePath } from "next/cache";

export async function dismissQueueItem(id: string) {
  await supabaseAdmin
    .from("moderation_queue")
    .update({ status: "resolved", resolution: "dismissed", resolved_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/moderation");
}

export async function closeReport(id: string) {
  await supabaseAdmin
    .from("reports")
    .update({ status: "resolved", resolved_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/moderation");
}

export async function suspendUserFromReport(userId: string) {
  await supabaseAdmin.from("users").update({ is_active: false }).eq("id", userId);
  revalidatePath("/moderation");
}
