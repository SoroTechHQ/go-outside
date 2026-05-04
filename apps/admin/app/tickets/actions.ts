"use server";

import { supabaseAdmin } from "../../lib/supabase";
import { revalidatePath } from "next/cache";

export async function refundTicket(id: string) {
  await supabaseAdmin.from("tickets").update({ status: "refunded" }).eq("id", id);
  revalidatePath("/tickets");
}
