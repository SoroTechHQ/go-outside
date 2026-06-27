import { NextRequest, NextResponse } from "next/server";
import { lookupGhanaPostAddress, resolveGhanaPostCode } from "../../../lib/ghana-post";

const CACHE = "public, max-age=86400, stale-while-revalidate=604800";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Forward lookup: GhanaPost code → lat/lng
  const code = searchParams.get("code");
  if (code) {
    const result = await resolveGhanaPostCode(code.trim());
    if (!result) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }
    return NextResponse.json(result, { headers: { "Cache-Control": CACHE } });
  }

  // Reverse lookup: lat/lng → GhanaPost address
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));

  if (!lat || !lng || Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json({ error: "code or (lat and lng) required" }, { status: 400 });
  }

  const address = await lookupGhanaPostAddress(lat, lng);
  if (!address) {
    return NextResponse.json({ error: "Address not found" }, { status: 404 });
  }

  return NextResponse.json(address, { headers: { "Cache-Control": CACHE } });
}
