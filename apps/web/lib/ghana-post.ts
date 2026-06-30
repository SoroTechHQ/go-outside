export type GhanaPostAddress = {
  digitalAddress: string;
  street:         string | null;
  region:         string | null;
  district:       string | null;
  community:      string | null;
  postalArea:     string | null;
  postCode:       string | null;
};

export type GhanaPostLocation = {
  lat:     number;
  lng:     number;
  address: GhanaPostAddress;
};

// Live key takes precedence (set on Vercel production); test key used in dev/preview.
function apiKey(): string | null {
  return process.env.FINDME_API_KEY_LIVE ?? process.env.FINDME_API_KEY ?? null;
}

function normalizeAddress(raw: Record<string, string>): GhanaPostAddress {
  return {
    digitalAddress: raw.digitalAddress,
    street:         raw.street    || null,
    region:         raw.region    || null,
    district:       raw.district  || null,
    community:      raw.community || null,
    postalArea:     raw.postalArea || null,
    postCode:       raw.postCode  || null,
  };
}

// Reverse lookup: lat/lng → GhanaPost digital address
export async function lookupGhanaPostAddress(
  lat: number,
  lng: number,
): Promise<GhanaPostAddress | null> {
  const key = apiKey();
  if (!key) return null;

  try {
    const res = await fetch("https://api.findme.soro.tech/v1/lookup", {
      method:  "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body:    JSON.stringify({ lat, lng }),
      signal:  AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;

    const data = await res.json() as Record<string, string>;
    if (!data?.digitalAddress) return null;
    return normalizeAddress(data);
  } catch {
    return null;
  }
}

// Forward lookup: GhanaPost code → lat/lng + full address
export async function resolveGhanaPostCode(code: string): Promise<GhanaPostLocation | null> {
  const key = apiKey();
  if (!key) return null;

  try {
    const res = await fetch("https://api.findme.soro.tech/v1/resolve", {
      method:  "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body:    JSON.stringify({ code: code.toUpperCase().trim() }),
      signal:  AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;

    const data = await res.json() as { lat: number; lng: number; address: Record<string, string> };
    if (!data?.lat || !data?.lng || !data?.address?.digitalAddress) return null;

    return {
      lat:     data.lat,
      lng:     data.lng,
      address: normalizeAddress(data.address),
    };
  } catch {
    return null;
  }
}
