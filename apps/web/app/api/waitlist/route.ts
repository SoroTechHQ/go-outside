import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase";
import { sendWaitlistConfirmation } from "../../../lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email, name, phone, role } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
    }

    // Insert into Supabase
    const { error: dbError } = await supabaseAdmin.from("waitlist_signups").insert({
      email: email.toLowerCase().trim(),
      name: name?.trim() || null,
      phone: phone?.trim() || null,
      role: role || null,
    });

    if (dbError) {
      if (dbError.code === "23505") {
        return NextResponse.json({ error: "You're already on the waitlist!" }, { status: 409 });
      }
      console.error("Supabase error:", dbError);
      return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }

    // Send welcome email via Resend
    const firstName = name?.trim().split(" ")[0] || "there";
    const roleLabel =
      role === "organizer"
        ? "event organizer"
        : role === "both"
          ? "event organizer and goer"
          : "event goer";

    let emailSent = false;
    try {
      await sendWaitlistConfirmation({ to: email.toLowerCase().trim(), firstName, roleLabel });
      emailSent = true;
    } catch (emailErr) {
      // Log but don't fail the signup — email can be retried from admin
      console.error("Resend error (signup still recorded):", emailErr);
    }

    // Mark email_sent status
    if (emailSent) {
      await supabaseAdmin
        .from("waitlist_signups")
        .update({ email_sent: true })
        .eq("email", email.toLowerCase().trim());
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Waitlist error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
