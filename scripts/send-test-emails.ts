/**
 * Run with: npx tsx scripts/send-test-emails.ts
 * Sends one test email of each type to the address below.
 */

import { Resend } from "resend";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../apps/web/.env.local") });

const TO      = "nanaamoako202@gmail.com";
const BASE    = "https://gooutside.club";
const BRAND   = "#5FBF2A";
const BG      = "#0a0a0a";
const CARD    = "#111111";
const BORDER  = "#1e1e1e";
const WHITE   = "#ffffff";
const MUTED   = "#a0a0a0";
const DIM     = "#444444";

const resend  = new Resend(process.env.RESEND_API_KEY);

async function main() {

function hr() {
  return `<div style="height:1px;background:${BORDER};margin:28px 0;"></div>`;
}

function label(t: string) {
  return `<p style="margin:0 0 10px;font-size:10px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:${DIM};">${t}</p>`;
}

function shell(content: string, footer?: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>GoOutside</title></head>
<body style="margin:0;padding:0;background:${BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:${BG};padding:48px 16px;">
    <tr><td align="center">
      <table width="540" cellpadding="0" cellspacing="0" role="presentation" style="max-width:540px;width:100%;">
        <tr><td style="padding:0 0 32px 4px;">
          <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:${BRAND};">⬡ GoOutside</p>
        </td></tr>
        <tr><td style="background:${CARD};border:1px solid ${BORDER};border-radius:24px;padding:40px 40px 36px;">
          ${content}
        </td></tr>
        <tr><td style="padding:24px 4px 0;">
          <p style="margin:0;font-size:11px;color:${DIM};line-height:1.7;text-align:center;">
            ${footer ?? `GoOutside · Accra, Ghana<br>
            <a href="${BASE}/dashboard/settings" style="color:${DIM};">Manage notifications</a> ·
            <a href="mailto:hello@mail.gooutside.club" style="color:${DIM};">Contact us</a>`}
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

async function send(label_: string, opts: Parameters<typeof resend.emails.send>[0]) {
  try {
    const r = await resend.emails.send(opts);
    if (r.error) throw new Error(r.error.message);
    console.log(`✅  ${label_}: sent (id: ${r.data?.id})`);
  } catch (e) {
    console.error(`❌  ${label_}: ${(e as Error).message}`);
  }
}

// ── 1. Message nudge ──────────────────────────────────────────────────────────
await send("Message nudge", {
  from:    "GoOutside <noreply@mail.gooutside.club>",
  to:      TO,
  subject: "💬 Kofi Mensah is waiting for your reply",
  headers: {
    "X-Category":            "notification",
    "List-Unsubscribe":      `<${BASE}/dashboard/settings>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  },
  html: shell(`
    <div style="font-size:36px;margin:0 0 20px;">💬</div>
    <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:${WHITE};letter-spacing:-0.02em;line-height:1.2;">Kofi Mensah is waiting for your reply</h1>
    <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:${MUTED};">You received a message and haven't replied yet. Tap below to jump back in before it gets buried.</p>
    <a href="${BASE}/dashboard/messages" style="display:inline-block;background:${BRAND};color:#fff;font-size:14px;font-weight:700;text-decoration:none;padding:13px 28px;border-radius:100px;">💬 &nbsp;Open messages</a>
    ${hr()}
    <p style="margin:0;font-size:12px;color:${DIM};">You're getting this because message re-engagement emails are on. <a href="${BASE}/dashboard/settings" style="color:${DIM};text-decoration:underline;">Turn off</a></p>
  `),
});

// ── 2. Ticket receipt ─────────────────────────────────────────────────────────
const qrUrl = "https://api.qrserver.com/v1/create-qr-code/?data=GOOUTSIDE-TEST-001&size=200x200&color=000000&bgcolor=ffffff&margin=10";
await send("Ticket receipt", {
  from:    "GoOutside Tickets <tickets@mail.gooutside.club>",
  to:      TO,
  replyTo: "hello@mail.gooutside.club",
  subject: "🎟️ Your ticket for Afro Nation Ghana 2026",
  headers: { "X-Category": "transactional" },
  html: shell(`
    ${label("🎟️  Your ticket")}
    <h1 style="margin:0 0 6px;font-size:26px;font-weight:700;color:${WHITE};letter-spacing:-0.02em;">Afro Nation Ghana 2026</h1>
    <p style="margin:0 0 24px;font-size:14px;color:${MUTED};">📅 &nbsp;Sat, 28 Dec · 8:00 PM GMT &nbsp;&nbsp; 📍 &nbsp;Laboma Beach, Accra</p>
    <div style="background:#ffffff;border-radius:16px;padding:20px;text-align:center;margin:0 0 16px;display:inline-block;">
      <img src="${qrUrl}" alt="Ticket QR" width="200" height="200" style="display:block;border-radius:8px;">
    </div>
    <p style="margin:0 0 28px;font-size:11px;color:${DIM};font-family:'Courier New',monospace;letter-spacing:0.12em;">GOOUT-TEST-001</p>
    ${hr()}
    <p style="margin:0 0 6px;font-size:14px;color:${MUTED};">📱 &nbsp;Show this QR at the door. Your ticket is also in the app under <strong style="color:${WHITE};">Tickets</strong>.</p>
    <p style="margin:0 0 24px;font-size:14px;color:${MUTED};">🙋 &nbsp;Hey Nana — enjoy the event!</p>
    <a href="${BASE}/dashboard/tickets" style="display:inline-block;background:#1c1c1c;color:${WHITE};font-size:14px;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:100px;border:1px solid ${BORDER};">View ticket in app →</a>
  `, `You received this because you purchased a ticket on GoOutside.<br>
      Questions? <a href="mailto:hello@mail.gooutside.club" style="color:${DIM};">hello@mail.gooutside.club</a>`),
});

// ── 3. Event reminder ─────────────────────────────────────────────────────────
await send("Event reminder", {
  from:    "GoOutside <noreply@mail.gooutside.club>",
  to:      TO,
  subject: "⏰ Starting in 2 hours: Chale Wote Street Art Festival",
  headers: { "X-Category": "notification", "List-Unsubscribe": `<${BASE}/dashboard/settings>` },
  html: shell(`
    <div style="display:inline-block;background:#1a2a0a;border:1px solid #3a5a1a;border-radius:10px;padding:6px 14px;margin-bottom:20px;">
      <p style="margin:0;font-size:11px;font-weight:700;color:${BRAND};letter-spacing:0.1em;text-transform:uppercase;">⏰ &nbsp;Starting soon</p>
    </div>
    <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:${WHITE};letter-spacing:-0.02em;">Chale Wote Street Art Festival</h1>
    <p style="margin:0 0 24px;font-size:14px;color:${MUTED};">📅 &nbsp;Sat, 15 Aug · 4:00 PM GMT &nbsp;&nbsp; 📍 &nbsp;James Town, Accra</p>
    <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:${MUTED};">Hey Nana — this kicks off in about 2 hours. Your ticket is ready in the app. Don't be late! 🏃</p>
    <a href="${BASE}/events/chale-wote-2026" style="display:inline-block;background:${BRAND};color:#fff;font-size:14px;font-weight:700;text-decoration:none;padding:13px 28px;border-radius:100px;">📍 &nbsp;View event details</a>
    ${hr()}
    <p style="margin:0;font-size:12px;color:${DIM};"><a href="${BASE}/dashboard/settings" style="color:${DIM};text-decoration:underline;">Turn off event reminders</a></p>
  `),
});

// ── 4. Pulse Pioneers invite ───────────────────────────────────────────────────
await send("Pulse Pioneers invite", {
  from:    "GoOutside Pioneers <founders@mail.gooutside.club>",
  to:      TO,
  replyTo: "hello@mail.gooutside.club",
  subject: "⚡ You're a Pulse Pioneer — GoOutside",
  headers: { "X-Category": "transactional", "X-Program": "pulse-pioneers" },
  html: shell(`
    ${label("⚡  Pulse Pioneers")}
    <h1 style="margin:0 0 20px;font-size:32px;font-weight:700;line-height:1.1;color:${WHITE};letter-spacing:-0.03em;">Hey Nana.<br>You're a Pioneer.</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${MUTED};">I'm Nana. I'm building GoOutside — a social events app made for Ghana. The kind of app that knows what you're into, shows you what's actually worth leaving the house for, and makes going out with people feel easy.</p>
    <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:${MUTED};">You're one of the first people using it. Not to "test" it in some formal sense — just go out, use it for real, and tell me honestly what you think. That's the whole ask.</p>
    ${hr()}
    ${label("What pioneers get")}
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:14px 0;border-bottom:1px solid ${BORDER};">
        <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:${WHITE};">🏅 &nbsp;Pioneer Badge</p>
        <p style="margin:0;font-size:13px;color:${MUTED};">Permanent on your profile. Nobody gets this once we open up publicly.</p>
      </td></tr>
      <tr><td style="padding:14px 0;border-bottom:1px solid ${BORDER};">
        <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:${WHITE};">⚡ &nbsp;2× Pulse Points for 90 days</p>
        <p style="margin:0;font-size:13px;color:${MUTED};">Pulse measures how plugged into the scene you are. Yours starts higher and unlocks rewards faster than everyone else's.</p>
      </td></tr>
      <tr><td style="padding:14px 0;">
        <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:${WHITE};">📩 &nbsp;Direct line to me</p>
        <p style="margin:0;font-size:13px;color:${MUTED};">Just reply to this email. If something's broken, confusing, or missing — I want to hear it.</p>
      </td></tr>
    </table>
    ${hr()}
    <a href="${BASE}/sign-up" style="display:inline-block;background:${BRAND};color:#fff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:100px;">🚀 &nbsp;Create your account</a>
    <p style="margin:28px 0 0;font-size:14px;color:${MUTED};">Talk soon,<br><strong style="color:${WHITE};">Nana</strong><br><span style="font-size:12px;color:${DIM};">Founder, GoOutside</span></p>
  `, `You received this because you're part of the GoOutside Pulse Pioneers program.<br>Questions? Just reply — it goes straight to Nana.`),
});

// ── 5. Waitlist confirmation ───────────────────────────────────────────────────
await send("Waitlist confirmation", {
  from:    "GoOutside <waitlist@mail.gooutside.club>",
  to:      TO,
  subject: "✅ You're on the list — GoOutside",
  headers: { "X-Category": "transactional" },
  html: shell(`
    <div style="font-size:36px;margin:0 0 20px;">🎉</div>
    <h1 style="margin:0 0 14px;font-size:28px;font-weight:700;color:${WHITE};letter-spacing:-0.02em;">You're on the list, Nana.</h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:${MUTED};">You joined as an <strong style="color:${WHITE};">event goer</strong> — we're building the social events app Accra deserves and you're getting in early.</p>
    <div style="background:#0d1f08;border:1px solid #2d4f18;border-radius:16px;padding:20px 24px;margin-bottom:28px;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:${BRAND};">⚡ Pulse Pioneers — Early Access</p>
      <p style="margin:0;font-size:13px;color:#8ac97a;line-height:1.7;">You're among our first users. Your <strong>Pioneer Badge</strong> lives on your profile permanently, and you earn Pulse Points at <strong>2× the normal rate</strong> for your first 90 days.</p>
    </div>
    ${hr()}
    ${label("What's coming")}
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:12px 0;border-bottom:1px solid ${BORDER};">
        <p style="margin:0 0 3px;font-size:14px;font-weight:500;color:${WHITE};">🗺️ &nbsp;Personalised event feed</p>
        <p style="margin:0;font-size:13px;color:${MUTED};">Events curated to your taste, not just what's trending</p>
      </td></tr>
      <tr><td style="padding:12px 0;border-bottom:1px solid ${BORDER};">
        <p style="margin:0 0 3px;font-size:14px;font-weight:500;color:${WHITE};">👥 &nbsp;Social layer</p>
        <p style="margin:0;font-size:13px;color:${MUTED};">See what friends are attending, saving, and rating</p>
      </td></tr>
      <tr><td style="padding:12px 0;border-bottom:1px solid ${BORDER};">
        <p style="margin:0 0 3px;font-size:14px;font-weight:500;color:${WHITE};">⚡ &nbsp;Pulse Points</p>
        <p style="margin:0;font-size:13px;color:${MUTED};">Go out, earn points, unlock real value towards tickets</p>
      </td></tr>
      <tr><td style="padding:12px 0;">
        <p style="margin:0 0 3px;font-size:14px;font-weight:500;color:${WHITE};">💬 &nbsp;Messaging</p>
        <p style="margin:0;font-size:13px;color:${MUTED};">DM friends, followers, and organizers — all inside the app</p>
      </td></tr>
    </table>
    ${hr()}
    <p style="margin:0;font-size:13px;color:${DIM};">We'll reach out when early access opens. — The GoOutside Team 🌿</p>
  `, `You received this because you joined the GoOutside waitlist.<br>
      <a href="mailto:hello@mail.gooutside.club" style="color:${DIM};">hello@mail.gooutside.club</a>`),
});

  console.log("\nDone. Check nanaamoako202@gmail.com for all 5 emails.");
}

main().catch(console.error);
