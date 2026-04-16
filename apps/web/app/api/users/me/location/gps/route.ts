import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../../../lib/supabase";

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
  const { error } = await supabaseAdmin
    .from("users")
    .update({
      location_point:     `SRID=4326;POINT(${lng} ${lat})`,
      location_city:      city_name,
      location_city_name: city_name,
      location_region:    region,
      location_country:   country,
      location_formatted: formatted,
      location_place_id:  place_id,
      location_source:    "gps",
      updated_at:         new Date().toISOString(),
    })
    .eq("clerk_id", clerk.id);

  if (error) {
    console.error("[POST /api/users/me/location/gps]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ city_name, region, country, place_id, formatted_address: formatted, lat, lng });
}
