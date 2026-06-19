import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { enforceSameOrigin, jsonError } from "../../../../lib/api-security";

export async function POST(req: NextRequest) {
  const clerk = await currentUser();
  if (!clerk) return jsonError(401, "Unauthorized");

  const csrf = enforceSameOrigin(req);
  if (csrf) return csrf;

  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("id, role")
    .eq("clerk_id", clerk.id)
    .maybeSingle();

  if (!existing) return jsonError(404, "User not found");
  if ((existing as { role: string }).role === "admin") {
    return jsonError(403, "Admin accounts cannot switch to attendee");
  }

  const { error } = await supabaseAdmin
    .from("users")
    .update({
      role:                  "attendee",
      account_type:          "attendee",
      is_verified_organizer: false,
      updated_at:            new Date().toISOString(),
    })
    .eq("id", (existing as { id: string }).id);

  if (error) {
    console.error("[become-attendee] update failed:", error.message);
    return jsonError(500, "Failed to update account");
  }

  return NextResponse.json({ ok: true });
}
