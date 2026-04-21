import { execFile as execFileCallback } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import { createClient } from "@supabase/supabase-js";

const ROOT = process.cwd();
const COMPETITOR_DIR = path.join(ROOT, "docs", "competitor");
const SCHEMA_SNAPSHOT_PATH = path.join(ROOT, "docs", "full context schema");
const ACTIVITIES_PATH = path.join(COMPETITOR_DIR, "activities.json");
const MANUAL_CANDIDATES_PATH = path.join(COMPETITOR_DIR, "events-to-add.txt");
const UNRESOLVED_CANDIDATES_PATH = path.join(COMPETITOR_DIR, "manual-events.unresolved.json");
const IMPORT_ONLY_TITLES_FILE = process.env.IMPORT_ONLY_TITLES_FILE
  ? path.resolve(ROOT, process.env.IMPORT_ONLY_TITLES_FILE)
  : null;

const SOURCE_PLATFORM = "thegaderin";
const EVENT_IMAGE_BUCKET = "event-banners";
const DEFAULT_TIMEZONE = "Africa/Accra";
const DEFAULT_COUNTRY = "Ghana";

const argFlags = new Set(process.argv.slice(2));
const DRY_RUN = process.env.DRY_RUN === "1" || argFlags.has("--dry-run");
const LIMIT = Number(process.env.IMPORT_LIMIT || 0);
const execFile = promisify(execFileCallback);

const CATEGORY_DEFAULTS = {
  arts: { name: "Arts & Culture", iconKey: "paint-brush", color: "#DB2777" },
  sports: { name: "Sports & Fitness", iconKey: "soccer-ball", color: "#16A34A" },
  tours: { name: "Tours & Sightseeing", iconKey: "buildings", color: "#0F766E" },
  workshop: { name: "Workshops", iconKey: "paint-brush", color: "#CA8A04" },
  food: { name: "Food & Drink", iconKey: "fork-knife", color: "#D97706" },
  wellness: { name: "Wellness & Lifestyle", iconKey: "sparkle", color: "#059669" },
  outdoor: { name: "Outdoor Adventures", iconKey: "house", color: "#15803D" },
  gaming: { name: "Gaming", iconKey: "devices", color: "#7C3AED" },
  music: { name: "Music & Concerts", iconKey: "music-notes", color: "#7C3AED" },
  masterclass: { name: "Masterclass", iconKey: "cpu", color: "#2563EB" },
  history: { name: "History & Heritage", iconKey: "buildings", color: "#92400E" },
  nightlife: { name: "Nightlife", iconKey: "music-notes", color: "#C026D3" },
};

const CATEGORY_ALIAS_MAP = {
  food: "food-drink",
  workshop: "education",
  masterclass: "education",
  history: "education",
  tours: "community",
  outdoor: "community",
  gaming: "community",
  wellness: "sports",
  nightlife: "music",
};

const CITY_HINTS = [
  "Accra",
  "East Legon",
  "Labone",
  "Haatso",
  "Osu",
  "Cantonments",
  "Tema",
  "Achimota",
  "Aburi",
  "Akosombo",
  "Akuse",
  "Cape Coast",
  "Kumasi",
  "Tamale",
  "Takoradi",
  "Kasoa",
];

function decodeJwtPayload(token) {
  const parts = token.split(".");
  if (parts.length < 2) {
    throw new Error("Invalid Supabase service role key.");
  }
  const json = Buffer.from(parts[1], "base64url").toString("utf8");
  return JSON.parse(json);
}

function deriveSupabaseUrl(serviceRoleKey) {
  const payload = decodeJwtPayload(serviceRoleKey);
  if (!payload.ref) {
    throw new Error("Could not derive Supabase project ref from service role key.");
  }
  return `https://${payload.ref}.supabase.co`;
}

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || deriveSupabaseUrl(serviceRoleKey);
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

function slugify(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTitle(value) {
  return slugify(String(value || "").replace(/&/g, " and "));
}

function splitName(fullName) {
  const clean = normalizeText(fullName || "Imported Organizer");
  const parts = clean.split(" ").filter(Boolean);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "Organizer" };
  }
  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts.slice(-1).join(" "),
  };
}

function inferCity(record) {
  const haystack = [
    record.location_name,
    record.location_label,
    record.location_map_url,
    record.description,
    record.about_text,
  ]
    .filter(Boolean)
    .join(" ");

  const lower = haystack.toLowerCase();
  for (const hint of CITY_HINTS) {
    if (lower.includes(hint.toLowerCase())) {
      return hint;
    }
  }
  return "Accra";
}

function inferRegion(record) {
  const value = normalizeText(record.location_map_url || "");
  if (/region$/i.test(value)) {
    return value;
  }
  return null;
}

function inferEndDatetime(record) {
  const start = record.start_date_iso ? new Date(record.start_date_iso) : null;
  if (!start || Number.isNaN(start.getTime())) {
    throw new Error(`Event ${record.title} is missing a valid start_date_iso.`);
  }

  const category = normalizeText(record.category).toLowerCase();
  let durationHours = 3;
  if (["tours", "outdoor"].includes(category)) durationHours = 8;
  if (["nightlife", "music"].includes(category)) durationHours = 5;
  if (["sports", "wellness"].includes(category)) durationHours = 3;

  return new Date(start.getTime() + durationHours * 60 * 60 * 1000).toISOString();
}

function inferTicketType(record) {
  const priceValue = Number(record.price_value ?? 0);
  const isFree = !priceValue;
  return {
    name: "General Admission",
    description: normalizeText(record.price_display || "Standard entry"),
    price: isFree ? 0 : priceValue,
    price_type: isFree ? "free" : "paid",
    currency: normalizeText(record.price_currency || "GHS") || "GHS",
    quantity_total: null,
    max_per_user: 5,
    sale_starts_at: null,
    sale_ends_at: null,
    is_active: true,
    sort_order: 0,
  };
}

function buildTags(record, categorySlug, city) {
  const base = [
    categorySlug,
    city,
    normalizeText(record.organizer_name),
    ...String(record.title || "")
      .split(/[^a-zA-Z0-9]+/)
      .map((part) => part.trim())
      .filter((part) => part.length >= 4),
  ];

  const seen = new Set();
  const tags = [];
  for (const value of base) {
    const tag = slugify(value).replace(/-/g, " ");
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    tags.push(tag);
    if (tags.length >= 12) break;
  }
  return tags;
}

function categorySeed(categorySlug) {
  const rawKey = normalizeText(categorySlug).toLowerCase();
  const key = CATEGORY_ALIAS_MAP[rawKey] || rawKey;
  const fallback = {
    name: key ? key.replace(/\b\w/g, (m) => m.toUpperCase()) : "Community",
    iconKey: "sparkle",
    color: "#64748B",
  };
  return { slug: key, ...(CATEGORY_DEFAULTS[key] || fallback) };
}

function contentTypeForFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".avif":
      return "image/avif";
    case ".jpeg":
    case ".jpg":
    default:
      return "image/jpeg";
  }
}

function optimizedImageSpec(kind) {
  if (kind === "banner") {
    return { maxWidth: 1440, maxHeight: 1440, quality: 72 };
  }
  return { maxWidth: 960, maxHeight: 960, quality: 64 };
}

async function optimizeImageForUpload(localImagePath, kind, eventSlug, index) {
  const tmpPath = path.join(
    os.tmpdir(),
    `gooutside-${eventSlug}-${kind}-${index}-${Date.now()}.webp`
  );
  const spec = optimizedImageSpec(kind);

  await execFile("/opt/homebrew/bin/magick", [
    localImagePath,
    "-auto-orient",
    "-strip",
    "-resize",
    `${spec.maxWidth}x${spec.maxHeight}>`,
    "-quality",
    String(spec.quality),
    `webp:${tmpPath}`,
  ]);

  const fileBuffer = await fs.readFile(tmpPath);
  await fs.unlink(tmpPath).catch(() => {});

  return {
    fileBuffer,
    contentType: "image/webp",
    extension: ".webp",
  };
}

function truncate(value, maxLength) {
  const clean = normalizeText(value);
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength - 1).trimEnd()}…`;
}

async function assertInputFiles() {
  for (const filePath of [ACTIVITIES_PATH, MANUAL_CANDIDATES_PATH, SCHEMA_SNAPSHOT_PATH]) {
    try {
      await fs.access(filePath);
    } catch {
      throw new Error(`Required input file not found: ${filePath}`);
    }
  }

  if (IMPORT_ONLY_TITLES_FILE) {
    try {
      await fs.access(IMPORT_ONLY_TITLES_FILE);
    } catch {
      throw new Error(`Title filter file not found: ${IMPORT_ONLY_TITLES_FILE}`);
    }
  }
}

async function readOnlyTitles() {
  const inlineTitles = normalizeText(process.env.IMPORT_ONLY_TITLES || "");
  const titles = [];

  if (inlineTitles) {
    titles.push(
      ...inlineTitles
        .split("|")
        .map((value) => normalizeText(value))
        .filter(Boolean)
    );
  }

  if (IMPORT_ONLY_TITLES_FILE) {
    const raw = await fs.readFile(IMPORT_ONLY_TITLES_FILE, "utf8");
    titles.push(
      ...raw
        .split("\n")
        .map((line) => normalizeText(line))
        .filter(Boolean)
    );
  }

  return new Set(titles.map((title) => normalizeTitle(title)));
}

async function readStructuredRecords() {
  const raw = await fs.readFile(ACTIVITIES_PATH, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error("activities.json must contain an array.");
  }
  const onlyTitles = await readOnlyTitles();
  const filtered = onlyTitles.size
    ? parsed.filter((record) => onlyTitles.has(normalizeTitle(record.title || record.name)))
    : parsed;
  return LIMIT > 0 ? filtered.slice(0, LIMIT) : filtered;
}

async function readManualCandidateTitles() {
  const raw = await fs.readFile(MANUAL_CANDIDATES_PATH, "utf8");
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^\d+\./.test(line))
    .map((line) => normalizeText(line.replace(/^\d+\.\s*/, "")))
    .filter(Boolean);
}

async function ensureBucket(bucketName) {
  if (DRY_RUN) return;
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) throw listError;
  const exists = (buckets || []).some((bucket) => bucket.name === bucketName);
  if (exists) return;
  const { error: createError } = await supabase.storage.createBucket(bucketName, {
    public: true,
    fileSizeLimit: "20MB",
  });
  if (createError && !String(createError.message || "").includes("already exists")) {
    throw createError;
  }
}

async function fetchExistingState() {
  const [categoriesRes, eventsRes, venuesRes] = await Promise.all([
    supabase.from("categories").select("id, slug, name, icon_key, color, sort_order"),
    supabase.from("events").select("id, slug, title"),
    supabase.from("venues").select("id, name, address"),
  ]);

  if (categoriesRes.error) throw categoriesRes.error;
  if (eventsRes.error) throw eventsRes.error;
  if (venuesRes.error) throw venuesRes.error;

  const categoriesBySlug = new Map((categoriesRes.data || []).map((row) => [row.slug, row]));
  const categoriesByName = new Map(
    (categoriesRes.data || []).map((row) => [normalizeText(row.name).toLowerCase(), row])
  );
  const eventsBySlug = new Map((eventsRes.data || []).map((row) => [row.slug, row]));
  const eventsByNormalizedTitle = new Map(
    (eventsRes.data || []).map((row) => [normalizeTitle(row.title), row])
  );
  const venuesByKey = new Map(
    (venuesRes.data || []).map((row) => [
      `${normalizeTitle(row.name)}::${normalizeTitle(row.address)}`,
      row,
    ])
  );

  return { categoriesBySlug, categoriesByName, eventsBySlug, eventsByNormalizedTitle, venuesByKey };
}

async function createImportRun() {
  if (DRY_RUN) return null;
  const { data, error } = await supabase
    .from("event_import_runs")
    .insert({
      source_name: SOURCE_PLATFORM,
      source_file: ACTIVITIES_PATH,
      notes: `Structured scrape: ${ACTIVITIES_PATH}; manual candidates: ${MANUAL_CANDIDATES_PATH}`,
      dry_run: false,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

async function finishImportRun(importRunId, stats) {
  if (DRY_RUN || !importRunId) return;
  const { error } = await supabase
    .from("event_import_runs")
    .update({
      imported_count: stats.imported,
      skipped_count: stats.skipped,
      failed_count: stats.failed,
      finished_at: new Date().toISOString(),
    })
    .eq("id", importRunId);

  if (error) throw error;
}

async function ensureCategory(sourceCategory, state) {
  const candidate = categorySeed(sourceCategory || "community");
  if (state.categoriesBySlug.has(candidate.slug)) {
    return state.categoriesBySlug.get(candidate.slug);
  }
  const existingByName = state.categoriesByName.get(candidate.name.toLowerCase());
  if (existingByName) {
    state.categoriesBySlug.set(existingByName.slug, existingByName);
    return existingByName;
  }

  if (DRY_RUN) {
    const dryRow = {
      id: `dry-category-${candidate.slug}`,
      slug: candidate.slug,
      name: candidate.name,
      icon_key: candidate.iconKey,
      color: candidate.color,
      sort_order: state.categoriesBySlug.size + 1,
    };
    state.categoriesBySlug.set(candidate.slug, dryRow);
    state.categoriesByName.set(candidate.name.toLowerCase(), dryRow);
    return dryRow;
  }

  const { data, error } = await supabase
    .from("categories")
    .upsert(
      {
        slug: candidate.slug,
        name: candidate.name,
        icon_key: candidate.iconKey,
        color: candidate.color,
        is_active: true,
        sort_order: state.categoriesBySlug.size + 1,
      },
      { onConflict: "slug" }
    )
    .select("id, slug, name, icon_key, color, sort_order")
    .single();

  if (error) throw error;
  state.categoriesBySlug.set(candidate.slug, data);
  state.categoriesByName.set(candidate.name.toLowerCase(), data);
  return data;
}

async function ensureOrganizer(record, categorySlug) {
  const organizerName = normalizeText(record.organizer_name || "Imported Organizer");
  const organizerSlug = slugify(organizerName) || "imported-organizer";
  const syntheticClerkId = `import:${SOURCE_PLATFORM}:organizer:${organizerSlug}`;
  const syntheticEmail = `import+${SOURCE_PLATFORM}-${organizerSlug}@gooutside.local`;
  const { firstName, lastName } = splitName(organizerName);

  if (DRY_RUN) {
    return {
      user: { id: `dry-user-${organizerSlug}` },
      profile: { id: `dry-profile-${organizerSlug}` },
    };
  }

  const { data: user, error: userError } = await supabase
    .from("users")
    .upsert(
      {
        clerk_id: syntheticClerkId,
        email: syntheticEmail,
        first_name: firstName,
        last_name: lastName,
        avatar_url: null,
        role: "organizer",
        is_verified_organizer: true,
        account_type: "organizer",
        organizer_category: [categorySlug],
        organizer_bio: truncate(
          record.about_text || record.description || `Imported organizer for ${record.title}`,
          1000
        ),
      },
      { onConflict: "clerk_id" }
    )
    .select("id")
    .single();

  if (userError) throw userError;

  const { data: profile, error: profileError } = await supabase
    .from("organizer_profiles")
    .upsert(
      {
        user_id: user.id,
        organization_name: organizerName,
        bio: truncate(
          `Imported from ${SOURCE_PLATFORM}. Original organizer profile: ${record.organizer_url || "N/A"}`,
          1000
        ),
        website_url: null,
        social_links: record.organizer_url
          ? { source_profile_url: record.organizer_url }
          : {},
        logo_url: null,
        status: "approved",
      },
      { onConflict: "user_id" }
    )
    .select("id")
    .single();

  if (profileError) throw profileError;

  return { user, profile };
}

async function ensureVenue(record, createdBy, state) {
  const name = normalizeText(record.location_name || record.location_label || "TBA Venue");
  const address = normalizeText(record.location_map_url || record.location_label || name);
  const cacheKey = `${normalizeTitle(name)}::${normalizeTitle(address)}`;
  const existing = state.venuesByKey.get(cacheKey);
  if (existing) return existing;

  const city = inferCity(record);
  const region = inferRegion(record);

  if (DRY_RUN) {
    const dryVenue = {
      id: `dry-venue-${slugify(name)}`,
      name,
      address,
      city,
      region,
    };
    state.venuesByKey.set(cacheKey, dryVenue);
    return dryVenue;
  }

  const { data, error } = await supabase
    .from("venues")
    .insert({
      name,
      address,
      city,
      country: DEFAULT_COUNTRY,
      created_by: createdBy,
      is_verified: false,
      google_maps_url:
        record.location_map_url && /^https?:\/\//i.test(record.location_map_url)
          ? record.location_map_url
          : null,
      city_name: city,
      region,
      formatted_address: address,
    })
    .select("id, name, address, city")
    .single();

  if (error) throw error;
  state.venuesByKey.set(cacheKey, data);
  return data;
}

async function uploadImage(fileBuffer, objectPath, contentType) {
  const { error: uploadError } = await supabase.storage
    .from(EVENT_IMAGE_BUCKET)
    .upload(objectPath, fileBuffer, {
      contentType,
      cacheControl: "31536000",
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(EVENT_IMAGE_BUCKET).getPublicUrl(objectPath);
  return data.publicUrl;
}

async function syncImages(record, eventSlug) {
  const images = [];
  for (const [index, image] of (record.images || []).entries()) {
    const kind = index === 0 ? "banner" : "gallery";
    const optimized = await optimizeImageForUpload(image.local_path, kind, eventSlug, index + 1);
    const objectPath = `${SOURCE_PLATFORM}/${eventSlug}/${index + 1}${optimized.extension}`;
    const publicUrl = DRY_RUN
      ? `${supabaseUrl}/storage/v1/object/public/${EVENT_IMAGE_BUCKET}/${objectPath}`
      : await uploadImage(optimized.fileBuffer, objectPath, optimized.contentType);

    images.push({
      bucket_name: EVENT_IMAGE_BUCKET,
      object_path: objectPath,
      public_url: publicUrl,
      source_url: image.source_url || null,
      kind,
      sort_order: index,
    });
  }

  return {
    bannerUrl: images[0]?.public_url || null,
    galleryUrls: images.map((entry) => entry.public_url),
    imageAssets: images,
  };
}

function buildEventPayload(record, eventSlug, organizerId, categoryId, categorySlug, venueId, city, region, media) {
  const startDatetime = new Date(record.start_date_iso).toISOString();
  const endDatetime = inferEndDatetime(record);
  const description = normalizeText(record.about_text || record.description || record.title);

  return {
    organizer_id: organizerId,
    category_id: categoryId,
    venue_id: venueId,
    title: normalizeText(record.title),
    slug: eventSlug,
    description,
    short_description: truncate(record.description || record.listing?.listing_excerpt || description, 160),
    banner_url: media.bannerUrl,
    gallery_urls: media.galleryUrls,
    start_datetime: startDatetime,
    end_datetime: endDatetime,
    timezone: DEFAULT_TIMEZONE,
    is_online: false,
    custom_location: normalizeText(record.location_label || record.location_name),
    total_capacity: null,
    status: "published",
    is_featured: false,
    published_at: new Date().toISOString(),
    venue_city: city,
    venue_region: region,
    tags: buildTags(record, categorySlug, city),
  };
}

async function upsertEvent(record, organizerId, category, venue, state, importRunId) {
  let eventSlug = record.slug || slugify(record.title);
  const existingImported =
    !DRY_RUN &&
    (await supabase
      .from("event_import_sources")
      .select("event_id")
      .eq("source_platform", SOURCE_PLATFORM)
      .eq("source_url", record.url)
      .maybeSingle());

  if (existingImported?.error) throw existingImported.error;

  let existingEventId = existingImported?.data?.event_id || null;
  if (!existingEventId) {
    while (state.eventsBySlug.has(eventSlug)) {
      eventSlug = `${eventSlug}-${Math.random().toString(36).slice(2, 6)}`;
    }
  }

  const city = inferCity(record);
  const region = inferRegion(record);
  const dryEventId = `dry-event-${eventSlug}`;
  const media = await syncImages(record, eventSlug);
  const payload = buildEventPayload(
    record,
    eventSlug,
    organizerId,
    category.id,
    category.slug,
    venue.id,
    city,
    region,
    media
  );

  if (DRY_RUN) {
    const dryEvent = { id: dryEventId, slug: eventSlug, title: payload.title };
    state.eventsBySlug.set(eventSlug, dryEvent);
    state.eventsByNormalizedTitle.set(normalizeTitle(payload.title), dryEvent);
    return { eventId: dryEventId, eventSlug, city, region };
  }

  let eventId = existingEventId;
  if (eventId) {
    const { data, error } = await supabase
      .from("events")
      .update(payload)
      .eq("id", eventId)
      .select("id, slug, title")
      .single();
    if (error) throw error;
    eventId = data.id;
    state.eventsBySlug.set(data.slug, data);
    state.eventsByNormalizedTitle.set(normalizeTitle(data.title), data);
  } else {
    const { data, error } = await supabase
      .from("events")
      .upsert(payload, { onConflict: "slug" })
      .select("id, slug, title")
      .single();
    if (error) throw error;
    eventId = data.id;
    state.eventsBySlug.set(data.slug, data);
    state.eventsByNormalizedTitle.set(normalizeTitle(data.title), data);
  }

  const ticketType = inferTicketType(record);
  const { data: existingTicketTypes, error: ticketSelectError } = await supabase
    .from("ticket_types")
    .select("id")
    .eq("event_id", eventId)
    .eq("name", ticketType.name)
    .limit(1);
  if (ticketSelectError) throw ticketSelectError;

  if (existingTicketTypes && existingTicketTypes.length > 0) {
    const { error: ticketUpdateError } = await supabase
      .from("ticket_types")
      .update(ticketType)
      .eq("id", existingTicketTypes[0].id);
    if (ticketUpdateError) throw ticketUpdateError;
  } else {
    const { error: ticketInsertError } = await supabase.from("ticket_types").insert({
      event_id: eventId,
      ...ticketType,
    });
    if (ticketInsertError) throw ticketInsertError;
  }

  if (media.imageAssets.length > 0) {
    const { data: existingImageAssets, error: existingImageAssetsError } = await supabase
      .from("event_image_assets")
      .select("object_path")
      .eq("event_id", eventId);
    if (existingImageAssetsError) throw existingImageAssetsError;

    const nextObjectPaths = new Set(media.imageAssets.map((entry) => entry.object_path));
    const staleObjectPaths = (existingImageAssets || [])
      .map((entry) => entry.object_path)
      .filter((objectPath) => !nextObjectPaths.has(objectPath));

    if (staleObjectPaths.length > 0) {
      const { error: removeError } = await supabase.storage
        .from(EVENT_IMAGE_BUCKET)
        .remove(staleObjectPaths);
      if (removeError) throw removeError;
    }

    const imageAssetRows = media.imageAssets.map((entry) => ({
      event_id: eventId,
      import_run_id: importRunId,
      ...entry,
    }));
    const { error: imageAssetError } = await supabase.from("event_image_assets").upsert(
      imageAssetRows,
      { onConflict: "event_id,kind,sort_order" }
    );
    if (imageAssetError) throw imageAssetError;
  }

  const { error: sourceError } = await supabase.from("event_import_sources").upsert(
    {
      event_id: eventId,
      import_run_id: importRunId,
      source_platform: SOURCE_PLATFORM,
      source_url: record.url,
      source_event_slug: record.slug,
      source_organizer_name: record.organizer_name,
      source_organizer_url: record.organizer_url,
      source_payload: record,
      status: "active",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "source_platform,source_url" }
  );
  if (sourceError) throw sourceError;

  return { eventId, eventSlug, city, region };
}

async function upsertManualCandidates(titles, state) {
  const unresolved = [];

  for (const title of titles) {
    const normalized = normalizeTitle(title);
    const matchedEvent = state.eventsByNormalizedTitle.get(normalized) || null;

    const payload = {
      requested_title: title,
      requested_source_file: MANUAL_CANDIDATES_PATH,
      notes: matchedEvent
        ? "Matched to an imported or existing event."
        : "Needs manual research or a dedicated source record before import.",
      candidate_payload: { normalized_title: normalized },
      matched_event_id: matchedEvent?.id || null,
      status: matchedEvent ? "matched" : "pending",
      updated_at: new Date().toISOString(),
    };

    if (!matchedEvent) {
      unresolved.push({
        requested_title: title,
        normalized_title: normalized,
      });
    }

    if (!DRY_RUN) {
      const { error } = await supabase
        .from("event_import_candidates")
        .upsert(payload, { onConflict: "requested_title" });
      if (error) throw error;
    }
  }

  await fs.writeFile(UNRESOLVED_CANDIDATES_PATH, JSON.stringify(unresolved, null, 2));
  return unresolved;
}

async function main() {
  await assertInputFiles();
  await ensureBucket(EVENT_IMAGE_BUCKET);

  const structuredRecords = await readStructuredRecords();
  const manualCandidateTitles = await readManualCandidateTitles();
  const state = await fetchExistingState();
  const importRunId = await createImportRun();

  const stats = {
    imported: 0,
    skipped: 0,
    failed: 0,
    unresolvedCandidates: 0,
  };

  for (const record of structuredRecords) {
    try {
      const category = await ensureCategory(record.category, state);
      const organizer = await ensureOrganizer(record, category.slug);
      const venue = await ensureVenue(record, organizer.user.id, state);
      await upsertEvent(record, organizer.user.id, category, venue, state, importRunId);
      stats.imported += 1;
    } catch (error) {
      stats.failed += 1;
      console.error(`[import] failed for ${record.title}`, error);
    }
  }

  const unresolved = await upsertManualCandidates(manualCandidateTitles, state);
  stats.unresolvedCandidates = unresolved.length;

  await finishImportRun(importRunId, stats);

  console.log(
    JSON.stringify(
      {
        dryRun: DRY_RUN,
        supabaseUrl,
        imported: stats.imported,
        failed: stats.failed,
        unresolvedCandidates: stats.unresolvedCandidates,
        unresolvedCandidatesPath: UNRESOLVED_CANDIDATES_PATH,
        sourceFile: ACTIVITIES_PATH,
      },
      null,
      2
    )
  );
}

await main();
