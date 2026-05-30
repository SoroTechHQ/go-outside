/**
 * GoOutside — Centralized Email Library
 *
 * One domain: mail.gooutside.club
 * Icons: Phosphor Bold hosted at gooutside.club/email-icons/
 * Dark mode: forced dark via bgcolor HTML attributes + CSS meta on every element
 */

import { Resend } from "resend";

const resend  = new Resend(process.env.RESEND_API_KEY);
const BASE    = process.env.NEXT_PUBLIC_APP_URL ?? "https://gooutside.club";
const ICONS   = `${BASE}/email-icons`;

// ─── Brand colors ─────────────────────────────────────────────────────────────
const BG     = "#0a0a0a";
const CARD   = "#141414";
const BORD   = "#242424";
const BRAND  = "#5FBF2A";
const WHITE  = "#ffffff";
const MUTED  = "#999999";
const DIM    = "#555555";
const GREEN_DIM  = "#0f2008";
const GREEN_BORD = "#2a4a14";
const GREEN_TEXT = "#7ec45e";

// ─── Senders ──────────────────────────────────────────────────────────────────
export const SENDERS = {
  general:  "GoOutside <hello@mail.gooutside.club>",
  tickets:  "GoOutside Tickets <tickets@mail.gooutside.club>",
  notify:   "GoOutside <noreply@mail.gooutside.club>",
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
    from:    SENDERS.notify,
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

// ─── Shell (dark mode forced via bgcolor + CSS) ───────────────────────────────
// Dark mode fix strategy:
//   1. bgcolor HTML attribute on every table/td (ignored by CSS but respected by Outlook/legacy)
//   2. inline background-color on every element
//   3. <meta name="color-scheme"> tells Apple Mail / Gmail we're already dark
//   4. !important on body bg prevents Gmail from inverting

function shell(content: string, footer?: string): string {
  return `<!DOCTYPE html>
<html lang="en" style="background-color:${BG};">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>GoOutside</title>
  <style>
    :root { color-scheme: dark; }
    body  { background-color: ${BG} !important; margin: 0 !important; padding: 0 !important; }
    table { border-collapse: collapse; }
    img   { display: block; border: 0; outline: none; }
    a     { color: inherit; }
    /* Stop Gmail / Yahoo dark-mode inversion */
    [data-ogsc] .go-card  { background-color: ${CARD} !important; }
    [data-ogsc] body      { background-color: ${BG}   !important; }
    @media (prefers-color-scheme: dark) {
      body      { background-color: ${BG}   !important; }
      .go-wrap  { background-color: ${BG}   !important; }
      .go-card  { background-color: ${CARD} !important; }
    }
  </style>
</head>
<body bgcolor="${BG}" style="margin:0;padding:0;background-color:${BG} !important;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <!--[if mso]><table width="100%" bgcolor="${BG}" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
  <table class="go-wrap" width="100%" cellpadding="0" cellspacing="0" role="presentation" bgcolor="${BG}" style="background-color:${BG};padding:44px 16px;">
    <tr><td align="center" bgcolor="${BG}" style="background-color:${BG};">
      <table width="520" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px;width:100%;">

        <!-- Wordmark -->
        <tr>
          <td bgcolor="${BG}" style="background-color:${BG};padding:0 0 24px 2px;">
            <span style="font-size:10px;font-weight:900;letter-spacing:0.22em;text-transform:uppercase;color:${BRAND};">GoOutside</span>
          </td>
        </tr>

        <!-- Card -->
        <tr>
          <td class="go-card" bgcolor="${CARD}" style="background-color:${CARD};border:1px solid ${BORD};border-radius:20px;padding:36px 36px 32px;">
            ${content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td bgcolor="${BG}" style="background-color:${BG};padding:20px 4px 0;text-align:center;">
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
  <!--[if mso]></td></tr></table><![endif]-->
</body>
</html>`;
}

// ─── Shared components ────────────────────────────────────────────────────────
function hr(): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:24px 0;">
    <tr><td bgcolor="${BORD}" height="1" style="background-color:${BORD};height:1px;line-height:1px;font-size:1px;">&nbsp;</td></tr>
  </table>`;
}

function eyebrow(text: string): string {
  return `<p style="margin:0 0 10px;font-size:9px;font-weight:900;letter-spacing:0.22em;text-transform:uppercase;color:${DIM};">${text}</p>`;
}

function icon(name: string, size = 18, color = WHITE): string {
  // SVG hosted on gooutside.club — served as external image
  // Inline style sets the color via CSS filter for white icons on dark BG
  return `<img src="${ICONS}/${name}.svg" width="${size}" height="${size}" alt="" style="width:${size}px;height:${size}px;display:inline-block;vertical-align:middle;filter:invert(1) brightness(2);opacity:0.9;">`;
}

function brandIcon(name: string, size = 18): string {
  // Green brand colored icon
  return `<img src="${ICONS}/${name}.svg" width="${size}" height="${size}" alt="" style="width:${size}px;height:${size}px;display:inline-block;vertical-align:middle;filter:invert(63%) sepia(60%) saturate(500%) hue-rotate(70deg) brightness(1.1);">`;
}

function btn(label: string, url: string, outline = false): string {
  if (outline) {
    return `<a href="${url}" style="display:inline-block;background-color:transparent;color:${WHITE};font-size:13px;font-weight:700;text-decoration:none;padding:11px 22px;border-radius:100px;border:1.5px solid ${BORD};">${label}</a>`;
  }
  return `<a href="${url}" style="display:inline-block;background-color:${BRAND};color:#050505;font-size:13px;font-weight:800;text-decoration:none;padding:12px 24px;border-radius:100px;">${label}</a>`;
}

// ─── 1. Message nudge ─────────────────────────────────────────────────────────
function buildNudgeEmail(senderName: string, url: string): string {
  return shell(`
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr><td bgcolor="${CARD}" style="padding:0 0 20px;">
        <div style="display:inline-block;background-color:#161e10;border-radius:50%;padding:14px;">
          ${brandIcon("chat", 24)}
        </div>
      </td></tr>
      <tr><td bgcolor="${CARD}" style="padding:0 0 10px;">
        <h1 style="margin:0;font-size:22px;font-weight:700;color:${WHITE};letter-spacing:-0.02em;line-height:1.2;">${senderName} sent you a message</h1>
      </td></tr>
      <tr><td bgcolor="${CARD}" style="padding:0 0 24px;">
        <p style="margin:0;font-size:14px;line-height:1.7;color:${MUTED};">You haven't replied yet. Jump back into the conversation — they're waiting on you.</p>
      </td></tr>
      <tr><td bgcolor="${CARD}" style="padding:0 0 24px;">${btn("Open messages", url)}</td></tr>
    </table>
    ${hr()}
    <p style="margin:0;font-size:11px;color:${DIM};">Re-engagement emails are on. <a href="${BASE}/dashboard/settings" style="color:${DIM};text-decoration:underline;">Turn off</a></p>
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
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr><td bgcolor="${CARD}" style="padding:0 0 6px;">${eyebrow("Your Ticket")}</td></tr>
      <tr><td bgcolor="${CARD}" style="padding:0 0 4px;">
        <h1 style="margin:0;font-size:22px;font-weight:700;color:${WHITE};letter-spacing:-0.02em;line-height:1.25;">${opts.eventName}</h1>
      </td></tr>
      <tr><td bgcolor="${CARD}" style="padding:0 0 20px;">
        <p style="margin:0;font-size:13px;color:${MUTED};">
          ${brandIcon("calendar", 13)} &nbsp;${opts.eventDate}&nbsp;&nbsp;
          ${brandIcon("map-pin", 13)} &nbsp;${opts.venue}
        </p>
      </td></tr>
    </table>

    ${hr()}

    <!-- QR Code block -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr><td bgcolor="${CARD}" align="center" style="padding:0 0 12px;">
        <div style="display:inline-block;background-color:#ffffff;border-radius:14px;padding:16px;">
          <img src="${opts.qrUrl}" alt="Ticket QR code" width="180" height="180" style="display:block;border-radius:6px;width:180px;height:180px;">
        </div>
      </td></tr>
      <tr><td bgcolor="${CARD}" align="center" style="padding:0 0 20px;">
        <span style="font-size:10px;color:${DIM};font-family:'Courier New',Courier,monospace;letter-spacing:0.14em;">${opts.ticketId}</span>
      </td></tr>
    </table>

    ${hr()}

    <!-- Guest info (Luma-style) -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:20px;">
      <tr>
        <td bgcolor="${CARD}" style="width:50%;padding:0 12px 0 0;vertical-align:top;">
          <p style="margin:0 0 3px;font-size:9px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${DIM};">Guest</p>
          <p style="margin:0;font-size:13px;font-weight:600;color:${WHITE};">${opts.firstName}</p>
        </td>
        <td bgcolor="${CARD}" style="width:50%;vertical-align:top;">
          <p style="margin:0 0 3px;font-size:9px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${DIM};">Status</p>
          <p style="margin:0;font-size:13px;font-weight:700;color:${BRAND};">Going</p>
        </td>
      </tr>
      ${opts.ticketType ? `
      <tr>
        <td bgcolor="${CARD}" colspan="2" style="padding:12px 0 0;">
          <p style="margin:0 0 3px;font-size:9px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${DIM};">Ticket</p>
          <p style="margin:0;font-size:13px;color:${WHITE};">1× ${opts.ticketType}</p>
        </td>
      </tr>` : ""}
    </table>

    ${hr()}

    <!-- Actions (Luma-style) -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td bgcolor="${CARD}" style="padding:0 8px 0 0;width:50%;">
          <a href="${mapsUrl}" style="display:block;background-color:#1a1a1a;color:${WHITE};font-size:13px;font-weight:700;text-decoration:none;padding:12px 16px;border-radius:12px;text-align:center;border:1px solid ${BORD};">
            ${icon("directions", 14)} &nbsp;Get Directions
          </a>
        </td>
        <td bgcolor="${CARD}" style="padding:0 0 0 8px;width:50%;">
          <a href="${BASE}/dashboard/tickets" style="display:block;background-color:${BRAND};color:#050505;font-size:13px;font-weight:800;text-decoration:none;padding:12px 16px;border-radius:12px;text-align:center;">
            ${icon("ticket", 14)} &nbsp;View in App
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:20px 0 0;font-size:12px;color:${DIM};">
      ${icon("map-pin", 12)} &nbsp;Show this QR at the door. Your ticket is also saved in the app under <strong style="color:${MUTED};">Tickets</strong>.
    </p>
  `, `You received this because you purchased a ticket on GoOutside.<br>
     Questions? <a href="mailto:hello@mail.gooutside.club" style="color:${DIM};text-decoration:underline;">hello@mail.gooutside.club</a>`);
}

// ─── 3. Event reminder ────────────────────────────────────────────────────────
function buildReminderEmail(opts: {
  firstName: string; eventName: string; eventDate: string; venue: string; slug: string;
}): string {
  const url = `${BASE}/events/${opts.slug}`;
  return shell(`
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr><td bgcolor="${CARD}" style="padding:0 0 16px;">
        <div style="display:inline-block;background-color:#1a1a10;border:1px solid #3a3a14;border-radius:8px;padding:5px 12px;">
          <span style="font-size:10px;font-weight:800;color:#d4b400;letter-spacing:0.14em;text-transform:uppercase;">${brandIcon("bell", 11)} &nbsp;Starting soon</span>
        </div>
      </td></tr>
      <tr><td bgcolor="${CARD}" style="padding:0 0 6px;">
        <h1 style="margin:0;font-size:22px;font-weight:700;color:${WHITE};letter-spacing:-0.02em;">${opts.eventName}</h1>
      </td></tr>
      <tr><td bgcolor="${CARD}" style="padding:0 0 20px;">
        <p style="margin:0;font-size:13px;color:${MUTED};">${opts.eventDate} &nbsp;·&nbsp; ${opts.venue}</p>
      </td></tr>
      <tr><td bgcolor="${CARD}" style="padding:0 0 24px;">
        <p style="margin:0;font-size:14px;line-height:1.7;color:${MUTED};">Hey ${opts.firstName} — this kicks off in about 2 hours. Your ticket is ready in the app.</p>
      </td></tr>
      <tr><td bgcolor="${CARD}" style="padding:0 0 0;">${btn("View event details", url)}</td></tr>
    </table>
    ${hr()}
    <p style="margin:0;font-size:11px;color:${DIM};">
      <a href="${BASE}/dashboard/settings" style="color:${DIM};text-decoration:underline;">Turn off event reminders</a>
    </p>
  `);
}

// ─── 4. Pulse Pioneers invite (Gabby, Gen Z, team voice) ──────────────────────
function buildPioneerEmail(firstName: string): string {
  return shell(`
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr><td bgcolor="${CARD}" style="padding:0 0 8px;">${eyebrow("⚡ Pulse Pioneers")}</td></tr>
      <tr><td bgcolor="${CARD}" style="padding:0 0 20px;">
        <h1 style="margin:0;font-size:26px;font-weight:700;line-height:1.15;color:${WHITE};letter-spacing:-0.03em;">
          Hey ${firstName}, you're in! 🎉
        </h1>
      </td></tr>
      <tr><td bgcolor="${CARD}" style="padding:0 0 14px;">
        <p style="margin:0;font-size:14px;line-height:1.8;color:${MUTED};">
          I'm Gabby — part of the team building GoOutside. We're a group of event enthusiasts who are done with finding out about the best things in Accra too late, through a random WhatsApp forward.
        </p>
      </td></tr>
      <tr><td bgcolor="${CARD}" style="padding:0 0 14px;">
        <p style="margin:0;font-size:14px;line-height:1.8;color:${MUTED};">
          So we built GoOutside — a social events app that actually knows what you're into and shows you what's worth leaving the house for. No spam. No boring stuff. Just the good ones.
        </p>
      </td></tr>
      <tr><td bgcolor="${CARD}" style="padding:0 0 24px;">
        <p style="margin:0;font-size:14px;line-height:1.8;color:${MUTED};">
          You're one of the first people on it — not to "beta test" anything formal, just to go out, vibe, and let us know what you think. Your honest take is genuinely what shapes this. That's it, no cap.
        </p>
      </td></tr>
    </table>

    ${hr()}
    ${eyebrow("What you get as a Pioneer")}

    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:4px;">
      <tr><td bgcolor="${CARD}" style="padding:12px 0;border-bottom:1px solid ${BORD};">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="width:32px;vertical-align:top;padding-top:2px;">${brandIcon("medal", 20)}</td>
          <td bgcolor="${CARD}">
            <p style="margin:0 0 2px;font-size:13px;font-weight:700;color:${WHITE};">Pioneer Badge — forever on your profile</p>
            <p style="margin:0;font-size:12px;color:${MUTED};">This one's exclusive. Once we open up publicly, nobody else gets it.</p>
          </td>
        </tr></table>
      </td></tr>
      <tr><td bgcolor="${CARD}" style="padding:12px 0;border-bottom:1px solid ${BORD};">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="width:32px;vertical-align:top;padding-top:2px;">${brandIcon("lightning", 20)}</td>
          <td bgcolor="${CARD}">
            <p style="margin:0 0 2px;font-size:13px;font-weight:700;color:${WHITE};">2× Pulse Points for 90 days</p>
            <p style="margin:0;font-size:12px;color:${MUTED};">Pulse is your scene score — how plugged in you are. Yours starts higher and unlocks rewards faster than everyone else's.</p>
          </td>
        </tr></table>
      </td></tr>
      <tr><td bgcolor="${CARD}" style="padding:12px 0;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="width:32px;vertical-align:top;padding-top:2px;">${brandIcon("envelope", 20)}</td>
          <td bgcolor="${CARD}">
            <p style="margin:0 0 2px;font-size:13px;font-weight:700;color:${WHITE};">Direct line to our team</p>
            <p style="margin:0;font-size:12px;color:${MUTED};">Hit reply on this email. Seriously — we read all of it. Broken, confusing, amazing? Tell us.</p>
          </td>
        </tr></table>
      </td></tr>
    </table>

    ${hr()}

    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr><td bgcolor="${CARD}" style="padding:0 0 20px;">${btn("Create your account", `${BASE}/sign-up`)}</td></tr>
      <tr><td bgcolor="${CARD}">
        <p style="margin:0;font-size:13px;line-height:1.7;color:${MUTED};">
          Talk soon,<br>
          <strong style="color:${WHITE};font-size:14px;">Gabby</strong><br>
          <span style="font-size:11px;color:${DIM};">GoOutside Team</span>
        </p>
      </td></tr>
    </table>
  `, `You received this because you're in the GoOutside Pulse Pioneers program.<br>
     Reply to this email — it goes straight to Gabby.`);
}

// ─── 5. Waitlist confirmation ──────────────────────────────────────────────────
function buildWaitlistEmail(firstName: string, roleLabel: string): string {
  return shell(`
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr><td bgcolor="${CARD}" style="padding:0 0 18px;">
        <h1 style="margin:0;font-size:24px;font-weight:700;color:${WHITE};letter-spacing:-0.02em;line-height:1.2;">
          You're on the list, ${firstName}.
        </h1>
      </td></tr>
      <tr><td bgcolor="${CARD}" style="padding:0 0 20px;">
        <p style="margin:0;font-size:14px;line-height:1.7;color:${MUTED};">
          You joined as an <strong style="color:${WHITE};">${roleLabel}</strong> — we're building the social events app Accra deserves and you're getting in early.
        </p>
      </td></tr>
    </table>

    <!-- Pioneer callout -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:20px;">
      <tr>
        <td bgcolor="${GREEN_DIM}" style="background-color:${GREEN_DIM};border:1px solid ${GREEN_BORD};border-radius:14px;padding:18px 20px;">
          <p style="margin:0 0 6px;font-size:11px;font-weight:800;color:${BRAND};letter-spacing:0.14em;text-transform:uppercase;">${brandIcon("lightning", 11)} &nbsp;Pulse Pioneers</p>
          <p style="margin:0;font-size:13px;color:${GREEN_TEXT};line-height:1.7;">
            Your <strong>Pioneer Badge</strong> lives on your profile permanently — and you earn Pulse Points at <strong>2× the rate</strong> for your first 90 days. The earlier you join, the bigger your head start.
          </p>
        </td>
      </tr>
    </table>

    ${hr()}
    ${eyebrow("What's coming")}

    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr><td bgcolor="${CARD}" style="padding:10px 0;border-bottom:1px solid ${BORD};">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="width:28px;">${brandIcon("map-pin", 16)}</td>
          <td bgcolor="${CARD}">
            <p style="margin:0 0 1px;font-size:13px;font-weight:600;color:${WHITE};">Personalised event feed</p>
            <p style="margin:0;font-size:12px;color:${MUTED};">Curated to your taste, not just what's trending</p>
          </td>
        </tr></table>
      </td></tr>
      <tr><td bgcolor="${CARD}" style="padding:10px 0;border-bottom:1px solid ${BORD};">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="width:28px;">${brandIcon("lightning", 16)}</td>
          <td bgcolor="${CARD}">
            <p style="margin:0 0 1px;font-size:13px;font-weight:600;color:${WHITE};">Pulse Points</p>
            <p style="margin:0;font-size:12px;color:${MUTED};">Go out, earn points, redeem towards tickets and experiences</p>
          </td>
        </tr></table>
      </td></tr>
      <tr><td bgcolor="${CARD}" style="padding:10px 0;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="width:28px;">${brandIcon("chat", 16)}</td>
          <td bgcolor="${CARD}">
            <p style="margin:0 0 1px;font-size:13px;font-weight:600;color:${WHITE};">Messaging</p>
            <p style="margin:0;font-size:12px;color:${MUTED};">DM friends, followers, and organizers in-app</p>
          </td>
        </tr></table>
      </td></tr>
    </table>

    ${hr()}
    <p style="margin:0;font-size:12px;color:${DIM};">We'll reach out when early access opens. — The GoOutside Team</p>
  `, `Received because you joined the GoOutside waitlist.<br>
     <a href="mailto:hello@mail.gooutside.club" style="color:${DIM};text-decoration:underline;">hello@mail.gooutside.club</a>`);
}
