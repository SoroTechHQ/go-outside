export type GhanaPostAddress = {
  digitalAddress: string;
  street:         string | null;
  region:         string | null;
  district:       string | null;
  community:      string | null;
  postalArea:     string | null;
  postCode:       string | null;
};

type SperixResponse = {
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

export async function lookupGhanaPostAddress(
  lat: number,
  lng: number,
): Promise<GhanaPostAddress | null> {
  const sperixUrl = process.env.GPGPS_SPERIX_URL ?? "https://ghanapostgps.sperixlabs.org/get-address";

  try {
    const res = await fetch(sperixUrl, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ lat, long: lng }),
      signal:  AbortSignal.timeout(6000),
    });

    if (!res.ok) return null;

    const json = (await res.json()) as SperixResponse;
    if (!json.found || !json.data) return null;

    const d = json.data;
    return {
      digitalAddress: d.GhanaPostAddress,
      street:         d.Street        || null,
      region:         d.Region        || null,
      district:       d.District      || null,
      community:      d.Area          || null,
      postalArea:     d.PostalAddress || null,
      postCode:       d.PostCode      || null,
    };
  } catch {
    return null;
  }
}
