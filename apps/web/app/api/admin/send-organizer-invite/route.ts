import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { sendFoundingOrganizerInvite } from "../../../../lib/email";

function isAuthed(req: NextRequest) {
  const cookie = req.cookies.get("go_admin_auth");
  return cookie?.value === "authenticated";
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await req.json();
  const { email, firstName, businessName, senderName, notes } = body as {
    email: string;
    firstName: string;
    businessName: string;
    senderName?: string;
    notes?: string;
  };

  if (!email || !firstName || !businessName) {
    return NextResponse.json({ error: "email, firstName, and businessName are required." }, { status: 400 });
  }

  // Prevent duplicate active invites to same email
  const { data: existing } = await supabaseAdmin
    .from("organizer_invites")
    .select("id, email_sent")
    .eq("email", email.toLowerCase().trim())
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "An invite already exists for this email address." },
      { status: 409 }
    );
  }

  // Insert invite row to get the auto-generated token
  const { data: invite, error: insertError } = await supabaseAdmin
    .from("organizer_invites")
    .insert({
      email: email.toLowerCase().trim(),
      first_name: firstName.trim(),
      business_name: businessName.trim(),
      sender_name: senderName?.trim() || "Amoako",
      notes: notes?.trim() || null,
    })
    .select("id, token")
    .single();

  if (insertError || !invite) {
    return NextResponse.json({ error: insertError?.message ?? "Failed to create invite." }, { status: 500 });
  }

  try {
    await sendFoundingOrganizerInvite({
      to: email,
      firstName: firstName.trim(),
      businessName: businessName.trim(),
      token: invite.token,
      senderName: senderName?.trim() || "Amoako",
    });
  } catch (err) {
    console.error("[send-organizer-invite] Resend error:", err);
    // Clean up the record so they can retry
    await supabaseAdmin.from("organizer_invites").delete().eq("id", invite.id);
    return NextResponse.json({ error: "Failed to send email. Please try again." }, { status: 500 });
  }

  // Mark as sent
  await supabaseAdmin
    .from("organizer_invites")
    .update({ email_sent: true, email_sent_at: new Date().toISOString() })
    .eq("id", invite.id);

  return NextResponse.json({ success: true, id: invite.id });
}
