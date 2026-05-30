import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { sendPioneerInvite } from "../../../../lib/email";

// POST /api/alpha/invite
// Body: { email, name, phone?, awardBadge?, userId? }
// - Inserts into alpha_testers
// - Sends the founder welcome email
// - Optionally awards founding member badge (if userId provided)
export async function POST(req: NextRequest) {
  const { email, name, phone, awardBadge, userId } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const firstName = name?.trim().split(" ")[0] || "there";

  // Upsert alpha_testers row
  const { error: testerError } = await supabaseAdmin
    .from("alpha_testers")
    .upsert(
      { email, name: name ?? null, phone: phone ?? null, invited_at: new Date().toISOString() },
      { onConflict: "email", ignoreDuplicates: false }
    );

  if (testerError) {
    console.error("[alpha/invite] DB error:", testerError);
  }

  // Award founding member badge if userId provided
  if (awardBadge && userId) {
    await supabaseAdmin.rpc("award_founding_member_badge", { p_user_id: userId });
  }

  // Send Pulse Pioneers welcome email
  try {
    await sendPioneerInvite({ to: email, firstName });
  } catch (err) {
    console.error("[alpha/invite] Resend error:", err);
    return NextResponse.json({ error: "email send failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
