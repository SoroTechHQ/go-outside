#!/usr/bin/env node
/**
 * GoOutside — Ghana Seed Script (Pure-Fetch Edition)
 * ─────────────────────────────────────────────────────────────
 * No npm dependencies needed — uses Node.js built-in fetch.
 * Requires Node 18+.
 *
 * What this does:
 *   1. Creates Supabase Storage buckets
 *   2. Downloads images from Unsplash and uploads to correct storage paths
 *   3. Seeds organizer_profiles with logos
 *   4. Seeds Ghana venues
 *   5. Seeds 10 real Ghana events with ticket types, banners, gallery images
 *   6. Seeds graph_edges for feed algorithm signal
 *   7. Seeds waitlist entries (if table exists)
 *
 * Usage:
 *   node scripts/seed-ghana.mjs             # full run
 *   node scripts/seed-ghana.mjs --dry-run   # preview only, no DB writes
 *
 * Storage path convention (mirrors docs/image-storage-plan.md):
 *   avatars/{userId}/avatar.jpg
 *   covers/{userId}/cover.jpg
 *   event-banners/{eventSlug}/banner.jpg
 *   event-gallery/{eventSlug}/{index}.jpg
 *   organizer-logos/{userId}/logo.jpg
 *   post-media/{postId}/{index}.jpg
 *   message-media/{conversationId}/{messageId}.jpg
 */

// ── Config ────────────────────────────────────────────────────
const SUPABASE_URL = "https://szobygsvdlzypuspcafu.supabase.co";
const SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6b2J5Z3N2ZGx6eXB1c3BjYWZ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTkxMDA1MiwiZXhwIjoyMDkxNDg2MDUyfQ.PXmB3-lT7t0FK9DUm3lAG543QpDo5E75R0Ng1OGvirc";

const DRY_RUN = process.argv.includes("--dry-run");

const BASE = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
};

// ── Low-level helpers ─────────────────────────────────────────
async function rest(method, path, body, extraHeaders = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: { ...BASE, ...extraHeaders },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { ok: res.ok, status: res.status, data };
}

async function select(table, qs = "") {
  return rest("GET", `${table}?${qs}`);
}

async function insert(table, payload, returnVal = false) {
  if (DRY_RUN) {
    log("skip", `[DRY] INSERT ${table}`);
    return { ok: true, data: payload };
  }
  const headers = returnVal
    ? { Prefer: "return=representation" }
    : { Prefer: "return=minimal" };
  return rest(
    "POST",
    table,
    Array.isArray(payload) ? payload : [payload],
    headers,
  );
}

async function upsert(table, payload, onConflict) {
  if (DRY_RUN) {
    log("skip", `[DRY] UPSERT ${table}`);
    return { ok: true };
  }
  const params = onConflict ? `?on_conflict=${onConflict}` : "";
  const headers = { Prefer: `resolution=merge-duplicates,return=minimal` };
  return rest(
    "POST",
    `${table}${params}`,
    Array.isArray(payload) ? payload : [payload],
    headers,
  );
}

async function update(table, filter, payload) {
  if (DRY_RUN) {
    log("skip", `[DRY] UPDATE ${table} WHERE ${filter}`);
    return { ok: true };
  }
  return rest("PATCH", `${table}?${filter}`, payload);
}

async function rowCount(table) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?limit=0`, {
    headers: { ...BASE, Prefer: "count=exact" },
  });
  const cr = res.headers.get("content-range");
  return cr ? parseInt(cr.split("/")[1] || "0", 10) : -1;
}

async function storageCreateBucket(id, isPublic, fileSizeLimit) {
  if (DRY_RUN) {
    log("ok", `[DRY] Bucket: ${id}`);
    return;
  }
  const res = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: "POST",
    headers: BASE,
    body: JSON.stringify({
      id,
      name: id,
      public: isPublic,
      file_size_limit: fileSizeLimit,
    }),
  });
  const text = await res.text();
  let d;
  try {
    d = JSON.parse(text);
  } catch {
    d = text;
  }
  if (!res.ok && !String(text).toLowerCase().includes("already exists")) {
    log("err", `Bucket create failed (${id}): ${text}`);
  }
}

async function storageUpload(bucket, path, buffer, contentType = "image/jpeg") {
  if (DRY_RUN) {
    log("skip", `[DRY] Upload ${bucket}/${path}`);
    return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
  }
  // Remove existing first (upsert via DELETE then PUT)
  await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
    method: "DELETE",
    headers: BASE,
  });
  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`,
    {
      method: "POST",
      headers: {
        ...BASE,
        "Content-Type": contentType,
        "x-upsert": "true",
        "Cache-Control": "31536000",
      },
      body: buffer,
    },
  );
  if (!res.ok) {
    const t = await res.text();
    log("warn", `Upload failed (${bucket}/${path}): ${t.substring(0, 120)}`);
    return null;
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

async function downloadImage(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "GoOutside-Seed/1.0" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

// ── Logger ────────────────────────────────────────────────────
let stepN = 0;
function step(label) {
  stepN++;
  console.log(`\n[${stepN}] ${label}`);
}
function log(type, msg) {
  const icons = { ok: "✅", warn: "⚠️ ", err: "❌", skip: "⏭️ ", info: "ℹ️ " };
  console.log(`    ${icons[type] ?? "  "} ${msg}`);
}

// ─────────────────────────────────────────────────────────────
// STEP 1 — Storage Buckets
// ─────────────────────────────────────────────────────────────
step("Creating Supabase Storage buckets");

const BUCKETS = [
  { id: "avatars", public: true, limit: 2_097_152 },
  { id: "covers", public: true, limit: 5_242_880 },
  { id: "event-banners", public: true, limit: 8_388_608 },
  { id: "event-gallery", public: true, limit: 8_388_608 },
  { id: "organizer-logos", public: true, limit: 2_097_152 },
  { id: "post-media", public: true, limit: 8_388_608 },
  { id: "message-media", public: false, limit: 20_971_520 },
  { id: "private-docs", public: false, limit: 10_485_760 },
];

for (const b of BUCKETS) {
  await storageCreateBucket(b.id, b.public, b.limit);
  log("ok", `Bucket "${b.id}" ready (public: ${b.public})`);
}

// ─────────────────────────────────────────────────────────────
// STEP 2 — Fetch Existing Users
// ─────────────────────────────────────────────────────────────
step("Fetching existing users");

const { data: users } = await select(
  "users",
  "select=id,clerk_id,email,first_name,last_name,role&limit=60",
);

if (!Array.isArray(users) || users.length === 0) {
  log("err", "No users found in DB. Sync Clerk users first.");
  process.exit(1);
}
log("ok", `Found ${users.length} users`);
const seedUserId = users[0].id;

// ─────────────────────────────────────────────────────────────
// STEP 3 — Organizer Profiles
// ─────────────────────────────────────────────────────────────
step("Seeding organizer profiles");

// Abstract/brand style images from Unsplash for logos
const LOGO_IMAGES = [
  "https://images.unsplash.com/photo-1614036634955-ae5e90f9b9eb?w=400&h=400&fit=crop&auto=format&q=80",
  "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=400&h=400&fit=crop&auto=format&q=80",
  "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=400&h=400&fit=crop&auto=format&q=80",
  "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=400&fit=crop&auto=format&q=80",
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&auto=format&q=80",
];

const ORGS = [
  {
    name: "Accra Vibes Collective",
    bio: "Ghana's premier event curation collective.",
    website: "https://accravibes.co",
    socials: { instagram: "accravibes", twitter: "accravibes" },
  },
  {
    name: "Kotoka Entertainment",
    bio: "From rooftop sessions to amphitheatre nights — Ghana's most talked-about music events.",
    website: "https://kotokaentertainment.com",
    socials: { instagram: "kotokaent" },
  },
  {
    name: "Gold Coast Tech Hub",
    bio: "Building Ghana's tech ecosystem through world-class conferences and hackathons.",
    website: "https://goldcoasttechhub.com",
    socials: { instagram: "goldcoasttech", twitter: "gcthub" },
  },
  {
    name: "Akoma Arts Foundation",
    bio: "Celebrating West African art, culture, and creativity.",
    website: "https://akomaarts.org",
    socials: { instagram: "akomaarts" },
  },
  {
    name: "Chale Wote Festival Crew",
    bio: "The team behind Accra's most iconic street art festival.",
    website: "https://chalewote.com",
    socials: { instagram: "chalewote", twitter: "chalewote" },
  },
];

const organizerUserIds = [];

for (let i = 0; i < ORGS.length; i++) {
  const user = users[i];
  const org = ORGS[i];
  if (!user) {
    organizerUserIds.push(seedUserId);
    continue;
  }

  // Check existing
  const { data: existing } = await select(
    "organizer_profiles",
    `select=id&user_id=eq.${user.id}`,
  );
  if (Array.isArray(existing) && existing.length > 0) {
    log("ok", `Organizer exists: ${org.name} (user ${user.first_name})`);
    organizerUserIds.push(user.id);
    continue;
  }

  // Upload logo
  let logoUrl = null;
  try {
    const buf = await downloadImage(LOGO_IMAGES[i]);
    logoUrl = await storageUpload(
      "organizer-logos",
      `${user.id}/logo.jpg`,
      buf,
    );
    log("ok", `  Logo uploaded → organizer-logos/${user.id}/logo.jpg`);
  } catch (e) {
    log("warn", `  Logo download failed for ${org.name}: ${e.message}`);
  }

  const { ok: inserted, data } = await insert(
    "organizer_profiles",
    {
      user_id: user.id,
      organization_name: org.name,
      bio: org.bio,
      website_url: org.website,
      social_links: org.socials,
      logo_url: logoUrl,
      status: "approved",
      verified_at: new Date().toISOString(),
    },
    true,
  );

  if (!inserted) {
    log(
      "err",
      `Failed to insert org: ${org.name}: ${JSON.stringify(data).substring(0, 100)}`,
    );
  } else {
    log("ok", `Created organizer: ${org.name}`);
    // Promote user to organizer role
    await update("users", `id=eq.${user.id}`, { role: "organizer" });
  }

  organizerUserIds.push(user.id);
}

// ─────────────────────────────────────────────────────────────
// STEP 4 — Venues
// ─────────────────────────────────────────────────────────────
step("Seeding Ghana venues");

const VENUE_LIST = [
  {
    name: "Alliance Française d'Accra",
    address: "Liberation Road, Accra",
    city: "Accra",
    latitude: 5.5571,
    longitude: -0.2027,
    capacity: 500,
    is_verified: true,
  },
  {
    name: "Labadi Beach Hotel",
    address: "La Beach Road, Labadi, Accra",
    city: "Accra",
    latitude: 5.5594,
    longitude: -0.1528,
    capacity: 2000,
    is_verified: true,
  },
  {
    name: "National Theatre of Ghana",
    address: "Liberation Road, Accra",
    city: "Accra",
    latitude: 5.5466,
    longitude: -0.2054,
    capacity: 1500,
    is_verified: true,
  },
  {
    name: "Accra International Conference Centre",
    address: "Castle Road, Accra",
    city: "Accra",
    latitude: 5.5494,
    longitude: -0.2074,
    capacity: 3000,
    is_verified: true,
  },
  {
    name: "The Villagio Restaurant & Lounge",
    address: "Airport Residential, Accra",
    city: "Accra",
    latitude: 5.6037,
    longitude: -0.187,
    capacity: 300,
    is_verified: true,
  },
  {
    name: "Movenpick Ambassador Hotel",
    address: "Independence Avenue, Accra",
    city: "Accra",
    latitude: 5.5695,
    longitude: -0.2088,
    capacity: 800,
    is_verified: true,
  },
  {
    name: "Box Office Ghana – East Legon",
    address: "Atomic Road, East Legon, Accra",
    city: "Accra",
    latitude: 5.636,
    longitude: -0.1654,
    capacity: 1200,
    is_verified: true,
  },
  {
    name: "KNUST Amphitheatre",
    address: "KNUST Campus, Kumasi",
    city: "Kumasi",
    latitude: 6.6741,
    longitude: -1.5714,
    capacity: 3500,
    is_verified: true,
  },
  {
    name: "Manhyia Palace Hall",
    address: "Bantama Road, Kumasi",
    city: "Kumasi",
    latitude: 6.699,
    longitude: -1.6173,
    capacity: 1000,
    is_verified: true,
  },
  {
    name: "Osu RE District",
    address: "Oxford Street, Osu, Accra",
    city: "Accra",
    latitude: 5.556,
    longitude: -0.1781,
    capacity: 600,
    is_verified: true,
  },
];

const venueMap = {};
for (const v of VENUE_LIST) {
  const { data: existing } = await select(
    "venues",
    `select=id&name=eq.${encodeURIComponent(v.name)}`,
  );
  if (Array.isArray(existing) && existing.length > 0) {
    venueMap[v.name] = existing[0].id;
    log("ok", `Venue exists: ${v.name}`);
    continue;
  }
  const { ok: ins, data } = await insert(
    "venues",
    {
      ...v,
      created_by: seedUserId,
      country: "Ghana",
      google_maps_url: `https://maps.google.com/?q=${encodeURIComponent(v.name)}`,
    },
    true,
  );
  if (ins && Array.isArray(data) && data[0]?.id) {
    venueMap[v.name] = data[0].id;
    log("ok", `Created venue: ${v.name}`);
  } else {
    log(
      "err",
      `Venue insert failed: ${v.name} — ${JSON.stringify(data).substring(0, 80)}`,
    );
  }
}

// ─────────────────────────────────────────────────────────────
// STEP 5 — Fetch Category IDs
// ─────────────────────────────────────────────────────────────
step("Fetching category IDs");
const { data: cats } = await select(
  "categories",
  "select=id,slug&is_active=eq.true",
);
const catMap = {};
if (Array.isArray(cats))
  cats.forEach((c) => {
    catMap[c.slug] = c.id;
  });
log("ok", `Categories: ${Object.keys(catMap).join(", ")}`);

// ─────────────────────────────────────────────────────────────
// STEP 6 — Ghana Events + Images
// ─────────────────────────────────────────────────────────────
step("Seeding Ghana events with real images");

// Unsplash images by category — no API key needed, portrait mode for variety
const IMG = {
  music: [
    "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&h=630&fit=crop&auto=format&q=85",
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&h=630&fit=crop&auto=format&q=85",
    "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1200&h=630&fit=crop&auto=format&q=85",
    "https://images.unsplash.com/photo-1501612780327-45045538702b?w=1200&h=630&fit=crop&auto=format&q=85",
  ],
  tech: [
    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=630&fit=crop&auto=format&q=85",
    "https://images.unsplash.com/photo-1528605105345-5344ea20e269?w=1200&h=630&fit=crop&auto=format&q=85",
    "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=1200&h=630&fit=crop&auto=format&q=85",
  ],
  "food-drink": [
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=630&fit=crop&auto=format&q=85",
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&h=630&fit=crop&auto=format&q=85",
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=630&fit=crop&auto=format&q=85",
  ],
  arts: [
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=630&fit=crop&auto=format&q=85",
    "https://images.unsplash.com/photo-1527324688151-0e627063f2b1?w=1200&h=630&fit=crop&auto=format&q=85",
    "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=1200&h=630&fit=crop&auto=format&q=85",
  ],
  sports: [
    "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200&h=630&fit=crop&auto=format&q=85",
    "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&h=630&fit=crop&auto=format&q=85",
  ],
  networking: [
    "https://images.unsplash.com/photo-1559223607-a43c990c692c?w=1200&h=630&fit=crop&auto=format&q=85",
    "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1200&h=630&fit=crop&auto=format&q=85",
    "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200&h=630&fit=crop&auto=format&q=85",
  ],
  education: [
    "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1200&h=630&fit=crop&auto=format&q=85",
    "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&h=630&fit=crop&auto=format&q=85",
  ],
  community: [
    "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&h=630&fit=crop&auto=format&q=85",
    "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=1200&h=630&fit=crop&auto=format&q=85",
  ],
};

const EVENTS = [
  {
    title: "Afro Nation Ghana 2026",
    slug: "afro-nation-ghana-2026",
    description:
      "The world's number 1 Afrobeats festival returns to Ghana's shores. Three days of electrifying performances from Africa's biggest stars, pristine beach vibes, and a celebration of the culture that's taken over the world. Expect surprise headliners, afro-brunch sessions, and an intimate beach after-party on the final night.",
    short_desc:
      "Africa's biggest Afrobeats festival hits Accra for 3 unforgettable nights of music and culture.",
    cat: "music",
    venue: "Labadi Beach Hotel",
    start: "2026-08-14T18:00:00+00:00",
    end: "2026-08-17T04:00:00+00:00",
    capacity: 5000,
    featured: true,
    landmark: true,
    sponsored: false,
    orgIdx: 1,
    tags: ["afrobeats", "festival", "beach", "music", "ghana", "summer"],
    tickets: [
      {
        name: "General Admission",
        price: 350,
        type: "paid",
        qty: 3000,
        order: 0,
      },
      { name: "VIP Wristband", price: 850, type: "paid", qty: 1200, order: 1 },
      {
        name: "VVIP Experience",
        price: 1800,
        type: "paid",
        qty: 300,
        order: 2,
      },
      { name: "Weekend Pass", price: 950, type: "paid", qty: 500, order: 3 },
    ],
  },
  {
    title: "Accra Tech Summit 2026",
    slug: "accra-tech-summit-2026-q3",
    description:
      "Ghana's premier technology conference brings together 2,000+ founders, engineers, investors, and product builders for two days of insight-dense talks, product demos, and curated networking. Theme: 'Building Africa At Scale'. Featuring speakers from Google, Flutterwave, Paystack, Andela.",
    short_desc:
      "Ghana's biggest tech conference: 2000+ builders, 50+ speakers, 2 power-packed days.",
    cat: "tech",
    venue: "Accra International Conference Centre",
    start: "2026-07-09T08:00:00+00:00",
    end: "2026-07-10T18:00:00+00:00",
    capacity: 2500,
    featured: true,
    landmark: false,
    sponsored: true,
    orgIdx: 2,
    tags: ["tech", "startup", "conference", "innovation", "ghana", "africa"],
    tickets: [
      { name: "Attendee Pass", price: 200, type: "paid", qty: 1800, order: 0 },
      {
        name: "Builder Pass (Startups)",
        price: 80,
        type: "paid",
        qty: 400,
        order: 1,
      },
      { name: "Speaker + Premium", price: 0, type: "free", qty: 100, order: 2 },
      {
        name: "Investor VIP Table",
        price: 1200,
        type: "paid",
        qty: 50,
        order: 3,
      },
    ],
  },
  {
    title: "Chale Wote Street Art Festival",
    slug: "chale-wote-street-art-2026",
    description:
      "The 14th edition of Accra's iconic street art, music, and performance festival transforms the historic James Town waterfront into a living gallery. Free admission. Expect murals, live painting, spoken word, afrobeat street performances, pop-up markets, and the celebrated Zombie Run at midnight.",
    short_desc:
      "Accra's iconic free street art + music festival in historic James Town. 3 days of pure culture.",
    cat: "arts",
    venue: "Osu RE District",
    start: "2026-08-21T10:00:00+00:00",
    end: "2026-08-23T23:00:00+00:00",
    capacity: 10000,
    featured: true,
    landmark: true,
    sponsored: false,
    orgIdx: 4,
    tags: ["art", "culture", "street-art", "free", "jamestown", "accra"],
    tickets: [
      { name: "Free Entry", price: 0, type: "free", qty: 8000, order: 0 },
      {
        name: "Artist Supporter Badge",
        price: 50,
        type: "paid",
        qty: 1500,
        order: 1,
      },
      {
        name: "Midnight Zombie Run Pass",
        price: 80,
        type: "paid",
        qty: 500,
        order: 2,
      },
    ],
  },
  {
    title: "Kumasi Arts & Crafts Expo 2026",
    slug: "kumasi-arts-crafts-expo-2026",
    description:
      "A showcase of Ashanti craft mastery and contemporary Ghanaian design. Over 200 artisans from across the Ashanti, Brong-Ahafo, and Northern regions exhibit kente, adinkra, woodcarving, beadwork, and pottery. Live demonstrations, workshops, and a curated fine arts section.",
    short_desc:
      "200+ Ghanaian artisans. Live kente weaving, woodcarving, and fine art. Free entry.",
    cat: "arts",
    venue: "KNUST Amphitheatre",
    start: "2026-06-27T09:00:00+00:00",
    end: "2026-06-28T17:00:00+00:00",
    capacity: 3000,
    featured: false,
    landmark: false,
    sponsored: false,
    orgIdx: 3,
    tags: ["craft", "kente", "kumasi", "art", "expo", "culture"],
    tickets: [
      { name: "Day Pass", price: 0, type: "free", qty: 2000, order: 0 },
      {
        name: "Workshop Bundle (2 sessions)",
        price: 60,
        type: "paid",
        qty: 600,
        order: 1,
      },
      {
        name: "Collector Preview (Fri evening)",
        price: 150,
        type: "paid",
        qty: 200,
        order: 2,
      },
    ],
  },
  {
    title: "Accra Jazz Night — July Edition",
    slug: "accra-jazz-night-july-2026",
    description:
      "An intimate monthly gathering at Alliance Française celebrating Ghana's vibrant jazz community. Resident trio opens the night, followed by a featured ensemble and a surprise guest set. Candle-lit tables, a curated wine and cocktail menu.",
    short_desc:
      "Accra's finest monthly jazz evening. Intimate, candlelit, and always worth it.",
    cat: "music",
    venue: "Alliance Française d'Accra",
    start: "2026-07-11T19:30:00+00:00",
    end: "2026-07-11T23:30:00+00:00",
    capacity: 200,
    featured: false,
    landmark: false,
    sponsored: false,
    orgIdx: 0,
    tags: ["jazz", "live-music", "accra", "intimate", "monthly"],
    tickets: [
      {
        name: "Standard Table (2 seats)",
        price: 120,
        type: "paid",
        qty: 120,
        order: 0,
      },
      { name: "Premium Reserved", price: 200, type: "paid", qty: 60, order: 1 },
    ],
  },
  {
    title: "Ghana Food & Drink Festival 2026",
    slug: "ghana-food-drink-festival-2026",
    description:
      "A 2-day culinary celebration showcasing the best of Ghanaian cuisine alongside international flavours. 50+ restaurant pop-ups, master chef demonstrations, cocktail masterclasses, a kids' cooking zone, and the much-anticipated Best Jollof Cook-off.",
    short_desc:
      "Ghana's biggest food festival: 50+ pop-ups, jollof cook-off, cocktail masterclasses.",
    cat: "food-drink",
    venue: "Labadi Beach Hotel",
    start: "2026-09-05T11:00:00+00:00",
    end: "2026-09-06T21:00:00+00:00",
    capacity: 4000,
    featured: true,
    landmark: false,
    sponsored: true,
    orgIdx: 0,
    tags: ["food", "drink", "festival", "jollof", "culinary", "accra"],
    tickets: [
      { name: "Day Entry", price: 80, type: "paid", qty: 2500, order: 0 },
      { name: "Weekend Pass", price: 140, type: "paid", qty: 1000, order: 1 },
      {
        name: "Masterclass Add-on",
        price: 60,
        type: "paid",
        qty: 300,
        order: 2,
      },
      { name: "VIP Lounge Pass", price: 350, type: "paid", qty: 200, order: 3 },
    ],
  },
  {
    title: "AfroMove Fitness Fest — Accra",
    slug: "afromove-fitness-fest-accra-2026",
    description:
      "An outdoor fitness festival celebrating African movement traditions — from Kpanlogo and Azonto-inspired HIIT to yoga, parkour, and obstacle courses. Open to all fitness levels. Hosted at Accra's largest green space with live DJ sets, healthy food vendors.",
    short_desc:
      "Full-day outdoor fitness festival blending Afrobeat HIIT, yoga, and community energy.",
    cat: "sports",
    venue: "Movenpick Ambassador Hotel",
    start: "2026-07-25T07:00:00+00:00",
    end: "2026-07-25T15:00:00+00:00",
    capacity: 800,
    featured: false,
    landmark: false,
    sponsored: false,
    orgIdx: 0,
    tags: ["fitness", "sports", "wellness", "dance", "community", "accra"],
    tickets: [
      { name: "Full-Day Access", price: 70, type: "paid", qty: 600, order: 0 },
      {
        name: "Morning Classes Only",
        price: 40,
        type: "paid",
        qty: 200,
        order: 1,
      },
    ],
  },
  {
    title: "Founders Connect — Accra Q3",
    slug: "founders-connect-accra-q3-2026",
    description:
      "A curated evening of founder conversations and peer-learning for Ghana and West Africa-based entrepreneurs building at the intersection of tech and impact. No pitch decks. Just honest dialogue. 80 seats only.",
    short_desc:
      "Curated founder conversations. No pitches, just honest building. 80 seats only.",
    cat: "networking",
    venue: "Movenpick Ambassador Hotel",
    start: "2026-06-19T18:00:00+00:00",
    end: "2026-06-19T21:30:00+00:00",
    capacity: 80,
    featured: false,
    landmark: false,
    sponsored: false,
    orgIdx: 2,
    tags: [
      "founders",
      "startup",
      "networking",
      "tech",
      "accra",
      "entrepreneurs",
    ],
    tickets: [
      { name: "Founder Access", price: 0, type: "free", qty: 60, order: 0 },
      { name: "Investor / Advisor", price: 0, type: "free", qty: 20, order: 1 },
    ],
  },
  {
    title: "East Legon Design Market",
    slug: "east-legon-design-market-2026",
    description:
      "A curated open-air market spotlighting Ghana's emerging independent designers, fashion labels, home goods brands, and lifestyle creators. Shop directly from the makers, enjoy live music, and discover the next wave of Accra's creative economy.",
    short_desc:
      "Shop directly from 60+ Ghanaian designers. Fashion, home goods, art, and lifestyle.",
    cat: "community",
    venue: "Box Office Ghana – East Legon",
    start: "2026-07-18T10:00:00+00:00",
    end: "2026-07-19T18:00:00+00:00",
    capacity: 1200,
    featured: false,
    landmark: false,
    sponsored: false,
    orgIdx: 3,
    tags: [
      "market",
      "design",
      "fashion",
      "accra",
      "shopping",
      "community",
      "makers",
    ],
    tickets: [
      {
        name: "Free Shopper Entry",
        price: 0,
        type: "free",
        qty: 1000,
        order: 0,
      },
      {
        name: "Vendor Registration",
        price: 200,
        type: "paid",
        qty: 120,
        order: 1,
      },
      {
        name: "Early Bird Preview Friday PM",
        price: 30,
        type: "paid",
        qty: 80,
        order: 2,
      },
    ],
  },
  {
    title: "Kente & Code — Women in Tech Ghana",
    slug: "kente-code-women-tech-ghana-2026",
    description:
      "A full-day conference and workshop series celebrating and equipping women in Ghana's technology sector. Panel discussions, hands-on coding workshops, portfolio reviews, mentorship speed-rounds, and a networking lunch. Speakers include Ghanaian tech leaders from Google Africa, mPharma, Farmerline.",
    short_desc:
      "Ghana's biggest women-in-tech conference. Panels, workshops, mentorship, and community.",
    cat: "education",
    venue: "Accra International Conference Centre",
    start: "2026-08-29T08:00:00+00:00",
    end: "2026-08-29T18:00:00+00:00",
    capacity: 600,
    featured: true,
    landmark: false,
    sponsored: false,
    orgIdx: 2,
    tags: ["women", "tech", "education", "conference", "accra", "coding"],
    tickets: [
      {
        name: "General Admission",
        price: 50,
        type: "paid",
        qty: 400,
        order: 0,
      },
      {
        name: "Student (ID required)",
        price: 20,
        type: "paid",
        qty: 150,
        order: 1,
      },
      {
        name: "Sponsor / Corporate",
        price: 300,
        type: "paid",
        qty: 50,
        order: 2,
      },
    ],
  },
];

const insertedEventIds = [];

for (let i = 0; i < EVENTS.length; i++) {
  const ev = EVENTS[i];
  const catId = catMap[ev.cat];
  const venueId = venueMap[ev.venue] ?? null;
  const orgUserId = organizerUserIds[ev.orgIdx] ?? seedUserId;

  if (!catId) {
    log("err", `Unknown cat slug: ${ev.cat}`);
    continue;
  }

  // Check if event already exists
  const { data: existCheck } = await select(
    "events",
    `select=id,banner_url&slug=eq.${ev.slug}`,
  );
  let eventId =
    Array.isArray(existCheck) && existCheck.length > 0
      ? existCheck[0].id
      : null;
  let existingBannerUrl = existCheck?.[0]?.banner_url ?? null;

  // Images
  const pool = IMG[ev.cat] ?? IMG.music;
  const bannerImgUrl = pool[i % pool.length];
  const gallery0ImgUrl = pool[(i + 1) % pool.length];
  const gallery1ImgUrl = pool[(i + 2) % pool.length];

  let bannerUrl = existingBannerUrl;
  let galleryUrls = [];

  if (!existingBannerUrl) {
    try {
      console.log(`    → Uploading images for "${ev.title}"...`);
      const bannerBuf = await downloadImage(bannerImgUrl);
      bannerUrl = await storageUpload(
        "event-banners",
        `${ev.slug}/banner.jpg`,
        bannerBuf,
      );

      const g0 = await downloadImage(gallery0ImgUrl);
      const g0url = await storageUpload(
        "event-gallery",
        `${ev.slug}/0.jpg`,
        g0,
      );
      if (g0url) galleryUrls.push(g0url);

      const g1 = await downloadImage(gallery1ImgUrl);
      const g1url = await storageUpload(
        "event-gallery",
        `${ev.slug}/1.jpg`,
        g1,
      );
      if (g1url) galleryUrls.push(g1url);

      log("ok", `Images uploaded for "${ev.title}"`);
    } catch (e) {
      log("warn", `Image upload failed for "${ev.title}": ${e.message}`);
      bannerUrl = bannerImgUrl; // fallback to Unsplash URL
      galleryUrls = [gallery0ImgUrl, gallery1ImgUrl];
    }
  } else {
    log("ok", `"${ev.title}" already has banner — skipping upload`);
  }

  if (!eventId) {
    const payload = {
      organizer_id: orgUserId,
      category_id: catId,
      venue_id: venueId,
      title: ev.title,
      slug: ev.slug,
      description: ev.description,
      short_description: ev.short_desc,
      tags: ev.tags,
      banner_url: bannerUrl,
      gallery_urls: galleryUrls,
      start_datetime: ev.start,
      end_datetime: ev.end,
      timezone: "Africa/Accra",
      is_online: false,
      total_capacity: ev.capacity,
      tickets_sold: 0,
      status: "published",
      published_at: new Date().toISOString(),
      is_featured: ev.featured,
      is_landmark: ev.landmark,
      is_sponsored: ev.sponsored,
      views_count: Math.floor(Math.random() * 2000) + 100,
      saves_count: Math.floor(Math.random() * 300) + 10,
    };

    const { ok: ins, data } = await insert("events", payload, true);
    if (ins && Array.isArray(data) && data[0]?.id) {
      eventId = data[0].id;
      log("ok", `Created event: "${ev.title}" (${eventId.slice(0, 8)}...)`);
    } else {
      log(
        "err",
        `Event insert failed: "${ev.title}" — ${JSON.stringify(data).substring(0, 100)}`,
      );
      continue;
    }
  } else {
    log("ok", `Event exists: "${ev.title}"`);
  }

  insertedEventIds.push(eventId);

  // Ticket types
  for (const tt of ev.tickets) {
    const { data: ttCheck } = await select(
      "ticket_types",
      `select=id&event_id=eq.${eventId}&name=eq.${encodeURIComponent(tt.name)}`,
    );
    if (Array.isArray(ttCheck) && ttCheck.length > 0) continue;

    await insert("ticket_types", {
      event_id: eventId,
      name: tt.name,
      price: tt.price,
      price_type: tt.type,
      currency: "GHS",
      quantity_total: tt.qty,
      quantity_sold: 0,
      max_per_user: 5,
      is_active: true,
      sort_order: tt.order,
    });
  }
}

// ─────────────────────────────────────────────────────────────
// STEP 7 — Graph Edges
// ─────────────────────────────────────────────────────────────
step("Seeding graph edges for feed algorithm");

const edges = [];
for (let i = 0; i < insertedEventIds.length; i++) {
  const eventId = insertedEventIds[i];
  if (!eventId) continue;
  const ev = EVENTS[i];
  const catId = catMap[ev.cat];
  const orgUserId = organizerUserIds[ev.orgIdx] ?? seedUserId;

  if (catId)
    edges.push({
      from_id: eventId,
      from_type: "event",
      to_id: catId,
      to_type: "category",
      edge_type: "belongs_to",
      weight: 1.0,
    });
  edges.push({
    from_id: eventId,
    from_type: "event",
    to_id: orgUserId,
    to_type: "organizer",
    edge_type: "organized_by",
    weight: 1.0,
  });

  // Simulate some user-to-event saves for algorithm signal
  for (let u = 0; u < Math.min(6, users.length); u++) {
    if (Math.random() > 0.5) {
      edges.push({
        from_id: users[u].id,
        from_type: "user",
        to_id: eventId,
        to_type: "event",
        edge_type: "save",
        weight: 5.0,
      });
    }
  }
}

if (edges.length > 0 && !DRY_RUN) {
  // Insert in small batches to avoid PostgREST row-key mismatch
  const BATCH = 20;
  let inserted = 0;
  for (let b = 0; b < edges.length; b += BATCH) {
    const batch = edges.slice(b, b + BATCH);
    const { ok: edgesOk, data: edgesData } = await upsert(
      "graph_edges",
      batch,
      "from_id,to_id,edge_type",
    );
    if (edgesOk) {
      inserted += batch.length;
    } else {
      log(
        "warn",
        `Edges batch error: ${JSON.stringify(edgesData).substring(0, 80)}`,
      );
    }
  }
  log("ok", `Seeded ${inserted} graph edges`);
} else {
  log("skip", `Would seed ${edges.length} graph edges`);
}

// ─────────────────────────────────────────────────────────────
// STEP 8 — Waitlist
// ─────────────────────────────────────────────────────────────
step("Seeding waitlist entries (if table exists)");

const WAITLIST = [
  
];

// DB has table named 'waitlist_signups' (not 'waitlist')
const { ok: wOk, data: wData } = await upsert(
  "waitlist_signups",
  WAITLIST,
  "email",
);
if (wOk) {
  log("ok", `Seeded ${WAITLIST.length} waitlist_signups entries`);
} else {
  const msg = JSON.stringify(wData);
  if (
    msg.includes("does not exist") ||
    msg.includes("42P01") ||
    msg.includes("Could not fi")
  ) {
    log(
      "warn",
      "waitlist_signups table missing — run docs/waitlist-schema.sql in Supabase SQL Editor",
    );
  } else {
    log("err", `Waitlist error: ${msg.substring(0, 120)}`);
  }
}

// ─────────────────────────────────────────────────────────────
// SUMMARY
// ─────────────────────────────────────────────────────────────
const { data: bucketList } = await (async () => {
  const r = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, { headers: BASE });
  return { data: await r.json() };
})();

console.log(`
${"═".repeat(60)}
🎉  SEED COMPLETE${DRY_RUN ? " (DRY RUN — nothing was written)" : ""}
${"═".repeat(60)}

📦 Storage Buckets: ${Array.isArray(bucketList) ? bucketList.length : "?"} total
${Array.isArray(bucketList) ? bucketList.map((b) => `   • ${b.name} (public: ${b.public})`).join("\n") : ""}

🎪 Events processed: ${insertedEventIds.length}
🏢 Organizer profiles: ${ORGS.length} attempted
🏛️  Venues mapped: ${Object.keys(venueMap).length}
🔗 Graph edges: ${edges.length}
📋 Waitlist entries: ${WAITLIST.length}

⚠️  RUN THESE MIGRATIONS NEXT (if not done yet):
   1. Supabase SQL Editor → paste docs/006_messages_and_cart.sql
      → creates: conversations, messages, cart_items
   2. Supabase SQL Editor → paste docs/007_organizer_mode.sql
      → creates: posts, comments, hashtags, ad_campaigns
   3. Supabase SQL Editor → paste docs/waitlist-schema.sql
      → creates: waitlist

📖 Full architecture + wiring plan:
   docs/architecture-and-wiring-plan.md
`);
