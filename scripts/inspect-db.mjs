#!/usr/bin/env node
/**
 * GoOutside — Supabase Database Inspector
 * Prints all tables, columns, row counts, enums, and storage buckets.
 *
 * Usage:
 *   node scripts/inspect-db.mjs
 */

const SUPABASE_URL = "https://szobygsvdlzypuspcafu.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6b2J5Z3N2ZGx6eXB1c3BjYWZ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTkxMDA1MiwiZXhwIjoyMDkxNDg2MDUyfQ.PXmB3-lT7t0FK9DUm3lAG543QpDo5E75R0Ng1OGvirc";

const headers = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
};

async function rpc(sql) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers,
    body: JSON.stringify({ sql }),
  });
  if (!res.ok) {
    // Fall back to direct query via PostgREST's sql endpoint
    return null;
  }
  return res.json();
}

async function query(sql) {
  // Use the Supabase SQL endpoint directly (service role bypasses RLS)
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers,
    body: JSON.stringify({ query: sql }),
  });
  return res;
}

// Use the raw postgres REST API via PostgREST
async function pgQuery(path, params = "") {
  const url = `${SUPABASE_URL}/rest/v1/${path}${params}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text();
    return { error: text, status: res.status };
  }
  return res.json();
}

// Execute raw SQL via the Supabase SQL API (management API uses different endpoint)
async function rawSQL(sql) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Profile": "public",
      Prefer: "return=representation",
    },
    body: JSON.stringify({ query: sql }),
  });
  return res;
}

// Use Supabase's management API (runs raw SQL)
async function execSQL(sql) {
  const projectRef = "szobygsvdlzypuspcafu";
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    return { error: text, status: res.status };
  }
  return res.json();
}

// Alternative: use PostgREST with pg_catalog views
async function getTableList() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/`, { headers });
  if (res.ok) {
    const data = await res.json();
    return data;
  }
  return null;
}

async function main() {
  console.log("=".repeat(60));
  console.log("GoOutside — Supabase Database Inspector");
  console.log(`URL: ${SUPABASE_URL}`);
  console.log("=".repeat(60));

  // ── 1) List all public tables via information_schema ──────────────────────
  console.log("\n📋 PUBLIC TABLES + ROW COUNTS\n");

  const tablesSQL = `
    SELECT 
      t.table_name,
      t.table_type,
      obj_description(('"' || t.table_schema || '"."' || t.table_name || '"')::regclass, 'pg_class') as description
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
      AND t.table_type IN ('BASE TABLE', 'VIEW')
    ORDER BY t.table_type, t.table_name;
  `;

  // We'll use pgrest's rpc approach with a known function, or manually query
  // each known table's count using PostgREST HEAD requests
  const knownTables = [
    "users",
    "organizer_profiles",
    "categories",
    "venues",
    "events",
    "ticket_types",
    "tickets",
    "payments",
    "webhook_events",
    "audit_logs",
    "saved_events",
    "reviews",
    "follows",
    "notifications",
    "reports",
    "platform_settings",
    "graph_edges",
    "user_interest_vectors",
    "interaction_sessions",
    "feed_section_cache",
    "scarcity_state",
    "time_based_feed_rules",
    "user_event_suppressions",
    "event_similarity_cache",
    "snippets",
    "pulse_score_history",
    "friendships",
    "admin_activity_log",
    "moderation_queue",
    "platform_metrics_hourly",
    "conversations",
    "messages",
    "cart_items",
    "onboarding_past_events",
    "organizer_applications",
    "posts",
    "post_likes",
    "comments",
    "comment_likes",
    "hashtags",
    "organizer_team_members",
    "ad_campaigns",
    "waitlist",
    "admin_config",
  ];

  const tableResults = [];

  for (const table of knownTables) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=count`, {
        method: "HEAD",
        headers: {
          ...headers,
          Prefer: "count=exact",
        },
      });
      if (res.ok) {
        const count = res.headers.get("content-range");
        tableResults.push({ table, exists: true, count: count || "unknown" });
      } else if (res.status === 404 || res.status === 400) {
        tableResults.push({ table, exists: false, count: "-" });
      } else {
        // Try GET with limit 0
        const res2 = await fetch(`${SUPABASE_URL}/rest/v1/${table}?limit=0`, {
          headers: { ...headers, Prefer: "count=exact" },
        });
        const count2 = res2.headers.get("content-range");
        tableResults.push({
          table,
          exists: res2.ok,
          count: count2 || (res2.ok ? "exists" : "missing"),
        });
      }
    } catch (e) {
      tableResults.push({ table, exists: false, count: "error" });
    }
  }

  // Print table
  const existing = tableResults.filter((r) => r.exists);
  const missing = tableResults.filter((r) => !r.exists);

  console.log("✅ EXISTING TABLES:");
  existing.forEach((r) => {
    const range = r.count?.split("/");
    const total = range?.[1] || r.count;
    console.log(`   ${r.table.padEnd(35)} rows: ${total}`);
  });

  if (missing.length > 0) {
    console.log("\n❌ MISSING / NOT YET CREATED:");
    missing.forEach((r) => console.log(`   ${r.table}`));
  }

  // ── 2) Check Storage Buckets ───────────────────────────────────────────────
  console.log("\n\n🪣  STORAGE BUCKETS\n");
  try {
    const bucketsRes = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
      headers,
    });
    if (bucketsRes.ok) {
      const buckets = await bucketsRes.json();
      if (buckets.length === 0) {
        console.log("   No buckets created yet.");
      } else {
        buckets.forEach((b) => {
          console.log(
            `   ${b.name.padEnd(25)} public: ${b.public}  id: ${b.id}`,
          );
        });
      }
    } else {
      console.log("   Could not fetch buckets:", await bucketsRes.text());
    }
  } catch (e) {
    console.log("   Error fetching buckets:", e.message);
  }

  // ── 3) Sample some data ───────────────────────────────────────────────────
  console.log("\n\n📊 SAMPLE DATA\n");

  // Categories
  try {
    const catRes = await fetch(
      `${SUPABASE_URL}/rest/v1/categories?select=name,slug,color&is_active=eq.true&order=sort_order`,
      { headers },
    );
    if (catRes.ok) {
      const cats = await catRes.json();
      console.log(`Categories (${cats.length}):`);
      cats.forEach((c) => console.log(`   ${c.slug.padEnd(20)} ${c.name}`));
    }
  } catch (e) {}

  // Events sample
  try {
    const evRes = await fetch(
      `${SUPABASE_URL}/rest/v1/events?select=title,slug,status,start_datetime&limit=5&order=created_at.desc`,
      { headers },
    );
    if (evRes.ok) {
      const evs = await evRes.json();
      console.log(`\nLatest Events (${evs.length} shown):`);
      evs.forEach((e) =>
        console.log(
          `   [${e.status}] ${e.title?.substring(0, 50)} — ${e.slug}`,
        ),
      );
    }
  } catch (e) {}

  // Users count
  try {
    const uRes = await fetch(`${SUPABASE_URL}/rest/v1/users?limit=0`, {
      headers: { ...headers, Prefer: "count=exact" },
    });
    const cr = uRes.headers.get("content-range");
    console.log(`\nTotal users: ${cr?.split("/")?.[1] ?? "unknown"}`);
  } catch (e) {}

  // Platform settings
  try {
    const psRes = await fetch(
      `${SUPABASE_URL}/rest/v1/platform_settings?select=key,value`,
      { headers },
    );
    if (psRes.ok) {
      const ps = await psRes.json();
      console.log("\nPlatform Settings:");
      ps.forEach((s) =>
        console.log(`   ${s.key.padEnd(35)} = ${JSON.stringify(s.value)}`),
      );
    }
  } catch (e) {}

  console.log("\n" + "=".repeat(60));
  console.log("Inspection complete.");
  console.log("=".repeat(60));
}

main().catch(console.error);
