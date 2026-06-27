export type GhanaPostAddress = {
  digitalAddress: string;
  street:         string | null;
  region:         string | null;
  district:       string | null;
  community:      string | null;
  postalArea:     string | null;
  postCode:       string | null;
};

type OfficialApiResponse = {
  found: boolean;
  data?: {
    GhanaPostAddress: string;
    Street:           string;
    Region:           string;
    District:         string;
    Area:             string;
    PostalAddress:    string;
    PostCode:         string;
    Lat:              string;
    Long:             string;
  };
};

function adaptResponse(data: OfficialApiResponse["data"]): GhanaPostAddress {
  return {
    digitalAddress: data!.GhanaPostAddress,
    street:         data!.Street        || null,
    region:         data!.Region        || null,
    district:       data!.District      || null,
    community:      data!.Area          || null,
    postalArea:     data!.PostalAddress || null,
    postCode:       data!.PostCode      || null,
  };
}

async function lookupViaOfficialApi(lat: number, lng: number): Promise<GhanaPostAddress | null> {
  const apiUrl      = process.env.GPGPS_API_URL;
  const auth        = process.env.GPGPS_AUTHORIZATION;
  const asaaseUser  = process.env.GPGPS_ASAASE_USER;
  const language    = process.env.GPGPS_LANGUAGE_CODE ?? "en";
  const country     = process.env.GPGPS_COUNTRY       ?? "GH";

  if (!apiUrl || !auth) return null;

  const url = new URL(apiUrl);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("long", String(lng));
  url.searchParams.set("language", language);
  url.searchParams.set("country", country);

  // The env var is the raw base64 payload; the API expects HTTP Basic auth
  const headers: Record<string, string> = {
    Authorization: auth.startsWith("Basic ") ? auth : `Basic ${auth}`,
  };
  if (asaaseUser) headers["Asaase-User"] = asaaseUser;

  const res = await fetch(url.toString(), {
    method: "GET",
    headers,
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) return null;

  const json = (await res.json()) as OfficialApiResponse;
  if (!json.found || !json.data) return null;
  return adaptResponse(json.data);
}

async function lookupViaSperix(lat: number, lng: number): Promise<GhanaPostAddress | null> {
  const sperixUrl = process.env.GPGPS_SPERIX_URL ?? "https://ghanapostgps.sperixlabs.org/get-address";

  const res = await fetch(sperixUrl, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ lat, long: lng }),
    signal:  AbortSignal.timeout(6000),
  });

  if (!res.ok) return null;

  const json = (await res.json()) as OfficialApiResponse;
  if (!json.found || !json.data) return null;
  return adaptResponse(json.data);
}

export async function lookupGhanaPostAddress(
  lat: number,
  lng: number,
): Promise<GhanaPostAddress | null> {
  try {
    // Prefer the official GhanaPost API (credentials from .env)
    const official = await lookupViaOfficialApi(lat, lng);
    if (official) return official;
  } catch {
    // fall through to Sperix
  }

  try {
    return await lookupViaSperix(lat, lng);
  } catch {
    return null;
  }
}
