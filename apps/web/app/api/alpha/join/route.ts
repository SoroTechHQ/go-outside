import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { sendPioneerInvite } from "../../../../lib/email";

// POST /api/alpha/join  — public self-serve endpoint
// Anyone can submit their email to join the alpha program.
export async function POST(req: NextRequest) {
  const { email, name } = await req.json();
  if (!email?.trim()) {
    return NextResponse.json({ error: "Email required." }, { status: 400 });
  }

  const clean = (email as string).trim().toLowerCase();
  const firstName = (name as string | undefined)?.trim().split(" ")[0] ?? "there";

  // Check if already invited / active
  const { data: existing } = await supabaseAdmin
    .from("alpha_testers")
    .select("id, status")
    .eq("email", clean)
    .maybeSingle();

  if (existing) {
    // Already in — still send a friendly "you're already in" response (don't leak status)
    return NextResponse.json({ ok: true, alreadyIn: true });
  }

  // Insert into alpha_testers
  await supabaseAdmin.from("alpha_testers").insert({
    email:      clean,
    name:       (name as string | undefined)?.trim() || null,
    status:     "invited",
    invited_at: new Date().toISOString(),
  });

  // Send the founder welcome email
  try {
    await sendPioneerInvite({ to: clean, firstName });
  } catch (err) {
    console.error("[alpha/join] email error:", err);
    // Still return ok — they're in the DB
  }

  return NextResponse.json({ ok: true });
}
