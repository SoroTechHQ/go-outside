export type GhanaPostAddress = {
  digitalAddress: string;
  street:         string | null;
  region:         string | null;
  district:       string | null;
  community:      string | null;
  postalArea:     string | null;
  postCode:       string | null;
};

type MijoResult = {
  GPSName:     string;
  OldAddress:  string;
  Region:      string;
  District:    string;
  PostCode:    string;
  PostalArea:  string;
  Community:   string;
  Street:      string;
  Area:        string;
};

type MijoResponse = {
  Action:  string;
  Message: string;
  Code:    number;
  Result:  MijoResult | MijoResult[];
};

// OldAddress "GA0593633" → "GA-059-3633"
function formatOldAddress(raw: string): string {
  if (raw.length >= 9) {
    return `${raw.slice(0, 2)}-${raw.slice(2, 5)}-${raw.slice(5)}`;
  }
  return raw;
}

function adaptMijoResult(r: MijoResult): GhanaPostAddress {
  return {
    digitalAddress: formatOldAddress(r.OldAddress ?? r.GPSName),
    street:         r.Street      || null,
    region:         r.Region      || null,
    district:       r.District    || null,
    community:      r.Community   || r.Area || null,
    postalArea:     r.PostalArea  || null,
    postCode:       r.PostCode    || null,
  };
}

// Primary: Mijo API (mijoride.ghanapostgps.com/user/get_address)
// Token is hardcoded in www.ghanapostgps.com/map bundle (u2 variable).
// When token expires (~2026-09-25), fetch the bundle and find the new u2 value:
//   curl -s https://www.ghanapostgps.com/map/assets/index-*.js | grep -o 'u2="[^"]*"'
async function lookupViaMijo(lat: number, lng: number): Promise<GhanaPostAddress | null> {
  const mijoUrl = process.env.GPGPS_MIJO_URL;
  const token   = process.env.GPGPS_MIJO_TOKEN;
  if (!mijoUrl || !token) return null;

  const url = new URL(mijoUrl);
  url.searchParams.set("address", `${lat},${lng}`);
  url.searchParams.set("user_latitude",  String(lat));
  url.searchParams.set("user_longitude", String(lng));

  const res = await fetch(url.toString(), {
    method:  "GET",
    headers: {
      Authorization:  `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) return null;

  const json = (await res.json()) as MijoResponse;
  if (json.Code !== 1 || json.Message !== "Success") return null;

  const result = Array.isArray(json.Result) ? json.Result[0] : json.Result;
  if (!result || !result.OldAddress) return null;

  return adaptMijoResult(result);
}

export async function lookupGhanaPostAddress(
  lat: number,
  lng: number,
): Promise<GhanaPostAddress | null> {
  try {
    return await lookupViaMijo(lat, lng);
  } catch {
    return null;
  }
}
