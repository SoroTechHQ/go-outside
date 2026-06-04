import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Resend } from "resend";
import { supabaseAdmin } from "../../../../lib/supabase";
import type { AlphaFeedbackPayload, CapturedLog } from "../../../../lib/alpha";
import { DEV_EMAIL, FROM_EMAIL, FEEDBACK_TYPES } from "../../../../lib/alpha";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  const body: AlphaFeedbackPayload = await req.json();

  const { type, rating, message, screenshotDataUrl, pageUrl, browserInfo } = body;
  const linkUrl: string | undefined = (body as AlphaFeedbackPayload & { linkUrl?: string }).linkUrl;
  const consoleLogs: CapturedLog[] = (body as AlphaFeedbackPayload & { consoleLogs?: CapturedLog[] }).consoleLogs ?? [];
  if (!type || !message?.trim()) {
    return NextResponse.json({ error: "type and message required" }, { status: 400 });
  }

  // Resolve Supabase user id from clerk id
  let supabaseUserId: string | null = null;
  if (clerkId) {
    const { data } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("clerk_id", clerkId)
      .single();
    supabaseUserId = data?.id ?? null;
  }

  // Upload screenshot to Supabase Storage if provided
  let screenshotUrl: string | null = null;
  if (screenshotDataUrl?.startsWith("data:image/")) {
    try {
      const base64 = screenshotDataUrl.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64, "base64");
      const filename = `feedback-${Date.now()}.png`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from("alpha-screenshots")
        .upload(filename, buffer, { contentType: "image/png", upsert: false });

      if (!uploadError) {
        const { data: urlData } = supabaseAdmin.storage
          .from("alpha-screenshots")
          .getPublicUrl(filename);
        screenshotUrl = urlData?.publicUrl ?? null;
      }
    } catch {
      // Screenshot upload failed — continue without it
    }
  }

  // Store in DB
  await supabaseAdmin.from("alpha_feedback").insert({
    user_id:        supabaseUserId,
    type,
    rating:         rating ?? null,
    message:        message.trim(),
    screenshot_url: screenshotUrl,
    page_url:       pageUrl,
    link_url:       linkUrl?.trim() || null,
    browser_info:   browserInfo,
  });

  // Email the dev team
  const feedbackMeta = FEEDBACK_TYPES.find((f) => f.key === type);
  const label        = feedbackMeta ? `${feedbackMeta.emoji} ${feedbackMeta.label}` : type;
  const color        = feedbackMeta?.color ?? "#0f110f";
  const ratingStars  = rating ? "⭐".repeat(rating) + " " + `(${rating}/5)` : null;

  const screenshotBlock = screenshotUrl
    ? `<tr><td style="padding:0 0 16px;"><img src="${screenshotUrl}" style="width:100%;border-radius:8px;border:1px solid #ececec;" alt="Screenshot" /></td></tr>`
    : "";

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to:   DEV_EMAIL,
      subject: `[Alpha] ${label} — ${pageUrl.replace(/^https?:\/\/[^/]+/, "")}`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f7f7f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f7;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
        <tr>
          <td style="background:${color};padding:20px 28px;">
            <p style="margin:0;color:#fff;font-size:18px;font-weight:700;">${label}</p>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.75);font-size:12px;">${feedbackMeta?.description ?? ""}</p>
          </td>
        </tr>
        <tr><td style="padding:24px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            ${ratingStars ? `<tr><td style="padding:0 0 12px;font-size:14px;color:#0f110f;">${ratingStars}</td></tr>` : ""}
            <tr><td style="padding:0 0 20px;">
              <p style="margin:0;font-size:15px;color:#0f110f;line-height:1.6;white-space:pre-wrap;">${message.trim()}</p>
            </td></tr>
            ${screenshotBlock}
            <tr><td style="padding:16px 0 0;border-top:1px solid #f0f0f0;">
              <p style="margin:0 0 4px;font-size:11px;color:#a9a9a9;text-transform:uppercase;letter-spacing:0.5px;">Page</p>
              <p style="margin:0;font-size:13px;color:#0f110f;">${pageUrl}</p>
            </td></tr>
            ${linkUrl ? `<tr><td style="padding:12px 0 0;"><p style="margin:0 0 4px;font-size:11px;color:#a9a9a9;text-transform:uppercase;letter-spacing:0.5px;">Link / Recording</p><a href="${linkUrl}" style="margin:0;font-size:13px;color:#2f8f45;">${linkUrl}</a></td></tr>` : ""}
            <tr><td style="padding:12px 0 0;">
              <p style="margin:0 0 4px;font-size:11px;color:#a9a9a9;text-transform:uppercase;letter-spacing:0.5px;">Browser</p>
              <p style="margin:0;font-size:12px;color:#6f6f6f;">${browserInfo?.userAgent ?? "Unknown"}</p>
              <p style="margin:4px 0 0;font-size:12px;color:#6f6f6f;">
                ${browserInfo?.viewport?.width ?? "?"}×${browserInfo?.viewport?.height ?? "?"} · ${browserInfo?.platform ?? "?"} · ${browserInfo?.language ?? "?"}
              </p>
            </td></tr>
            ${supabaseUserId ? `<tr><td style="padding:12px 0 0;"><p style="margin:0 0 4px;font-size:11px;color:#a9a9a9;text-transform:uppercase;letter-spacing:0.5px;">User</p><p style="margin:0;font-size:12px;color:#6f6f6f;">${supabaseUserId}</p></td></tr>` : ""}
            ${consoleLogs.length > 0 ? `
            <tr><td style="padding:16px 0 0;">
              <p style="margin:0 0 6px;font-size:11px;color:#a9a9a9;text-transform:uppercase;letter-spacing:0.5px;">Console (last ${consoleLogs.length})</p>
              <div style="background:#111;border-radius:6px;padding:10px 12px;font-family:'Courier New',monospace;font-size:11px;max-height:300px;overflow:auto;">
                ${consoleLogs.slice(-30).map((l) => {
                  const color = l.level === "error" ? "#f87171" : l.level === "warn" ? "#fbbf24" : "#6b7280";
                  const time  = new Date(l.ts).toLocaleTimeString();
                  return `<div style="color:${color};margin-bottom:2px;">[${time}] ${l.level.toUpperCase()} ${l.args.join(" ").slice(0, 200)}</div>`;
                }).join("")}
              </div>
            </td></tr>` : ""}
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });
  } catch (err) {
    console.error("[alpha/feedback] Resend error:", err);
    // Still return success — the DB insert already happened
  }

  return NextResponse.json({ ok: true });
}
