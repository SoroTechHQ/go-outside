import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { enforceSameOrigin, jsonError } from "../../../../lib/api-security";

export async function POST(req: NextRequest) {
  const clerk = await currentUser();
  if (!clerk) return jsonError(401, "Unauthorized");

  const csrf = enforceSameOrigin(req);
  if (csrf) return csrf;

  const body = await req.json() as Record<string, unknown>;
  const orgName = typeof body.organization_name === "string" ? body.organization_name.trim() : "";
  const orgBio  = typeof body.bio === "string" ? body.bio.trim() : "";
  const orgCats = Array.isArray(body.organizer_category)
    ? (body.organizer_category as unknown[]).filter((c): c is string => typeof c === "string")
    : [];

  if (!orgName) return jsonError(400, "Organization name is required");

  // Fetch current role to prevent attendee → admin escalation
  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("id, role")
    .eq("clerk_id", clerk.id)
    .maybeSingle();

  if (!existing) return jsonError(404, "User not found");
  if (existing.role === "admin") {
    return NextResponse.json({ ok: true, already: true });
  }

  const { error: userErr } = await supabaseAdmin
    .from("users")
    .update({
      account_type:          "organizer",
      role:                  "organizer",
      is_verified_organizer: true,
      organizer_bio:         orgBio || null,
      organizer_category:    orgCats.length ? orgCats : null,
      updated_at:            new Date().toISOString(),
    })
    .eq("id", existing.id);

  if (userErr) {
    console.error("[become-organizer] users update", userErr);
    return jsonError(500, "Failed to update account");
  }

  const { error: profileErr } = await supabaseAdmin
    .from("organizer_profiles")
    .upsert(
      {
        user_id:           existing.id,
        organization_name: orgName,
        bio:               orgBio || null,
        status:            "approved",
        updated_at:        new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (profileErr) {
    console.error("[become-organizer] organizer_profiles upsert", profileErr);
    return jsonError(500, "Failed to create organizer profile");
  }

  return NextResponse.json({ ok: true });
}
