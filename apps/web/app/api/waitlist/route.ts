import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "../../../lib/supabase";

const resend = new Resend(process.env.RESEND_API_KEY);

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

    await resend.emails.send({
      from: "GoOutside <waitlist@mail.gooutside.club>",
      to: email.toLowerCase().trim(),
      subject: "You're in — GoOutside is coming to Accra 🟢",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f7f7f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f7;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="background:#0f110f;padding:32px 40px;text-align:center;">
              <p style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">GoOutside</p>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.5);font-size:13px;">Your city is waiting.</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 16px;font-size:24px;font-weight:700;color:#0f110f;line-height:1.3;">
                Hey ${firstName}, you're on the list. 🎉
              </p>
              <p style="margin:0 0 20px;font-size:16px;color:#6f6f6f;line-height:1.6;">
                You joined as an <strong>${roleLabel}</strong> — great to have you. We're building the social events app Accra deserves, and you're getting in early.
              </p>
              <!-- Founding Member badge -->
              <div style="background:#f0f9f2;border:1px solid #c8e8ce;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
                <p style="margin:0 0 6px;font-size:14px;font-weight:600;color:#0f110f;">👑 Founding Member Status</p>
                <p style="margin:0;font-size:13px;color:#4a7a55;line-height:1.5;">You're among the first 1,000. Your Founding Member badge lives on your profile forever — and you'll earn <strong>2× Pulse points</strong> for your first 90 days on the app.</p>
              </div>
              <hr style="border:none;border-top:1px solid #ececec;margin:0 0 24px;">
              <p style="margin:0 0 16px;font-size:13px;font-weight:600;color:#0f110f;text-transform:uppercase;letter-spacing:0.5px;">What's coming</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">
                    <p style="margin:0;font-size:15px;color:#0f110f;font-weight:500;">🗺️ Personalised feed</p>
                    <p style="margin:4px 0 0;font-size:13px;color:#6f6f6f;">Events curated to your taste, not just what's trending</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">
                    <p style="margin:0;font-size:15px;color:#0f110f;font-weight:500;">👥 Social layer</p>
                    <p style="margin:4px 0 0;font-size:13px;color:#6f6f6f;">See what your friends are attending, saving, and rating</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;">
                    <p style="margin:0;font-size:15px;color:#0f110f;font-weight:500;">⚡ Scene Multiplier</p>
                    <p style="margin:4px 0 0;font-size:13px;color:#6f6f6f;">Your early actions earn double weight — recommendations get smarter faster</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 40px;">
              <p style="margin:0 0 8px;font-size:13px;color:#a9a9a9;">We'll reach out when early access opens. Stay tuned.</p>
              <p style="margin:0;font-size:13px;color:#a9a9a9;">— The GoOutside Club</p>
            </td>
          </tr>
          <tr>
            <td style="background:#f7f7f7;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#a9a9a9;">You're receiving this because you joined the GoOutside waitlist.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Waitlist error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
