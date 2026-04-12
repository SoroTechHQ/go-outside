/**
 * send-missing-emails.mjs
 *
 * Cross-checks all DB signups against a CSV of emails already sent via Resend,
 * then sends the welcome email to anyone missing. Rate-limited to 1/2s.
 *
 * Usage (from repo root):
 *   node scripts/send-missing-emails.mjs [--dry-run]
 *
 * --dry-run  Preview who would get an email without actually sending anything.
 */

import { readFileSync } from "fs";
import { resolve } from "path";

// ── Config (reads from env or hardcoded fallback) ─────────────────────────────
const RESEND_API_KEY =
  process.env.RESEND_API_KEY || "re_Bf4kmsUi_AQ2ZevSD9QmSYKG3p9dRmLVb";
const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://szobygsvdlzypuspcafu.supabase.co";
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6b2J5Z3N2ZGx6eXB1c3BjYWZ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTkxMDA1MiwiZXhwIjoyMDkxNDg2MDUyfQ.PXmB3-lT7t0FK9DUm3lAG543QpDo5E75R0Ng1OGvirc";

// Path to the Resend CSV export
const CSV_PATH =
  process.env.CSV_PATH ||
  resolve(process.env.HOME, "Downloads/emails-sent-1776028348876.csv");

const DELAY_MS = 2000; // 2 seconds between sends (30/min, safe for Resend)
const DRY_RUN = process.argv.includes("--dry-run");

// ── Helpers ───────────────────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Parse just the `to` column from a Resend CSV export */
function parseSentEmails(csvPath) {
  const lines = readFileSync(csvPath, "utf8").trim().split("\n");
  // header: id,created_at,subject,from,to,...
  const headers = lines[0].split(",");
  const toIdx = headers.indexOf("to");
  const subjectIdx = headers.indexOf("subject");
  const sent = new Set();
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    const subject = cols[subjectIdx] ?? "";
    // Only count actual waitlist emails, not test sends
    if (!subject.includes("GoOutside is coming")) continue;
    const email = (cols[toIdx] ?? "").trim().toLowerCase();
    if (email) sent.add(email);
  }
  return sent;
}

async function fetchAllSignups() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/waitlist_signups?select=id,email,name,role&order=created_at.asc`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    }
  );
  if (!res.ok) throw new Error(`Supabase fetch failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function markEmailSent(id) {
  // Only works after the email_sent column has been added via SQL migration
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/waitlist_signups?id=eq.${id}`,
    {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ email_sent: true }),
    }
  );
  // Silently ignore if column doesn't exist yet (code 42703)
  if (!res.ok && res.status !== 400) {
    console.warn(`    (DB update failed for ${id}: ${res.status})`);
  }
}

function buildEmailHtml(firstName, roleLabel) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f7f7f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f7;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
        <tr><td style="background:#0f110f;padding:32px 40px;text-align:center;">
          <p style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">GoOutside</p>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.5);font-size:13px;">Your city is waiting.</p>
        </td></tr>
        <tr><td style="padding:40px 40px 32px;">
          <p style="margin:0 0 16px;font-size:24px;font-weight:700;color:#0f110f;line-height:1.3;">Hey ${firstName}, you're on the list. 🎉</p>
          <p style="margin:0 0 20px;font-size:16px;color:#6f6f6f;line-height:1.6;">You joined as an <strong>${roleLabel}</strong> — great to have you. We're building the social events app Accra deserves, and you're getting in early.</p>
          <div style="background:#f0f9f2;border:1px solid #c8e8ce;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
            <p style="margin:0 0 6px;font-size:14px;font-weight:600;color:#0f110f;">👑 Founding Member Status</p>
            <p style="margin:0 0 10px;font-size:13px;color:#4a7a55;line-height:1.5;">You're among the first 1,000. Your Founding Member badge lives on your profile forever — and you earn Pulse points at <strong>2× the normal rate</strong> for your first 90 days.</p>
            <p style="margin:0;font-size:13px;color:#4a7a55;line-height:1.5;">Pulse is GoOutside's measure of how connected you are to Accra's scene. Attend events, leave reviews, engage — and your score unlocks tiers from Newcomer to Legend, converting into real value you can redeem towards tickets and experiences.</p>
          </div>
          <hr style="border:none;border-top:1px solid #ececec;margin:0 0 24px;">
          <p style="margin:0 0 16px;font-size:13px;font-weight:600;color:#0f110f;text-transform:uppercase;letter-spacing:0.5px;">What's coming</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">
              <p style="margin:0;font-size:15px;color:#0f110f;font-weight:500;">🗺️ Personalised feed</p>
              <p style="margin:4px 0 0;font-size:13px;color:#6f6f6f;">Events curated to your taste, not just what's trending</p>
            </td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">
              <p style="margin:0;font-size:15px;color:#0f110f;font-weight:500;">👥 Social layer</p>
              <p style="margin:4px 0 0;font-size:13px;color:#6f6f6f;">See what your friends are attending, saving, and rating</p>
            </td></tr>
            <tr><td style="padding:10px 0;">
              <p style="margin:0;font-size:15px;color:#0f110f;font-weight:500;">⚡ Pulse Points</p>
              <p style="margin:4px 0 0;font-size:13px;color:#6f6f6f;">Earn points by attending events, leaving reviews, and engaging. Unlock tiers from Newcomer to Legend — and redeem towards tickets and experiences</p>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:0 40px 40px;">
          <p style="margin:0 0 8px;font-size:13px;color:#a9a9a9;">We'll reach out when early access opens. Stay tuned.</p>
          <p style="margin:0;font-size:13px;color:#a9a9a9;">— The GoOutside Club</p>
        </td></tr>
        <tr><td style="background:#f7f7f7;padding:20px 40px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#a9a9a9;">You're receiving this because you joined the GoOutside waitlist.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("GoOutside — send missing waitlist emails\n");
  if (DRY_RUN) console.log("🔍 DRY RUN mode — no emails will be sent\n");

  // 1. Parse already-sent emails from CSV
  let sentEmails;
  try {
    sentEmails = parseSentEmails(CSV_PATH);
    console.log(`CSV: ${sentEmails.size} emails already sent via Resend`);
  } catch (err) {
    console.error(`Could not read CSV at ${CSV_PATH}: ${err.message}`);
    process.exit(1);
  }

  // 2. Fetch all DB signups
  let allSignups;
  try {
    allSignups = await fetchAllSignups();
    console.log(`DB:  ${allSignups.length} total signups`);
  } catch (err) {
    console.error(`Supabase fetch failed: ${err.message}`);
    process.exit(1);
  }

  // 3. Find missing
  const missing = allSignups.filter(
    (s) => !sentEmails.has(s.email.toLowerCase().trim())
  );

  console.log(`\n⚠️  ${missing.length} signup(s) did NOT receive a confirmation email:\n`);
  missing.forEach((s, i) => {
    console.log(`  ${String(i + 1).padStart(3, "0")}. ${s.email}  (${s.name ?? "no name"})`);
  });

  if (missing.length === 0) {
    console.log("\n✅ Everyone is covered. Nothing to send.");
    return;
  }

  if (DRY_RUN) {
    console.log("\nDry run done. Remove --dry-run to send these emails.");
    return;
  }

  console.log(`\nSending ${missing.length} email(s) at 1 per ${DELAY_MS / 1000}s...\n`);

  let sent = 0;
  let failed = 0;

  for (let idx = 0; idx < missing.length; idx++) {
    const signup = missing[idx];
    const firstName = signup.name?.trim().split(" ")[0] || "there";
    const roleLabel =
      signup.role === "organizer"
        ? "event organizer"
        : signup.role === "both"
          ? "event organizer and goer"
          : "event goer";

    process.stdout.write(`  [${idx + 1}/${missing.length}] ${signup.email}... `);

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "GoOutside <waitlist@mail.gooutside.club>",
          to: signup.email,
          subject: "You're in — GoOutside is coming to Accra 🟢",
          html: buildEmailHtml(firstName, roleLabel),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || JSON.stringify(err));
      }

      await markEmailSent(signup.id);
      console.log("✓");
      sent++;
    } catch (err) {
      console.log(`✗  ${err.message}`);
      failed++;
    }

    // Rate limit pause (skip after last item)
    if (idx < missing.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  console.log(`\n✅ Done — ${sent} sent, ${failed} failed.`);
  if (failed > 0) {
    console.log("Re-run after updating the CSV to retry failures.");
  }
}

main().catch((err) => {
  console.error("\nFatal error:", err.message);
  process.exit(1);
});
