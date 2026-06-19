/**
 * GoOutside — Centralized Email Library
 *
 * One domain: mail.gooutside.club
 * Theme: light mode only — white bg, dark text, green brand accents.
 *        Works correctly in every email client without dark-mode inversion issues.
 * Icons: Phosphor Bold SVGs hosted at gooutside.club/email-icons/
 */

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const BASE   = process.env.NEXT_PUBLIC_APP_URL ?? "https://gooutside.club";
const ICONS  = `${BASE}/email-icons`;

// ─── Colors (light mode) ──────────────────────────────────────────────────────
const BG      = "#f4f4f4";   // page background
const CARD    = "#ffffff";   // email card
const BORDER  = "#e8e8e8";   // card border
const BRAND   = "#4a9f63";   // GoOutside green (slightly darker for light bg legibility)
const BRAND_BG = "#edf7f0";  // light green tint
const BRAND_BD = "#b8dfc5";  // green border
const TEXT    = "#111111";   // headings
const BODY    = "#444444";   // body text
const MUTED   = "#888888";   // secondary text
const DIM     = "#aaaaaa";   // footer / meta

// ─── Senders ──────────────────────────────────────────────────────────────────
export const SENDERS = {
  general:  "GoOutside <hello@mail.gooutside.club>",
  tickets:  "GoOutside Tickets <tickets@mail.gooutside.club>",
  notify:   "GoOutside <noreply@mail.gooutside.club>",
  messages: "GoOutside Messages <messages@mail.gooutside.club>",
  pioneers: "Gabby from GoOutside <founders@mail.gooutside.club>",
  waitlist: "GoOutside <waitlist@mail.gooutside.club>",
} as const;

// ─── Headers ──────────────────────────────────────────────────────────────────
function notifHeaders(): Record<string, string> {
  return {
    "X-Category":            "notification",
    "X-App":                 "GoOutside",
    "List-Unsubscribe":      `<${BASE}/dashboard/settings>, <mailto:noreply@mail.gooutside.club?subject=unsubscribe>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}
function txnHeaders(extra?: Record<string, string>): Record<string, string> {
  return { "X-Category": "transactional", "X-App": "GoOutside", ...extra };
}

// ─── Public send functions ─────────────────────────────────────────────────────
export async function sendMessageNudge(opts: { to: string; senderName: string; channelUrl?: string }) {
  return resend.emails.send({
    from:    SENDERS.messages,
    to:      opts.to,
    subject: `💬 ${opts.senderName} is waiting for your reply`,
    headers: notifHeaders(),
    html:    buildNudgeEmail(opts.senderName, opts.channelUrl ?? `${BASE}/dashboard/messages`),
  });
}

export async function sendTicketReceipt(opts: {
  to: string; firstName: string; eventName: string; eventDate: string;
  ticketId: string; qrUrl: string; venue: string; venueAddress?: string;
  mapsUrl?: string; ticketType?: string;
}) {
  return resend.emails.send({
    from:    SENDERS.tickets,
    to:      opts.to,
    replyTo: "hello@mail.gooutside.club",
    subject: `🎟️ Your ticket for ${opts.eventName}`,
    headers: txnHeaders(),
    html:    buildTicketEmail(opts),
  });
}

export async function sendEventReminder(opts: {
  to: string; firstName: string; eventName: string;
  eventDate: string; venue: string; slug: string;
}) {
  return resend.emails.send({
    from:    SENDERS.notify,
    to:      opts.to,
    subject: `⏰ Starting in 2 hours: ${opts.eventName}`,
    headers: notifHeaders(),
    html:    buildReminderEmail(opts),
  });
}

export async function sendPioneerInvite(opts: { to: string; firstName: string }) {
  return resend.emails.send({
    from:    SENDERS.pioneers,
    to:      opts.to,
    replyTo: "hello@mail.gooutside.club",
    subject: `⚡ You're in — GoOutside Pulse Pioneers`,
    headers: txnHeaders({ "X-Program": "pulse-pioneers" }),
    html:    buildPioneerEmail(opts.firstName),
  });
}

export async function sendWaitlistConfirmation(opts: { to: string; firstName: string; roleLabel: string }) {
  return resend.emails.send({
    from:    SENDERS.waitlist,
    to:      opts.to,
    subject: `✅ You're on the list — GoOutside`,
    headers: txnHeaders(),
    html:    buildWaitlistEmail(opts.firstName, opts.roleLabel),
  });
}

export async function sendNewSignInEmail(opts: {
  to: string;
  device: string;
  browser: string;
  location: string;
  ip: string;
  time: string;
  signInMethod: string;
}): Promise<void> {
  try {
    await resend.emails.send({
      from:    SENDERS.notify,
      to:      opts.to,
      subject: "New sign-in to your GoOutside account",
      headers: txnHeaders(),
      html:    buildNewSignInEmail(opts),
    });
  } catch (err) {
    console.error("[email] sendNewSignInEmail failed:", err);
  }
}

export async function sendFollowEmail(opts: {
  to: string;
  followerName: string;
  followerUsername: string | null;
  followerAvatarUrl: string | null;
  followersCount?: number;
}): Promise<void> {
  try {
    await resend.emails.send({
      from:    SENDERS.notify,
      to:      opts.to,
      subject: `${opts.followerName} started following you on GoOutside`,
      headers: notifHeaders(),
      html:    buildFollowEmail(opts),
    });
  } catch (err) {
    console.error("[email] sendFollowEmail failed:", err);
  }
}

export async function sendPostLikeEmail(opts: {
  to: string;
  likerName: string;
  postPreview: string;
}): Promise<void> {
  try {
    await resend.emails.send({
      from:    SENDERS.notify,
      to:      opts.to,
      subject: `${opts.likerName} liked your post`,
      headers: notifHeaders(),
      html:    buildPostLikeEmail(opts),
    });
  } catch (err) {
    console.error("[email] sendPostLikeEmail failed:", err);
  }
}

// ─── Shell ────────────────────────────────────────────────────────────────────
function shell(content: string, footer?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>GoOutside</title>
  <style>
    body { margin: 0; padding: 0; background-color: ${BG}; }
    img  { display: block; border: 0; outline: none; }
    a    { color: ${BRAND}; }
  </style>
</head>
<body bgcolor="${BG}" style="margin:0;padding:0;background-color:${BG};">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" bgcolor="${BG}" style="background-color:${BG};padding:36px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;width:100%;">

        <!-- Wordmark -->
        <tr><td style="padding:0 0 20px 4px;">
          <span style="font-size:13px;font-weight:900;letter-spacing:0.18em;text-transform:uppercase;color:${BRAND};">GoOutside</span>
        </td></tr>

        <!-- Card -->
        <tr>
          <td bgcolor="${CARD}" style="background-color:${CARD};border:1px solid ${BORDER};border-radius:16px;padding:36px 36px 32px;overflow:hidden;">
            ${content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 4px 0;text-align:center;">
            <p style="margin:0;font-size:11px;color:${DIM};line-height:1.7;">
              ${footer ?? `GoOutside &nbsp;·&nbsp; Accra, Ghana<br>
              <a href="${BASE}/dashboard/settings" style="color:${DIM};text-decoration:underline;">Manage notifications</a>
              &nbsp;·&nbsp;
              <a href="mailto:hello@mail.gooutside.club" style="color:${DIM};text-decoration:underline;">Contact us</a>`}
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Shared helpers ───────────────────────────────────────────────────────────
function hr(): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:24px 0;">
    <tr><td bgcolor="${BORDER}" height="1" style="background-color:${BORDER};height:1px;line-height:1px;font-size:1px;">&nbsp;</td></tr>
  </table>`;
}

function eyebrow(text: string): string {
  return `<p style="margin:0 0 8px;font-size:9px;font-weight:900;letter-spacing:0.2em;text-transform:uppercase;color:${MUTED};">${text}</p>`;
}

// Phosphor icon — tinted green (brand color)
function ico(name: string, size = 16): string {
  return `<img src="${ICONS}/${name}.svg" width="${size}" height="${size}" alt="" style="display:inline-block;vertical-align:middle;filter:invert(48%) sepia(40%) saturate(600%) hue-rotate(105deg) brightness(0.85);">`;
}

function btn(label: string, url: string, outline = false): string {
  if (outline) {
    return `<a href="${url}" style="display:inline-block;background-color:transparent;color:${TEXT};font-size:13px;font-weight:700;text-decoration:none;padding:11px 22px;border-radius:100px;border:1.5px solid ${BORDER};">${label}</a>`;
  }
  return `<a href="${url}" style="display:inline-block;background-color:${BRAND};color:#ffffff;font-size:13px;font-weight:800;text-decoration:none;padding:12px 26px;border-radius:100px;">${label}</a>`;
}

// ─── 1. Message nudge ─────────────────────────────────────────────────────────
function buildNudgeEmail(senderName: string, url: string): string {
  return shell(`
    <p style="margin:0 0 6px;font-size:26px;">💬</p>
    <h1 style="margin:0 0 10px;font-size:22px;font-weight:700;color:${TEXT};letter-spacing:-0.02em;line-height:1.2;">
      ${senderName} is waiting for your reply
    </h1>
    <p style="margin:0 0 24px;font-size:14px;line-height:1.75;color:${BODY};">
      You received a message and haven't replied yet. Jump back into the conversation before it gets buried.
    </p>
    ${btn("Open messages", url)}
    ${hr()}
    <p style="margin:0;font-size:11px;color:${MUTED};">
      You're getting this because message re-engagement emails are on.
      <a href="${BASE}/dashboard/settings" style="color:${MUTED};text-decoration:underline;">Turn off</a>
    </p>
  `);
}

// ─── 2. Ticket receipt ────────────────────────────────────────────────────────
function buildTicketEmail(opts: {
  firstName: string; eventName: string; eventDate: string;
  ticketId: string; qrUrl: string; venue: string; venueAddress?: string;
  mapsUrl?: string; ticketType?: string;
}): string {
  const mapsUrl = opts.mapsUrl ?? `https://maps.google.com/?q=${encodeURIComponent(opts.venue + (opts.venueAddress ? ', ' + opts.venueAddress : ''))}`;

  return shell(`
    ${eyebrow("Your Ticket")}
    <h1 style="margin:0 0 4px;font-size:22px;font-weight:700;color:${TEXT};letter-spacing:-0.02em;">${opts.eventName}</h1>
    <p style="margin:0 0 20px;font-size:13px;color:${MUTED};">
      ${ico("calendar", 13)} &nbsp;${opts.eventDate} &nbsp;&nbsp; ${ico("map-pin", 13)} &nbsp;${opts.venue}
    </p>

    ${hr()}

    <!-- QR Code -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr><td align="center" style="padding:0 0 10px;">
        <div style="display:inline-block;border:1px solid ${BORDER};border-radius:12px;padding:16px;background:#fff;">
          <img src="${opts.qrUrl}" alt="Ticket QR code" width="180" height="180" style="display:block;width:180px;height:180px;">
        </div>
      </td></tr>
      <tr><td align="center" style="padding:0 0 20px;">
        <span style="font-size:10px;color:${MUTED};font-family:'Courier New',monospace;letter-spacing:0.12em;">${opts.ticketId}</span>
      </td></tr>
    </table>

    ${hr()}

    <!-- Guest info (Luma-style) -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:20px;">
      <tr>
        <td style="width:50%;vertical-align:top;padding-right:12px;">
          <p style="margin:0 0 2px;font-size:9px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${MUTED};">Guest</p>
          <p style="margin:0;font-size:13px;font-weight:600;color:${TEXT};">${opts.firstName}</p>
        </td>
        <td style="width:50%;vertical-align:top;">
          <p style="margin:0 0 2px;font-size:9px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${MUTED};">Status</p>
          <p style="margin:0;font-size:13px;font-weight:700;color:${BRAND};">Going ✓</p>
        </td>
      </tr>
      ${opts.ticketType ? `
      <tr><td colspan="2" style="padding-top:14px;">
        <p style="margin:0 0 2px;font-size:9px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${MUTED};">Ticket</p>
        <p style="margin:0;font-size:13px;color:${TEXT};">1× ${opts.ticketType}</p>
      </td></tr>` : ""}
    </table>

    ${hr()}

    <!-- Actions -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td style="width:50%;padding-right:6px;">
          <a href="${mapsUrl}" style="display:block;background-color:#f5f5f5;color:${TEXT};font-size:12px;font-weight:700;text-decoration:none;padding:11px 14px;border-radius:10px;text-align:center;border:1px solid ${BORDER};">
            ${ico("directions", 13)} &nbsp;Get Directions
          </a>
        </td>
        <td style="width:50%;padding-left:6px;">
          <a href="${BASE}/dashboard/wallets" style="display:block;background-color:${BRAND};color:#ffffff;font-size:12px;font-weight:800;text-decoration:none;padding:11px 14px;border-radius:10px;text-align:center;">
            ${ico("ticket", 13)} &nbsp;View in App
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:16px 0 0;font-size:12px;color:${MUTED};">
      Show this QR at the door. Your ticket is also saved in the app under <strong>Tickets</strong>.
    </p>
  `, `You received this because you purchased a ticket on GoOutside.<br>
     Questions? <a href="mailto:hello@mail.gooutside.club" style="color:${MUTED};text-decoration:underline;">hello@mail.gooutside.club</a>`);
}

// ─── 3. Event reminder ────────────────────────────────────────────────────────
function buildReminderEmail(opts: {
  firstName: string; eventName: string; eventDate: string; venue: string; slug: string;
}): string {
  return shell(`
    <div style="display:inline-block;background-color:#fffbea;border:1px solid #f0d060;border-radius:8px;padding:5px 12px;margin-bottom:18px;">
      <span style="font-size:10px;font-weight:800;color:#a07800;letter-spacing:0.12em;text-transform:uppercase;">⏰ Starting soon</span>
    </div>
    <h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:${TEXT};letter-spacing:-0.02em;">${opts.eventName}</h1>
    <p style="margin:0 0 20px;font-size:13px;color:${MUTED};">${opts.eventDate} &nbsp;·&nbsp; ${opts.venue}</p>
    <p style="margin:0 0 24px;font-size:14px;line-height:1.75;color:${BODY};">
      Hey ${opts.firstName} — this kicks off in about 2 hours. Your ticket is in the app. Time to start getting ready!
    </p>
    ${btn("View event details", `${BASE}/events/${opts.slug}`)}
    ${hr()}
    <p style="margin:0;font-size:11px;color:${MUTED};">
      <a href="${BASE}/dashboard/settings" style="color:${MUTED};text-decoration:underline;">Turn off event reminders</a>
    </p>
  `);
}

// ─── 4. Pulse Pioneers — Gabby, Gen Z, team voice ────────────────────────────
function buildPioneerEmail(firstName: string): string {
  return shell(`
    ${eyebrow("Pulse Pioneers")}
    <h1 style="margin:0 0 18px;font-size:26px;font-weight:700;line-height:1.15;color:${TEXT};letter-spacing:-0.03em;">
      Hey ${firstName}, you're in! 🎉
    </h1>

    <p style="margin:0 0 14px;font-size:14px;line-height:1.8;color:${BODY};">
      I'm Gabby — part of the team building GoOutside. We're a group of event enthusiasts who were done finding out about the best things in Accra too late, through some random WhatsApp forward.
    </p>
    <p style="margin:0 0 14px;font-size:14px;line-height:1.8;color:${BODY};">
      So we built GoOutside — a social events app that actually knows what you're into and shows you what's worth going out for. No spam. No filler. Just the good ones.
    </p>
    <p style="margin:0 0 24px;font-size:14px;line-height:1.8;color:${BODY};">
      You're one of the first people on it — not to "beta test" anything formal, just go out, vibe, and tell us what you actually think. Your honest take genuinely shapes this. No cap.
    </p>

    ${hr()}
    ${eyebrow("What you get as a Pioneer")}

    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr><td style="padding:12px 0;border-bottom:1px solid ${BORDER};">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="width:30px;vertical-align:top;padding-top:2px;">${ico("medal", 20)}</td>
          <td>
            <p style="margin:0 0 2px;font-size:13px;font-weight:700;color:${TEXT};">Pioneer Badge — forever on your profile</p>
            <p style="margin:0;font-size:12px;color:${MUTED};">This one's exclusive. Once we open publicly, nobody else gets it.</p>
          </td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:12px 0;border-bottom:1px solid ${BORDER};">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="width:30px;vertical-align:top;padding-top:2px;">${ico("lightning", 20)}</td>
          <td>
            <p style="margin:0 0 2px;font-size:13px;font-weight:700;color:${TEXT};">2× Pulse Points for 90 days</p>
            <p style="margin:0;font-size:12px;color:${MUTED};">Pulse is your scene score — how plugged into Accra you are. Yours starts higher and unlocks rewards faster than everyone else's.</p>
          </td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:12px 0;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="width:30px;vertical-align:top;padding-top:2px;">${ico("envelope", 20)}</td>
          <td>
            <p style="margin:0 0 2px;font-size:13px;font-weight:700;color:${TEXT};">Direct line to us</p>
            <p style="margin:0;font-size:12px;color:${MUTED};">Hit reply on this email — we read all of it. Broken, confusing, or actually fire? Tell us.</p>
          </td>
        </tr></table>
      </td></tr>
    </table>

    ${hr()}

    ${btn("Create your account", `${BASE}/sign-up`)}

    <p style="margin:24px 0 0;font-size:13px;line-height:1.7;color:${BODY};">
      Talk soon,<br>
      <strong style="color:${TEXT};font-size:14px;">Gabby</strong><br>
      <span style="font-size:11px;color:${MUTED};">GoOutside Team</span>
    </p>
  `, `You received this because you're in the GoOutside Pulse Pioneers program.<br>
     Reply to this email — it goes straight to Gabby.`);
}

// ─── 5. Waitlist confirmation ──────────────────────────────────────────────────
function buildWaitlistEmail(firstName: string, roleLabel: string): string {
  return shell(`
    <h1 style="margin:0 0 14px;font-size:24px;font-weight:700;color:${TEXT};letter-spacing:-0.02em;">
      You're on the list, ${firstName}. 🎉
    </h1>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.75;color:${BODY};">
      You joined as an <strong>${roleLabel}</strong> — we're building the social events app Accra deserves and you're getting in early.
    </p>

    <!-- Pioneers callout -->
    <div style="background-color:${BRAND_BG};border:1px solid ${BRAND_BD};border-radius:12px;padding:16px 20px;margin-bottom:20px;">
      <p style="margin:0 0 6px;font-size:10px;font-weight:900;color:${BRAND};letter-spacing:0.18em;text-transform:uppercase;">
        ${ico("lightning", 11)} &nbsp;Pulse Pioneers
      </p>
      <p style="margin:0;font-size:13px;color:#2d6e45;line-height:1.7;">
        Your <strong>Pioneer Badge</strong> lives on your profile permanently — and you earn Pulse Points at <strong>2× the rate</strong> for your first 90 days. The earlier you join, the bigger your head start.
      </p>
    </div>

    ${hr()}
    ${eyebrow("What's coming")}

    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr><td style="padding:10px 0;border-bottom:1px solid ${BORDER};">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="width:28px;vertical-align:top;">${ico("map-pin", 16)}</td>
          <td>
            <p style="margin:0 0 1px;font-size:13px;font-weight:600;color:${TEXT};">Personalised event feed</p>
            <p style="margin:0;font-size:12px;color:${MUTED};">Curated to your taste, not just what's trending</p>
          </td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid ${BORDER};">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="width:28px;vertical-align:top;">${ico("lightning", 16)}</td>
          <td>
            <p style="margin:0 0 1px;font-size:13px;font-weight:600;color:${TEXT};">Pulse Points</p>
            <p style="margin:0;font-size:12px;color:${MUTED};">Go out, earn points, redeem towards tickets and experiences</p>
          </td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:10px 0;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="width:28px;vertical-align:top;">${ico("chat", 16)}</td>
          <td>
            <p style="margin:0 0 1px;font-size:13px;font-weight:600;color:${TEXT};">Messaging</p>
            <p style="margin:0;font-size:12px;color:${MUTED};">DM friends, followers, and organizers in-app</p>
          </td>
        </tr></table>
      </td></tr>
    </table>

    ${hr()}
    <p style="margin:0;font-size:12px;color:${MUTED};">We'll reach out when early access opens. — The GoOutside Team</p>
  `, `Received because you joined the GoOutside waitlist.<br>
     <a href="mailto:hello@mail.gooutside.club" style="color:${DIM};text-decoration:underline;">hello@mail.gooutside.club</a>`);
}

// ─── 6. New sign-in alert ─────────────────────────────────────────────────────
function buildNewSignInEmail(opts: {
  device: string;
  browser: string;
  location: string;
  ip: string;
  time: string;
  signInMethod: string;
}): string {
  function row(label: string, value: string): string {
    return `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid ${BORDER};width:38%;font-size:12px;font-weight:600;color:${MUTED};vertical-align:top;">${label}</td>
        <td style="padding:10px 0;border-bottom:1px solid ${BORDER};font-size:12px;color:${TEXT};vertical-align:top;">${value}</td>
      </tr>`;
  }

  return shell(`
    ${eyebrow("Security alert")}
    <h1 style="margin:0 0 10px;font-size:22px;font-weight:700;color:${TEXT};letter-spacing:-0.02em;line-height:1.2;">
      New sign-in to your account
    </h1>
    <p style="margin:0 0 24px;font-size:14px;line-height:1.75;color:${BODY};">
      We noticed a new sign-in to your GoOutside account. If this was you, no action is needed. If you don't recognise this, secure your account immediately.
    </p>

    <div style="background-color:${BRAND_BG};border:1px solid ${BRAND_BD};border-radius:12px;padding:4px 20px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        ${row("Sign-in method", opts.signInMethod)}
        ${row("Device", opts.device)}
        ${row("Browser", opts.browser)}
        ${row("Location", opts.location)}
        ${row("IP address", opts.ip)}
        <tr>
          <td style="padding:10px 0;width:38%;font-size:12px;font-weight:600;color:${MUTED};vertical-align:top;">Time</td>
          <td style="padding:10px 0;font-size:12px;color:${TEXT};vertical-align:top;">${opts.time}</td>
        </tr>
      </table>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td style="padding-right:8px;">${btn("Secure my account", `${BASE}/settings`)}</td>
      </tr>
    </table>

    ${hr()}

    <p style="margin:0;font-size:12px;color:${MUTED};line-height:1.8;">
      <a href="${BASE}/settings" style="color:${BRAND};font-weight:600;text-decoration:none;">This was me</a>
      &nbsp;&nbsp;·&nbsp;&nbsp;
      <a href="${BASE}/settings" style="color:#c0392b;font-weight:600;text-decoration:none;">Not me? Secure your account</a>
    </p>
  `, `You received this security alert because a new session was created on your GoOutside account.<br>
     <a href="${BASE}/settings" style="color:${DIM};text-decoration:underline;">Manage security settings</a>`);
}

// ─── 7. New follower ──────────────────────────────────────────────────────────
function buildFollowEmail(opts: {
  followerName: string;
  followerUsername: string | null;
  followerAvatarUrl: string | null;
  followersCount?: number;
}): string {
  const profileUrl = opts.followerUsername
    ? `${BASE}/go/${opts.followerUsername}`
    : `${BASE}/home`;

  const avatarBlock = opts.followerAvatarUrl
    ? `<img src="${opts.followerAvatarUrl}" width="56" height="56" alt="${opts.followerName}" style="display:block;width:56px;height:56px;border-radius:50%;border:2px solid ${BORDER};object-fit:cover;">`
    : `<div style="width:56px;height:56px;border-radius:50%;background-color:${BRAND_BG};border:2px solid ${BRAND_BD};display:flex;align-items:center;justify-content:center;"><span style="font-size:22px;font-weight:700;color:${BRAND};">${opts.followerName.charAt(0).toUpperCase()}</span></div>`;

  return shell(`
    ${eyebrow("New follower")}
    <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:${TEXT};letter-spacing:-0.02em;line-height:1.2;">
      ${opts.followerName} started following you
    </h1>

    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:24px;">
      <tr>
        <td style="width:68px;vertical-align:top;">
          ${avatarBlock}
        </td>
        <td style="vertical-align:middle;padding-left:14px;">
          <p style="margin:0 0 3px;font-size:15px;font-weight:700;color:${TEXT};">${opts.followerName}</p>
          ${opts.followerUsername ? `<p style="margin:0;font-size:12px;color:${MUTED};">@${opts.followerUsername}</p>` : ""}
        </td>
      </tr>
    </table>

    ${btn("View their profile", profileUrl)}

    ${hr()}
    <p style="margin:0;font-size:11px;color:${MUTED};">
      You're getting this because follow notifications are on.
      <a href="${BASE}/dashboard/settings" style="color:${MUTED};text-decoration:underline;">Turn off</a>
    </p>
  `);
}

// ─── 8. Post liked ────────────────────────────────────────────────────────────
function buildPostLikeEmail(opts: {
  likerName: string;
  postPreview: string;
}): string {
  const excerpt = opts.postPreview.length > 120
    ? opts.postPreview.slice(0, 117) + "..."
    : opts.postPreview;

  return shell(`
    ${eyebrow("Activity")}
    <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:${TEXT};letter-spacing:-0.02em;line-height:1.2;">
      ${opts.likerName} liked your post
    </h1>

    <div style="background-color:#f8f8f8;border-left:3px solid ${BRAND};border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:${BODY};line-height:1.7;font-style:italic;">"${excerpt}"</p>
    </div>

    ${btn("See your post", `${BASE}/dashboard/profile`)}

    ${hr()}
    <p style="margin:0;font-size:11px;color:${MUTED};">
      You're getting this because post activity notifications are on.
      <a href="${BASE}/dashboard/settings" style="color:${MUTED};text-decoration:underline;">Turn off</a>
    </p>
  `);
}
