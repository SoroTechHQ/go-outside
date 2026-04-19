#!/usr/bin/env node
/**
 * run-migrations.mjs — Applies SQL migrations to Supabase via the Management API
 *
 * Usage: node scripts/run-migrations.mjs
 *
 * This runs:
 *   1. docs/006_messages_and_cart.sql
 *   2. docs/007_organizer_mode.sql  (now fixed)
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const SUPABASE_URL = "https://szobygsvdlzypuspcafu.supabase.co";
const SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6b2J5Z3N2ZGx6eXB1c3BjYWZ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTkxMDA1MiwiZXhwIjoyMDkxNDg2MDUyfQ.PXmB3-lT7t0FK9DUm3lAG543QpDo5E75R0Ng1OGvirc";
const PROJECT_REF = "szobygsvdlzypuspcafu";

async function runSQL(label, sql) {
  console.log(`\n━━━ ${label} ━━━`);

  // Try Supabase Management API (requires service-role or admin key)
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    },
  );

  if (res.ok) {
    const data = await res.json();
    console.log(`✅ ${label} — OK`);
    return { ok: true, data };
  }

  // Fallback: try the REST pg_catalog approach
  const errorText = await res.text();
  console.log(
    `⚠️  Management API returned ${res.status}. Trying pg RPC fallback...`,
  );

  // Try running individual statements via PostgREST rpc
  const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql }),
  });

  if (rpcRes.ok) {
    console.log(`✅ ${label} — OK via RPC`);
    return { ok: true };
  }

  const rpcText = await rpcRes.text();
  console.log(`❌ Both methods failed for ${label}`);
  console.log(`   Mgmt API: ${errorText.substring(0, 200)}`);
  console.log(`   RPC: ${rpcText.substring(0, 200)}`);
  console.log(
    `\n📋 MANUAL FALLBACK: Copy and run in Supabase SQL Editor:\n   docs/${label}.sql`,
  );
  return { ok: false };
}

// Read migration files
const migration006 = readFileSync(
  join(ROOT, "docs/006_messages_and_cart.sql"),
  "utf8",
);
const migration007 = readFileSync(
  join(ROOT, "docs/007_organizer_mode.sql"),
  "utf8",
);

console.log("GoOutside — Running Missing Migrations");
console.log("URL:", SUPABASE_URL);
console.log("Project:", PROJECT_REF);

const r006 = await runSQL("006_messages_and_cart", migration006);
const r007 = await runSQL("007_organizer_mode", migration007);

console.log("\n" + "═".repeat(50));
console.log("MIGRATION SUMMARY");
console.log("═".repeat(50));
console.log(
  `006_messages_and_cart: ${r006.ok ? "✅ Applied" : "❌ Manual required"}`,
);
console.log(
  `007_organizer_mode:    ${r007.ok ? "✅ Applied" : "❌ Manual required"}`,
);

if (!r006.ok || !r007.ok) {
  console.log(`
📋 TO RUN MANUALLY IN SUPABASE SQL EDITOR:
   1. Go to: https://supabase.com/dashboard/project/${PROJECT_REF}/sql
   2. Paste docs/006_messages_and_cart.sql → Run
   3. Paste docs/007_organizer_mode.sql → Run
`);
}
