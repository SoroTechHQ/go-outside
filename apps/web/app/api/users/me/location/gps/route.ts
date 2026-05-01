import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../../../lib/supabase";
import { isMissingLocationPointColumn, toLocationPoint } from "../../../../../../lib/location-point";

export async function POST(req: NextRequest) {
  const clerk = await currentUser();
  if (!clerk) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lat, lng } = await req.json() as { lat: number; lng: number };
  if (typeof lat !== "number" || typeof lng !== "number") {
    return NextResponse.json({ error: "lat and lng required" }, { status: 400 });
  }

  // Reverse geocode using Google Geocoding API
  const key = process.env.GOOGLE_PLACES_SERVER_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_PLACES_KEY;
  if (!key) {
    return NextResponse.json({ error: "Missing Google API key" }, { status: 500 });
  }

  const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&result_type=locality&key=${key}`;
  const geoRes = await fetch(geoUrl);
  const geoJson = await geoRes.json() as {
    status: string;
    results: Array<{
      place_id: string;
      formatted_address: string;
      address_components: Array<{ long_name: string; types: string[] }>;
    }>;
  };

  let city_name   = "";
  let region      = "";
  let country     = "Ghana";
  let place_id    = "";
  let formatted   = "";

  if (geoJson.status === "OK" && geoJson.results[0]) {
    const r    = geoJson.results[0];
    place_id   = r.place_id;
    formatted  = r.formatted_address;
    const get  = (type: string) =>
      r.address_components.find((c) => c.types.includes(type))?.long_name ?? "";
    city_name  = get("locality") || get("administrative_area_level_2");
    region     = get("administrative_area_level_1");
    country    = get("country") || "Ghana";
  }

  // Persist to DB
  const updates = {
    location_point:     toLocationPoint(lat, lng),
    location_city:      city_name,
    location_city_name: city_name,
    location_region:    region,
    location_country:   country,
    location_formatted: formatted,
    location_place_id:  place_id,
    location_source:    "gps",
    updated_at:         new Date().toISOString(),
  };

  const runUpdate = (payload: Omit<typeof updates, "location_point"> | typeof updates) =>
    supabaseAdmin
      .from("users")
      .update(payload)
      .eq("clerk_id", clerk.id);

  let { error } = await runUpdate(updates);

  if (error && isMissingLocationPointColumn(error)) {
    const { location_point: _ignored, ...updatesWithoutLocationPoint } = updates;
    ({ error } = await runUpdate(updatesWithoutLocationPoint));
  }

  if (error) {
    console.error("[POST /api/users/me/location/gps]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ city_name, region, country, place_id, formatted_address: formatted, lat, lng });
}
