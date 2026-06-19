#!/usr/bin/env node
/**
 * Launch readiness check — run before any production push.
 * Exits 0 if all clear. Exits 1 if blocking items remain.
 *
 * Usage: node scripts/check-launch-readiness.mjs
 */

import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "..");
const exists = (p) => fs.existsSync(path.join(ROOT, p));

const RED    = "\x1b[31m";
const GREEN  = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BOLD   = "\x1b[1m";
const RESET  = "\x1b[0m";

const pass  = (msg) => console.log(`  ${GREEN}✓${RESET}  ${msg}`);
const fail  = (msg) => console.log(`  ${RED}✗${RESET}  ${BOLD}${msg}${RESET}`);
const warn  = (msg) => console.log(`  ${YELLOW}!${RESET}  ${msg}`);

console.log(`\n${BOLD}GoOutside — Launch Readiness Check${RESET}`);
console.log("─".repeat(44));

let blocking = 0;
let warnings = 0;

// ── BLOCKERS (must be gone before production) ────────────────────────────────
console.log(`\n${BOLD}REMOVE (blocking)${RESET}`);

const toRemove = [
  { path: "apps/web/app/seed",          label: "Seed UI page at /seed" },
  { path: "apps/web/app/api/seed",      label: "Seed API route at /api/seed" },
  { path: "apps/web/lib/seed",          label: "Seed data module" },
];

for (const item of toRemove) {
  if (exists(item.path)) {
    fail(`${item.label}  →  ${item.path}`);
    blocking++;
  } else {
    pass(`${item.label} — removed`);
  }
}

// ── WARNINGS (important but not hard blockers) ────────────────────────────────
console.log(`\n${BOLD}SECURE (review required)${RESET}`);

const toReview = [
  { path: "apps/web/app/ad-waitlist",        label: "/ad-waitlist — confirm password changed or auth replaced" },
  { path: "apps/web/app/api/webhooks/paystack/route.ts", label: "Paystack webhook — confirm ticket fulfillment is complete" },
];

for (const item of toReview) {
  if (exists(item.path)) {
    warn(`${item.label}`);
    warnings++;
  } else {
    pass(`${item.label} — handled`);
  }
}

// ── ENV CHECK (look for suspicious patterns in .env.local) ───────────────────
console.log(`\n${BOLD}ENV (spot check)${RESET}`);

const envPath = path.join(ROOT, "apps/web/.env.local");
if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, "utf8");
  const hasSeedPw = /SEED_PASSWORD/.test(env);
  if (hasSeedPw) {
    warn("SEED_PASSWORD is set in .env.local — remove from Vercel env vars after deleting the seed route");
    warnings++;
  } else {
    pass("SEED_PASSWORD not present in .env.local");
  }
} else {
  warn(".env.local not found — cannot check env vars");
  warnings++;
}

// ── CLEANUP (nice to have) ────────────────────────────────────────────────────
console.log(`\n${BOLD}CLEAN UP (optional)${RESET}`);

const toClean = [
  { path: "scripts/seed-ghana-real.mjs",       label: "CLI seed script (dev-only)" },
  { path: "documents/scripts/seed-ghana.mjs",  label: "Old seed script" },
];

for (const item of toClean) {
  if (exists(item.path)) {
    warn(`${item.label} still present at ${item.path}`);
  } else {
    pass(`${item.label} — removed`);
  }
}

// ── SUMMARY ───────────────────────────────────────────────────────────────────
console.log("\n" + "─".repeat(44));

if (blocking > 0) {
  console.log(`\n${RED}${BOLD}NOT ready for production.${RESET}`);
  console.log(`${RED}${blocking} blocking item(s) must be resolved.${RESET}`);
  console.log(`See ${BOLD}pre-launch/BEFORE_LAUNCH.md${RESET} for details.\n`);
  process.exit(1);
} else if (warnings > 0) {
  console.log(`\n${YELLOW}${BOLD}Mostly ready — ${warnings} item(s) need review.${RESET}`);
  console.log(`No blockers found. Review warnings above before going live.\n`);
  process.exit(0);
} else {
  console.log(`\n${GREEN}${BOLD}All blocking items resolved. Safe to launch.${RESET}\n`);
  process.exit(0);
}
