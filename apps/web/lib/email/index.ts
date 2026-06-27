/**
 * GoOutside — Centralized Email Library
 *
 * One domain: mail.gooutside.club
 * Theme: light mode only — white bg, dark text, green brand accents.
 *        Works correctly in every email client without dark-mode inversion issues.
 * Icons: Phosphor Bold SVGs embedded as base64 data URIs — no external requests needed.
 */

import { Resend } from "resend";
import fs from "fs";
import path from "path";

const BASE   = process.env.NEXT_PUBLIC_APP_URL ?? "https://gooutside.club";

let resend: Resend | null = null;

export function getResendClient() {
  if (resend) return resend;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is required.");
  }

  resend = new Resend(apiKey);
  return resend;
}

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
  events:   "GoOutside Events <events@mail.gooutside.club>",
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
  return getResendClient().emails.send({
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
  ticketLines?: Array<{ label: string; quantity?: number; priceLabel?: string }>;
  totalLabel?: string;
  paymentMethod?: string | null;
  coverUrl?: string | null;
  eventUrl?: string;
  startDatetime?: string | null;
  endDatetime?: string | null;
  organizer?: {
    name: string;
    websiteUrl?: string | null;
    logoUrl?: string | null;
    socialLinks?: Record<string, string> | null;
    customMessage?: string | null;
  };
}) {
  const calendar = buildCalendarInvite(opts);
  return getResendClient().emails.send({
    from:    SENDERS.tickets,
    to:      opts.to,
    replyTo: "hello@mail.gooutside.club",
    subject: `Your ticket for ${opts.eventName} | GoOutside`,
    headers: txnHeaders(),
    attachments: calendar ? ([{
      filename: `${slugifyFilename(opts.eventName)}.ics`,
      content: calendar.ics,
    }] as any) : undefined,
    html:    buildTicketEmail(opts),
  });
}

export async function sendEventReminder(opts: {
  to: string; firstName: string; eventName: string;
  eventDate: string; venue: string; slug: string;
}) {
  return getResendClient().emails.send({
    from:    SENDERS.notify,
    to:      opts.to,
    subject: `⏰ Starting in 2 hours: ${opts.eventName}`,
    headers: notifHeaders(),
    html:    buildReminderEmail(opts),
  });
}

export async function sendPioneerInvite(opts: { to: string; firstName: string }) {
  return getResendClient().emails.send({
    from:    SENDERS.pioneers,
    to:      opts.to,
    replyTo: "hello@mail.gooutside.club",
    subject: `⚡ You're in — GoOutside Pulse Pioneers`,
    headers: txnHeaders({ "X-Program": "pulse-pioneers" }),
    html:    buildPioneerEmail(opts.firstName),
  });
}

export function buildTicketEmailPreview(opts: Omit<Parameters<typeof sendTicketReceipt>[0], "to">): string {
  return buildTicketEmail(opts);
}

export function buildFoundingOrganizerEmailPreview(opts: {
  firstName: string;
  businessName: string;
  senderName?: string;
  token: string;
}) {
  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://gooutside.club";
  return buildFoundingOrganizerEmail(
    opts.firstName,
    opts.businessName,
    `${BASE_URL}/invite/${opts.token}`,
    opts.senderName,
  );
}

export async function sendFoundingOrganizerInvite(opts: {
  to: string;
  firstName: string;
  businessName: string;
  token: string;
  senderName?: string;
}) {
  const inviteUrl = `${BASE}/invite/${opts.token}`;
  return getResendClient().emails.send({
    from:    SENDERS.pioneers,
    to:      opts.to,
    replyTo: "hello@mail.gooutside.club",
    subject: `You're invited — Founding Organizer on GoOutside`,
    headers: txnHeaders({ "X-Program": "founding-organizer" }),
    html:    buildFoundingOrganizerEmail(opts.firstName, opts.businessName, inviteUrl, opts.senderName ?? "Gabby"),
  });
}

export async function sendWelcomeEmail(opts: { to: string; firstName: string }) {
  try {
    await getResendClient().emails.send({
      from:    SENDERS.general,
      to:      opts.to,
      subject: `Welcome to GoOutside`,
      headers: txnHeaders({ "X-Category": "welcome" }),
      html:    buildWelcomeEmail(opts.firstName),
    });
  } catch (err) {
    console.error("[email] sendWelcomeEmail failed:", err);
  }
}

export async function sendWaitlistConfirmation(opts: { to: string; firstName: string; roleLabel: string }) {
  return getResendClient().emails.send({
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
    await getResendClient().emails.send({
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
    await getResendClient().emails.send({
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
    await getResendClient().emails.send({
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

export async function sendEventBroadcast(opts: {
  to: string;
  firstName: string;
  subject: string;
  message: string;
  eventName: string;
  eventSlug: string;
  organizerName: string;
}): Promise<void> {
  try {
    await getResendClient().emails.send({
      from:    SENDERS.events,
      to:      opts.to,
      subject: opts.subject || `Update about ${opts.eventName}`,
      headers: notifHeaders(),
      html:    buildEventBroadcastEmail(opts),
    });
  } catch (err) {
    console.error("[email] sendEventBroadcast failed:", err);
  }
}

// ─── Shell ────────────────────────────────────────────────────────────────────
const FONT = `'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif`;

function shell(content: string, footer?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>GoOutside</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    body { margin: 0; padding: 0; background-color: ${BG}; font-family: ${FONT}; }
    img  { display: block; border: 0; outline: none; }
    a    { color: ${BRAND}; }
    * { font-family: ${FONT}; }
  </style>
</head>
<body bgcolor="${BG}" style="margin:0;padding:0;background-color:${BG};font-family:${FONT};">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" bgcolor="${BG}" style="background-color:${BG};padding:36px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;width:100%;">

        <!-- Logo -->
        <tr><td style="padding:0 0 20px 0;">
          ${logoImg()}
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

// Phosphor icon — reads SVG from disk, bakes in brand color as data URI
// Works in local dev, production, and email clients (no external requests)
const _icoCache = new Map<string, string>();
function ico(name: string, size = 16): string {
  const cacheKey = `${name}:${size}`;
  if (_icoCache.has(cacheKey)) return _icoCache.get(cacheKey)!;

  try {
    const svgPath = path.join(process.cwd(), "public", "email-icons", `${name}.svg`);
    const raw = fs.readFileSync(svgPath, "utf-8");
    const colored = raw.replace(/fill="currentColor"/g, `fill="${BRAND}"`);
    const dataUri = `data:image/svg+xml;base64,${Buffer.from(colored).toString("base64")}`;
    const tag = `<img src="${dataUri}" width="${size}" height="${size}" alt="" style="display:inline-block;vertical-align:middle;">`;
    _icoCache.set(cacheKey, tag);
    return tag;
  } catch {
    return "";
  }
}

// Logo — uses production URL (served from public/ on deploy, ~123KB PNG must NOT be base64)
// Falls back to text wordmark in dev if NEXT_PUBLIC_APP_URL is not set to a live host
function logoImg(): string {
  const logoUrl = `${BASE}/logo-full.png`;
  // In dev BASE defaults to gooutside.club which is the correct production URL anyway
  return `<img src="${logoUrl}" width="120" height="36" alt="GoOutside" style="display:block;width:120px;height:auto;">`;
}

function btn(label: string, url: string, outline = false): string {
  if (outline) {
    return `<a href="${url}" style="display:inline-block;background-color:transparent;color:${TEXT};font-size:13px;font-weight:700;text-decoration:none;padding:11px 22px;border-radius:100px;border:1.5px solid ${BORDER};">${label}</a>`;
  }
  return `<a href="${url}" style="display:inline-block;background-color:${BRAND};color:#ffffff;font-size:13px;font-weight:800;text-decoration:none;padding:12px 26px;border-radius:100px;">${label}</a>`;
}

function esc(value: string | number | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function slugifyFilename(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "gooutside-ticket";
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "Date TBD";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date TBD";
  return date.toLocaleDateString("en-GH", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toCalendarStamp(value: string | null | undefined): string {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "";
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function buildCalendarInvite(opts: {
  eventName: string;
  startDatetime?: string | null;
  endDatetime?: string | null;
  venue: string;
  venueAddress?: string;
  mapsUrl?: string;
  eventUrl?: string;
  organizer?: { name: string; websiteUrl?: string | null; socialLinks?: Record<string, string> | null };
}): { ics: string; googleUrl: string } | null {
  if (!opts.startDatetime) return null;

  const start = toCalendarStamp(opts.startDatetime);
  if (!start) return null;

  const endCandidate = opts.endDatetime
    ? toCalendarStamp(opts.endDatetime)
    : toCalendarStamp(new Date(new Date(opts.startDatetime).getTime() + 2 * 60 * 60 * 1000).toISOString());
  const end = endCandidate || start;

  const locationParts = [opts.venue, opts.venueAddress].filter(Boolean).join(", ");
  const detailsParts = [
    `Your GoOutside ticket for ${opts.eventName}.`,
    opts.organizer?.name ? `Organizer: ${opts.organizer.name}.` : null,
    opts.eventUrl ? `Event page: ${opts.eventUrl}` : null,
  ].filter(Boolean);

  const googleUrl = new URL("https://calendar.google.com/calendar/render");
  googleUrl.searchParams.set("action", "TEMPLATE");
  googleUrl.searchParams.set("text", opts.eventName);
  googleUrl.searchParams.set("dates", `${start}/${end}`);
  googleUrl.searchParams.set("details", detailsParts.join(" "));
  googleUrl.searchParams.set("location", locationParts);
  googleUrl.searchParams.set("ctz", "Africa/Accra");

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GoOutside//Ticket Invitation//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${crypto.randomUUID()}@gooutside.club`,
    `DTSTAMP:${toCalendarStamp(new Date().toISOString())}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${opts.eventName}`,
    `DESCRIPTION:${detailsParts.join(" \\n ")}`,
    `LOCATION:${locationParts}`,
    `URL:${opts.eventUrl ?? BASE}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");

  return { ics, googleUrl: googleUrl.toString() };
}

// Brand SVG paths for social platforms — rendered as base64 img tags safe for email clients
const _SOCIAL_ICON: Record<string, { bg: string; svgBody: string }> = {
  instagram: {
    bg: "#E1306C",
    svgBody: `<rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="white" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="3.5" stroke="white" stroke-width="2" fill="none"/><circle cx="18.5" cy="5.5" r="1.5" fill="white"/>`,
  },
  twitter: {
    bg: "#000000",
    svgBody: `<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.734-8.845L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="white"/>`,
  },
  x: {
    bg: "#000000",
    svgBody: `<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.734-8.845L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="white"/>`,
  },
  facebook: {
    bg: "#1877F2",
    svgBody: `<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="white"/>`,
  },
  tiktok: {
    bg: "#010101",
    svgBody: `<path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.74a8.17 8.17 0 0 0 4.77 1.52V6.79a4.85 4.85 0 0 1-1-.1z" fill="white"/>`,
  },
  linkedin: {
    bg: "#0A66C2",
    svgBody: `<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" fill="white"/>`,
  },
  youtube: {
    bg: "#FF0000",
    svgBody: `<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="white"/>`,
  },
  website: {
    bg: "#4a9f63",
    svgBody: `<circle cx="12" cy="12" r="10" stroke="white" stroke-width="2" fill="none"/><line x1="2" y1="12" x2="22" y2="12" stroke="white" stroke-width="2"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="white" stroke-width="2" fill="none"/>`,
  },
};

function socialIconImg(rawLabel: string, size = 18): string {
  const key = rawLabel.trim().toLowerCase().replace(/\s+/g, "");
  const meta = _SOCIAL_ICON[key] ?? _SOCIAL_ICON["website"]!;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}">${meta.svgBody}</svg>`;
  const dataUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  return `<span style="display:inline-block;width:${size + 4}px;height:${size + 4}px;border-radius:6px;background:${meta.bg};text-align:center;line-height:${size + 4}px;vertical-align:middle;"><img src="${dataUri}" width="${size}" height="${size}" alt="${esc(rawLabel)}" style="display:inline-block;vertical-align:middle;margin-top:${Math.floor((size + 4 - size) / 2)}px;"></span>`;
}

function socialBadge(label: string, href: string, handle?: string): string {
  const displayText = handle ?? label;
  return `<a href="${esc(href)}" style="display:inline-block;margin:0 8px 8px 0;padding:7px 13px 7px 8px;border:1px solid ${BORDER};border-radius:999px;background:#f8f8f8;color:${TEXT};text-decoration:none;font-size:12px;font-weight:600;line-height:1;vertical-align:middle;">
    ${socialIconImg(label, 16)}
    <span style="display:inline-block;vertical-align:middle;margin-left:7px;white-space:nowrap;color:${TEXT};">${esc(displayText)}</span>
  </a>`;
}

function organizerSocialLinks(input?: Record<string, string> | null): Array<{ label: string; href: string; handle: string }> {
  if (!input) return [];

  return Object.entries(input)
    .map(([rawLabel, rawHref]) => {
      const label = rawLabel.trim().toLowerCase();
      let href = rawHref.trim();
      if (!href) return null;
      // Normalise bare handles / slugs into full URLs
      if (!/^https?:\/\//i.test(href)) {
        if (label === "instagram")       href = `https://instagram.com/${href.replace(/^@/, "")}`;
        else if (label === "twitter" || label === "x") href = `https://x.com/${href.replace(/^@/, "")}`;
        else if (label === "facebook")   href = `https://facebook.com/${href.replace(/^@/, "")}`;
        else if (label === "tiktok")     href = `https://tiktok.com/@${href.replace(/^@/, "")}`;
        else if (label === "linkedin")   href = `https://linkedin.com/in/${href.replace(/^@/, "")}`;
        else if (label === "youtube")    href = `https://youtube.com/@${href.replace(/^@/, "")}`;
        else                             href = `https://${href.replace(/^\/+/, "")}`;
      }
      // Derive a short display handle
      let handle = rawHref.trim();
      if (!handle.startsWith("@") && !/^https?:\/\//i.test(handle)) handle = `@${handle}`;
      if (/^https?:\/\//i.test(handle)) {
        try { handle = new URL(handle).hostname.replace(/^www\./, ""); } catch { /* keep as-is */ }
      }
      return { label: rawLabel, href, handle };
    })
    .filter((item): item is { label: string; href: string; handle: string } => Boolean(item))
    .slice(0, 5);
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
  ticketLines?: Array<{ label: string; quantity?: number; priceLabel?: string }>;
  totalLabel?: string;
  paymentMethod?: string | null;
  coverUrl?: string | null;
  eventUrl?: string;
  startDatetime?: string | null;
  endDatetime?: string | null;
  organizer?: {
    name: string;
    websiteUrl?: string | null;
    logoUrl?: string | null;
    socialLinks?: Record<string, string> | null;
    customMessage?: string | null;
  };
}): string {
  const mapsUrl = opts.mapsUrl ?? `https://maps.google.com/?q=${encodeURIComponent(opts.venue + (opts.venueAddress ? ", " + opts.venueAddress : ""))}`;
  const calendar = buildCalendarInvite(opts);
  const organizerLinks = organizerSocialLinks(opts.organizer?.socialLinks);
  const eventLink = opts.eventUrl ?? `${BASE}/dashboard/wallets`;
  const organizerName = opts.organizer?.name ?? "GoOutside";
  const organizerWebsite = opts.organizer?.websiteUrl ?? BASE;
  const eventDate = esc(opts.eventDate);
  const eventName = esc(opts.eventName);
  const firstName = esc(opts.firstName);
  const ticketType = opts.ticketType ? esc(opts.ticketType) : "";
  const ticketId = esc(opts.ticketId);
  const venue = esc(opts.venue);
  const venueAddress = opts.venueAddress ? esc(opts.venueAddress) : "";
  const qrUrl = esc(opts.qrUrl);
  const ticketLines = opts.ticketLines ?? [];
  const customMessage = opts.organizer?.customMessage ? esc(opts.organizer.customMessage) : "";

  // Format time separately if startDatetime is provided
  let timeLabel = "";
  if (opts.startDatetime) {
    const d = new Date(opts.startDatetime);
    if (!Number.isNaN(d.getTime())) {
      timeLabel = d.toLocaleTimeString("en-GH", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Accra" });
      if (opts.endDatetime) {
        const e2 = new Date(opts.endDatetime);
        if (!Number.isNaN(e2.getTime())) {
          timeLabel += ` – ${e2.toLocaleTimeString("en-GH", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Accra" })}`;
        }
      }
    }
  }

  // Organizer logo/avatar block (small, 36px, for the top row)
  const organizerAvatarSmall = opts.organizer?.logoUrl
    ? `<img src="${esc(opts.organizer.logoUrl)}" alt="${esc(organizerName)}" width="28" height="28" style="display:block;width:28px;height:28px;border-radius:8px;object-fit:cover;border:1px solid ${BORDER};">`
    : `<div style="width:28px;height:28px;border-radius:8px;background:${BRAND_BG};border:1px solid ${BRAND_BD};line-height:28px;text-align:center;font-size:11px;font-weight:800;color:${BRAND};">${esc(organizerName.slice(0, 2).toUpperCase())}</div>`;

  // Organizer logo (large, for the organizer section)
  const organizerLogoLarge = opts.organizer?.logoUrl
    ? `<img src="${esc(opts.organizer.logoUrl)}" alt="${esc(organizerName)} logo" width="44" height="44" style="display:block;width:44px;height:44px;border-radius:12px;object-fit:cover;border:1px solid ${BORDER};background:#fff;">`
    : `<div style="width:44px;height:44px;border-radius:12px;background:${BRAND_BG};border:1px solid ${BRAND_BD};line-height:44px;text-align:center;font-size:14px;font-weight:800;color:${BRAND};">${esc(organizerName.slice(0, 2).toUpperCase())}</div>`;

  const organizerLinkRow = organizerLinks.length > 0
    ? `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:10px;"><tr><td>${organizerLinks.map((link) => socialBadge(link.label, link.href, link.handle)).join("")}</td></tr></table>`
    : "";

  // Cover image — bleeds to card edges using negative margins
  const coverBlock = opts.coverUrl
    ? `<table width="632" cellpadding="0" cellspacing="0" role="presentation" style="margin:-36px -36px 28px -36px;width:calc(100% + 72px);">
        <tr><td style="border-radius:16px 16px 0 0;overflow:hidden;line-height:0;">
          <img src="${esc(opts.coverUrl)}" width="632" alt="${eventName}" style="display:block;width:100%;height:220px;object-fit:cover;border-radius:16px 16px 0 0;">
        </td></tr>
      </table>`
    : "";

  // Detail row: icon + label
  function detailRow(iconName: string, label: string, value: string): string {
    return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:10px;">
      <tr>
        <td style="width:28px;vertical-align:top;padding-top:1px;">${ico(iconName, 15)}</td>
        <td style="vertical-align:top;">
          <span style="font-size:9px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:${MUTED};display:block;margin-bottom:2px;">${label}</span>
          <span style="font-size:13px;font-weight:700;color:${TEXT};line-height:1.45;">${value}</span>
        </td>
      </tr>
    </table>`;
  }

  // Order summary
  const orderSummaryRows = ticketLines.length > 0
    ? ticketLines.map((line) => `
        <tr>
          <td style="padding:9px 0;border-bottom:1px solid ${BORDER};font-size:13px;color:${BODY};">
            ${esc(line.label)}${line.quantity && line.quantity > 1 ? ` <span style="color:${MUTED};">× ${line.quantity}</span>` : ""}
          </td>
          <td style="padding:9px 0;border-bottom:1px solid ${BORDER};font-size:13px;font-weight:700;color:${TEXT};text-align:right;">${esc(line.priceLabel ?? "")}</td>
        </tr>`).join("")
    : opts.ticketType ? `<tr>
        <td style="padding:9px 0;border-bottom:1px solid ${BORDER};font-size:13px;color:${BODY};">1 × ${ticketType}</td>
        <td style="padding:9px 0;border-bottom:1px solid ${BORDER};font-size:13px;font-weight:700;color:${TEXT};text-align:right;"></td>
      </tr>` : "";

  const totalRow = opts.totalLabel ? `
    <tr>
      <td style="padding:10px 0 0;font-size:13px;font-weight:800;color:${TEXT};">Total</td>
      <td style="padding:10px 0 0;font-size:14px;font-weight:800;color:${TEXT};text-align:right;">${esc(opts.totalLabel)}</td>
    </tr>` : "";

  const paymentRow = opts.paymentMethod ? `
    <tr>
      <td colspan="2" style="padding:6px 0 0;font-size:11px;color:${MUTED};">
        ${ico("check-circle", 11)} &nbsp;Paid via ${esc(opts.paymentMethod)}
      </td>
    </tr>` : "";

  const orderSummary = (orderSummaryRows || totalRow) ? `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:20px;border:1px solid ${BORDER};border-radius:14px;overflow:hidden;">
      <tr>
        <td style="padding:12px 16px;background:${BRAND_BG};border-bottom:1px solid ${BRAND_BD};">
          <p style="margin:0;font-size:9px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:${BRAND};">Order Summary</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 16px 14px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            ${orderSummaryRows}
            ${totalRow}
            ${paymentRow}
          </table>
        </td>
      </tr>
    </table>` : "";

  // Action buttons
  const calendarBtn = calendar ? `<td style="padding-right:8px;padding-bottom:8px;">${btn("Add to calendar", calendar.googleUrl, true)}</td>` : "";
  const eventPageBtn = `<td style="padding-right:8px;padding-bottom:8px;">${btn("View event", eventLink, true)}</td>`;
  const directionsBtn = `<td style="padding-right:8px;padding-bottom:8px;">${btn("Get directions", mapsUrl, true)}</td>`;
  const appBtn = `<td style="padding-bottom:8px;">${btn("Open in app", `${BASE}/dashboard/wallets`, false)}</td>`;

  return shell(`
    ${coverBlock}

    <!-- Organizer byline -->
    <table cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:20px;">
      <tr>
        <td style="vertical-align:middle;padding-right:8px;">${organizerAvatarSmall}</td>
        <td style="vertical-align:middle;">
          <span style="font-size:12px;font-weight:700;color:${MUTED};">${esc(organizerName)}</span>
        </td>
      </tr>
    </table>

    <!-- Confirmed badge -->
    <table cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:14px;">
      <tr>
        <td style="padding:7px 14px;border-radius:999px;background:${BRAND_BG};border:1px solid ${BRAND_BD};">
          <table cellpadding="0" cellspacing="0" role="presentation"><tr>
            <td style="padding-right:7px;">${ico("check-circle", 14)}</td>
            <td style="font-size:10px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:${BRAND};white-space:nowrap;">Ticket Confirmed &nbsp;·&nbsp; Admission Ready</td>
          </tr></table>
        </td>
      </tr>
    </table>

    <!-- Event name -->
    <h1 style="margin:0 0 6px;font-size:26px;font-weight:800;line-height:1.1;letter-spacing:-0.03em;color:${TEXT};">
      Your ticket for ${eventName}
    </h1>
    <p style="margin:0 0 24px;font-size:13px;line-height:1.7;color:${BODY};">
      Hi ${firstName}, you're all set. Show this email or scan your QR code at the gate.
    </p>

    <!-- Event details -->
    <div style="border:1px solid ${BORDER};border-radius:16px;padding:18px 18px 8px;margin-bottom:20px;background:#fafafa;">
      ${detailRow("calendar", "Date", eventDate)}
      ${timeLabel ? detailRow("clock", "Time", timeLabel) : ""}
      ${detailRow("map-pin", "Venue", venue + (venueAddress ? `<br><span style="font-weight:500;color:${BODY};">${venueAddress}</span>` : ""))}
      ${(ticketType || (ticketLines.length > 0 && ticketLines[0]?.label)) ? detailRow("ticket", "Ticket", ticketType || (ticketLines[0]?.label ?? "")) : ""}
      <p style="margin:6px 0 10px;font-size:11px;color:${MUTED};">
        Guest: <strong style="color:${TEXT};">${firstName}</strong>
      </p>
    </div>

    <!-- QR code -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:20px;">
      <tr>
        <td align="center" style="padding:24px 18px;border:1px solid ${BORDER};border-radius:16px;background:#fff;">
          <div style="display:inline-block;padding:14px;border-radius:16px;background:#fff;border:1px solid ${BORDER};box-shadow:0 8px 24px rgba(17,17,17,0.06);">
            <img src="${qrUrl}" alt="Ticket QR code" width="200" height="200" style="display:block;width:200px;height:200px;">
          </div>
          <p style="margin:14px 0 0;font-size:12px;color:${MUTED};line-height:1.7;">
            Present this QR code at the gate.<br>It is single-use and tied to your account.
          </p>
        </td>
      </tr>
    </table>

    <!-- Order summary -->
    ${orderSummary}

    <!-- Action buttons -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:20px;">
      <tr>
        ${calendarBtn}
        ${eventPageBtn}
        ${directionsBtn}
        ${appBtn}
      </tr>
    </table>

    ${hr()}

    <!-- Organizer section -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:20px;">
      <tr>
        <td style="vertical-align:top;padding-right:14px;width:56px;">${organizerLogoLarge}</td>
        <td style="vertical-align:top;">
          <p style="margin:0 0 2px;font-size:9px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:${MUTED};">Organizer</p>
          <p style="margin:0 0 6px;font-size:15px;font-weight:800;color:${TEXT};line-height:1.3;">${esc(organizerName)}</p>
          ${customMessage
            ? `<p style="margin:0 0 8px;font-size:13px;color:${BODY};line-height:1.7;">${customMessage}</p>`
            : `<p style="margin:0 0 8px;font-size:12px;color:${MUTED};line-height:1.6;">For any questions about this event, reach out to the organizer directly.</p>`}
          <p style="margin:0;font-size:12px;">
            <a href="${esc(organizerWebsite)}" style="color:${BRAND};text-decoration:none;font-weight:700;">Visit organizer →</a>
          </p>
          ${organizerLinkRow}
        </td>
      </tr>
    </table>

    <!-- Before you go -->
    <div style="background:${BRAND_BG};border:1px solid ${BRAND_BD};border-radius:14px;padding:16px 18px;margin-bottom:20px;">
      <p style="margin:0 0 10px;font-size:9px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:${BRAND};">Before you go</p>
      <p style="margin:0 0 7px;font-size:12px;line-height:1.75;color:#1a3d26;">
        ${ico("check-circle", 12)} &nbsp;Keep the QR code visible at the gate — save this email or screenshot it.
      </p>
      <p style="margin:0 0 7px;font-size:12px;line-height:1.75;color:#1a3d26;">
        ${ico("calendar", 12)} &nbsp;Check the event page for the latest updates before you head out.
      </p>
      <p style="margin:0;font-size:12px;line-height:1.75;color:#1a3d26;">
        ${ico("envelope", 12)} &nbsp;Issues with your ticket? Reply to this email and we'll help.
      </p>
    </div>

    <!-- Ticket ID at bottom -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td style="padding:12px 0;border-top:1px solid ${BORDER};">
          <p style="margin:0;font-size:10px;color:${DIM};line-height:1.6;">
            Ticket ID &nbsp;<code style="font-family:'Courier New',monospace;font-size:10px;color:${MUTED};letter-spacing:0.08em;">${ticketId}</code>
            &nbsp;·&nbsp; GoOutside is a ticketing platform — contact the organizer for event-specific support.
          </p>
        </td>
      </tr>
    </table>
  `, `GoOutside · Accra, Ghana<br>
     <a href="${BASE}" style="color:${DIM};text-decoration:underline;">gooutside.club</a>
     &nbsp;·&nbsp;
     <a href="mailto:hello@mail.gooutside.club" style="color:${DIM};text-decoration:underline;">hello@mail.gooutside.club</a>`);
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
            <p style="margin:0 0 2px;font-size:13px;font-weight:700;color:${TEXT};">2× Outside Score for 90 days</p>
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
        Your <strong>Pioneer Badge</strong> lives on your profile permanently — and you earn Outside Score at <strong>2× the rate</strong> for your first 90 days. The earlier you join, the bigger your head start.
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
            <p style="margin:0 0 1px;font-size:13px;font-weight:600;color:${TEXT};">Outside Score</p>
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

// ─── 8. Founding organizer invite ────────────────────────────────────────────
function buildFoundingOrganizerEmail(
  firstName: string,
  businessName: string,
  inviteUrl: string,
  senderName = "Gabby",
): string {
  const name = esc(firstName);
  const url  = esc(inviteUrl);
  const sender = esc(senderName);

  const benefits: Array<{ icon: string; title: string; body: string }> = [
    {
      icon:  "crown",
      title: "Founding Organizer badge — permanent",
      body:  "Shown on your profile forever. Once we open publicly, no one else gets this title.",
    },
    {
      icon:  "gift",
      title: "Free access during launch",
      body:  "No listing fees or platform cuts on your first events. You grow your audience; we handle the tech.",
    },
    {
      icon:  "star",
      title: "Priority placement in the feed",
      body:  "Your events receive priority placement across GoOutside feeds, putting them in front of users even outside their selected interests.",
    },
    {
      icon:  "chart-bar",
      title: "Early access to organizer analytics",
      body:  "Audience demographics, attendance trends, and Pulse data — from day one.",
    },
    {
      icon:  "handshake",
      title: "Direct line to the team",
      body:  "Reply to this email and it comes straight to us. Your input shapes what we build.",
    },
  ];

  const benefitRows = benefits.map((b, i) => `
    <tr><td style="padding:14px 0;${i < benefits.length - 1 ? `border-bottom:1px solid ${BORDER};` : ""}">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="width:30px;vertical-align:top;padding-top:2px;">${ico(b.icon, 20)}</td>
        <td>
          <p style="margin:0 0 3px;font-size:13px;font-weight:700;color:${TEXT};">${b.title}</p>
          <p style="margin:0;font-size:12px;color:${MUTED};line-height:1.65;">${b.body}</p>
        </td>
      </tr></table>
    </td></tr>`).join("");

  return shell(`
    <table cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:20px;">
      <tr>
        <td style="padding:6px 14px;border-radius:100px;background:${BRAND_BG};border:1px solid ${BRAND_BD};">
          <table cellpadding="0" cellspacing="0" role="presentation"><tr>
            <td style="padding-right:6px;">${ico("sparkle", 12)}</td>
            <td style="font-size:9px;font-weight:900;letter-spacing:0.2em;text-transform:uppercase;color:${BRAND};white-space:nowrap;">Founding Organizer</td>
          </tr></table>
        </td>
      </tr>
    </table>

    <h1 style="margin:0 0 16px;font-size:26px;font-weight:800;line-height:1.12;letter-spacing:-0.03em;color:${TEXT};">
      Hi ${name}, GoOutside wants you in.
    </h1>

    <p style="margin:0 0 14px;font-size:14px;line-height:1.8;color:${BODY};">
      We're building the social events app for Accra, and before we open to the public, we're personally inviting a small group of the city's best organizers to join as <strong>Founding Organizers</strong>.
    </p>
    <p style="margin:0 0 24px;font-size:14px;line-height:1.8;color:${BODY};">
      This is not a beta test. You'd be in the first wave — with benefits that stay on your profile permanently, even after thousands of other organizers join later.
    </p>

    <div style="background:linear-gradient(135deg,${BRAND_BG} 0%,#f8fdf9 100%);border:1px solid ${BRAND_BD};border-radius:16px;padding:18px 20px;margin-bottom:24px;">
      <table cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:8px;"><tr>
        <td style="padding-right:6px;">${ico("lightning", 12)}</td>
        <td style="font-size:9px;font-weight:900;letter-spacing:0.2em;text-transform:uppercase;color:${BRAND};">What this means for you</td>
      </tr></table>
      <p style="margin:0;font-size:13px;color:#2d6e45;line-height:1.75;">
        Free platform access, a permanent Founding Organizer badge, priority placement across GoOutside feeds — putting your events in front of users even outside their selected interests — and a direct line to the team.
      </p>
    </div>

    ${eyebrow("Your founding benefits")}
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      ${benefitRows}
    </table>

    ${hr()}

    ${btn("Accept your invitation", url)}

    <p style="margin:18px 0 0;font-size:12px;line-height:1.7;color:${MUTED};">
      This link is personal to you. It takes a minute to get your profile live.
    </p>

    <p style="margin:32px 0 0;font-size:13px;line-height:1.8;color:${BODY};">
      Looking forward to having you on the platform,<br>
      <strong style="color:${TEXT};font-size:14px;">${sender}</strong><br>
      <span style="font-size:11px;color:${MUTED};">GoOutside</span>
    </p>
  `, `You received this because we're personally inviting you as a Founding Organizer on GoOutside.<br>
     Questions? Just reply — it comes straight to us. &nbsp;·&nbsp; <a href="${BASE}" style="color:${DIM};text-decoration:underline;">gooutside.club</a>`);
}

// ─── 9. Welcome (quick signup) ───────────────────────────────────────────────
function buildWelcomeEmail(firstName: string): string {
  const name = esc(firstName);

  const features: Array<{ icon: string; title: string; body: string }> = [
    { icon: "ticket",    title: "Your tickets, always with you",       body: "Find every ticket you've bought in your wallet. Scan the QR code at the door." },
    { icon: "star",      title: "Discover what's on in Accra",         body: "Browse events by vibe, category, and neighbourhood — curated to match your taste." },
    { icon: "lightning", title: "Earn your Outside Score",             body: "Every event you attend raises your score and unlocks better tiers and rewards." },
    { icon: "gift",      title: "Redeem Outside Score for perks",       body: "Earn points on every purchase and trade them in for discounts and exclusive access." },
  ];

  const featureRows = features.map((f, i) => `
    <tr><td style="padding:12px 0;${i < features.length - 1 ? `border-bottom:1px solid ${BORDER};` : ""}">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="width:30px;vertical-align:top;padding-top:2px;">${ico(f.icon, 18)}</td>
        <td>
          <p style="margin:0 0 2px;font-size:13px;font-weight:700;color:${TEXT};">${f.title}</p>
          <p style="margin:0;font-size:12px;color:${MUTED};line-height:1.65;">${f.body}</p>
        </td>
      </tr></table>
    </td></tr>`).join("");

  return shell(`
    <h1 style="margin:0 0 6px;font-size:24px;font-weight:800;letter-spacing:-0.03em;line-height:1.15;color:${TEXT};">
      Welcome to GoOutside, ${name}.
    </h1>
    <p style="margin:0 0 24px;font-size:14px;line-height:1.8;color:${BODY};">
      Your account is ready. Here's everything you can do right now.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      ${featureRows}
    </table>

    ${hr()}

    ${btn("Explore what's on", `${BASE}/home`)}

    <p style="margin:18px 0 0;font-size:13px;line-height:1.8;color:${BODY};">
      Take a minute to set up your profile and vibe preferences — it helps us show you events you'll actually want to go to.<br><br>
      <a href="${BASE}/onboarding/profile" style="color:${BRAND};font-weight:700;text-decoration:none;">Complete your profile →</a>
    </p>

    <p style="margin:28px 0 0;font-size:13px;line-height:1.8;color:${BODY};">
      See you out there,<br>
      <strong style="color:${TEXT};font-size:14px;">The GoOutside team</strong>
    </p>
  `, `You're receiving this because you just created a GoOutside account.<br>
     Questions? <a href="mailto:hello@mail.gooutside.club" style="color:${DIM};text-decoration:underline;">hello@mail.gooutside.club</a>`);
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

// ─── 10. Event broadcast (organizer → attendees) ──────────────────────────────
function buildEventBroadcastEmail(opts: {
  firstName: string;
  message: string;
  eventName: string;
  eventSlug: string;
  organizerName: string;
}): string {
  const firstName = esc(opts.firstName);
  const message   = esc(opts.message).replace(/\n/g, "<br>");
  const eventName = esc(opts.eventName);
  const orgName   = esc(opts.organizerName);
  const eventUrl  = `${BASE}/events/${encodeURIComponent(opts.eventSlug)}`;

  return shell(`
    ${eyebrow("Event update")}
    <h1 style="margin:0 0 6px;font-size:22px;font-weight:800;letter-spacing:-0.03em;line-height:1.2;color:${TEXT};">
      ${eventName}
    </h1>
    <p style="margin:0 0 20px;font-size:12px;color:${MUTED};">From ${orgName}</p>

    <div style="background-color:${BRAND_BG};border:1px solid ${BRAND_BD};border-radius:14px;padding:18px 20px;margin-bottom:24px;">
      <p style="margin:0;font-size:14px;line-height:1.8;color:#1a3d26;">${message}</p>
    </div>

    ${btn("View event", eventUrl)}

    ${hr()}
    <p style="margin:0;font-size:11px;color:${MUTED};line-height:1.7;">
      Hey ${firstName} — you received this because you have a ticket for ${eventName}.<br>
      <a href="${BASE}/dashboard/settings" style="color:${MUTED};text-decoration:underline;">Manage notification preferences</a>
    </p>
  `);
}
