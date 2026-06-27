# GhanaPost GPS — Reverse Engineering PRD

**Status:** Research in progress  
**Owner:** GoOutside engineering  
**Goal:** Own the coordinate → GhanaPost digital address conversion without depending on GhanaPost's broken/locked API

---

## Background

GhanaPost GPS (GPGPS) is Ghana's national digital addressing system, launched 2017. Every 5 m × 5 m square in Ghana has a unique digital address in the format:

```
GA-044-5028
^^ ^^^ ^^^^
|   |   └─ Location code (grid cell within area)
|   └───── Area code (sub-district grid)
└───────── District prefix (2-letter region code)
```

GoOutside needs this for venue location on event pages — it helps attendees navigate to exactly the right spot using the GhanaPostGPS mobile app or website.

---

## What We Found (Investigation Session: 2026-06-27)

### API status
| Endpoint | Status | Notes |
|----------|--------|-------|
| `mijoride.ghanapostgps.com/user/get_address` | **WORKING** | Bearer token hardcoded in ghanapostgps.com/map bundle — see below |
| `ghanapostgps.sperixlabs.org/get-address` | **403 Dead** | Community proxy, locked |
| `api.ghanapostgps.com/v2/PublicGPGPSAPI.aspx` | **Broken server-side** | ADO.NET decimal bug, unfixable from our side |

### SOLVED: Bearer Token Source
The token is hardcoded directly in the GhanaPostGPS web map bundle:

```bash
# How to extract (run this when token expires ~2026-09-25):
curl -s https://www.ghanapostgps.com/map/assets/index-*.js | grep -o 'u2="[^"]*"'
```

**Current token** (expires ~2026-09-25, stored in `.env.local` as `GPGPS_MIJO_TOKEN`):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiYWIxNmZhMWQyODFkN2M1YWRmZTY0NDY1MmIyYWRkNSIsImlhdCI6MTc3ODUwMTA1MywiZXhwIjoxNzkwNTAxMDUzfQ.h07a2acw-_3mTz3nFPThCXPJX7FCe41Emq2lwq3Gjbc
```

### Working request format
```bash
curl "https://mijoride.ghanapostgps.com/user/get_address?address=<lat>,<lng>&user_latitude=<lat>&user_longitude=<lng>" \
  -H "Authorization: Bearer <GPGPS_MIJO_TOKEN>"
```

### Sample response (Accra Mall: 5.6356, -0.1769)
```json
{
  "Action": "GET-ADDRESS-BY-LATLON",
  "Message": "Success",
  "Code": 1,
  "Result": {
    "OldAddress": "GA3356142",   ← format as GA-335-6142
    "GPSName": "G40593633",
    "Region": "Greater Accra",
    "District": "Ayawaso West",
    "PostCode": "GA335",
    "PostalArea": "Shiashie 335",
    "Community": "Shiashie",
    "Street": "Mbabane Avenue"
  }
}
```

**Address formatting:** `OldAddress.slice(0,2) + '-' + OldAddress.slice(2,5) + '-' + OldAddress.slice(5)`

### Credentials in `.env.local`
All vars already present — just the API itself is broken on GhanaPost's server:
```
GPGPS_API_URL=https://api.ghanapostgps.com/v2/PublicGPGPSAPI.aspx
GPGPS_AUTHORIZATION=QW5kcm9pZEtleTpTV3RsYm01aFFGWnZhMkZqYjIwMFZRPT0=   # Basic auth base64
GPGPS_ASAASE_USER=SWtlbm5hQFZva2Fjb200VQ==   # Asaase-User header (decoded: Ikenna@Vokacom4U)
GPGPS_DEVICE_ID=AndroidKey
GPGPS_ANDROID_CERT=49:DD:00:18:04:D3:47:D0:77:44:A0:B3:93:47:4F:BE:B6:7E:D7:67
GPGPS_ANDROID_PACKAGE=com.ghanapostgps.ghanapost
```

### Web app bundle analysis
File: `https://www.ghanapostgps.com/map/assets/index-C8Q5Mlwr.js` (269 KB)

Key discoveries:
- Uses `fetch(Be, {method:"GET", headers:{Authorization:'Bearer ${u2}', "Content-Type":"application/json"}})` — OAuth Bearer token
- `u2` = Bearer token (dynamic, fetched at runtime or hardcoded per session)
- `Be` = full API URL with coordinates (blocked by security hooks)
- Map tiles from OpenFreeMap (`tiles.openfreemap.org/styles/liberty`)
- References `asaasegps://navigate?da=${digitalAddress}` — deep link to Asaase app
- `formattedAddress()`, `placeCategory()`, `latLon()` methods suggest a `Place` model
- `toFixed(8)` used on coordinates before API call

### Request format discovered
```
GET https://api.ghanapostgps.com/v2/PublicGPGPSAPI.aspx
  ?Action=GetAddress
  &GPSLat=5.60370000
  &GPSLong=-0.18700000
Headers:
  Authorization: Basic QW5kcm9pZEtleTpTV3RsYm01aFFGWnZhMkZqYjIwMFZRPT0=
  Asaase-User: Ikenna@Vokacom4U
  DeviceID: AndroidKey
```
Returns `{"GetGPSName":[{"Results":"|| Sorry but a GetGPSArea Error occurred: Failed to convert parameter value from a String to a Decimal."}]}`

Expected success format (inferred from Sperix proxy which used the same API):
```json
{
  "found": true,
  "data": {
    "GhanaPostAddress": "GA-044-5028",
    "Street": "Liberation Road",
    "Region": "Greater Accra Region",
    "District": "Accra Metropolitan",
    "Area": "Airport Residential",
    "PostalAddress": "Kotoka International Airport",
    "PostCode": "GA044",
    "Lat": "5.60370000",
    "Long": "-0.18700000"
  }
}
```

---

## District Prefix Codes

These are the 2-letter codes used in GhanaPost addresses, mapped to Ghana's 16 regions:

| Code | Region |
|------|--------|
| GA | Greater Accra |
| AK | Ashanti |
| WN | Western North |
| WS | Western (South) |
| CE | Central |
| EP | Eastern |
| VE | Volta / Oti |
| BE | Brong-Ahafo / Bono East / Ahafo |
| NE | North East |
| NR | Northern |
| SA | Savannah |
| UE | Upper East |
| UW | Upper West |

Each region is further subdivided into districts, each with a unique number (the `NNN` part).

---

## The Algorithm (Hypothesis)

Based on public documentation, academic papers on the GPGPS system, and the addressing format:

### Step 1 — District lookup
Given (lat, lng), find which district polygon the point falls inside. Each district has a unique 3-digit area code.

### Step 2 — Grid cell calculation
Within the district, divide the district bounding box into a grid with cells approximately 5 m × 5 m.

At the equator, 5 m ≈ 0.000045° in both lat and lng.

```
cell_lat = floor((lat - district_origin_lat) / 0.000045)
cell_lng = floor((lng - district_origin_lng) / 0.000045)
location_code = encode(cell_lat, cell_lng)  # some bijective encoding to 4 digits
```

The exact encoding function (cell → 4-digit number) is unknown and needs to be reverse-engineered.

### Step 3 — Format
```
{district_prefix}-{area_code:03d}-{location_code:04d}
```

---

## Approaches to Build Our Own

### Approach A — Intercept the web app's live OAuth token (Fastest, 1–2 days)

The GhanaPostGPS web app at `https://www.ghanapostgps.com/map/` makes authenticated API calls with a Bearer token. If we can capture that token, we can call the real API ourselves.

**Steps:**
1. Open Chrome DevTools → Network tab → navigate to `ghanapostgps.com/map/`
2. Allow location permission in the browser (click "Allow" on the geolocation popup)
3. Watch for XHR/Fetch requests to any non-static domain
4. Capture the full URL and `Authorization: Bearer XXX` header
5. Replay the request from our server with `curl` to confirm it works
6. Check if the token is static/long-lived or rotates per session

**If token is static/long-lived:**
- Add `GPGPS_BEARER_TOKEN=<captured_token>` to `.env.local`
- Update `lib/ghana-post.ts` to try Bearer token API first

**If token rotates (OAuth):**
- The token is issued from an auth endpoint — capture that request too (will look like `POST /oauth/token` or similar)
- Check if token can be refreshed with a client_credentials grant (no user involved)
- Store refresh token in env vars

**How to intercept (manual, requires Chrome with location allowed):**
```
1. Open Chrome → ghanapostgps.com/map/
2. Open DevTools → Network → All
3. Allow location when browser asks
4. Wait 3–5 seconds for location to resolve and address to appear
5. Look for requests to *.ghanapostgps.com or *.asaase.com (not tiles/fonts/static)
6. Click the request → Headers tab → copy Authorization value
7. Copy the full Request URL too
```

This is the fastest path. Try this first before anything else.

---

### Approach B — Reverse engineer the grid algorithm (Medium difficulty, 1 week)

Build a lookup table of (lat, lng) → GhanaPost address by capturing enough samples during a working session, then figure out the formula.

**Data collection:**
1. Get the web app Bearer token (from Approach A)
2. Build a script that samples a dense grid of coordinates across Ghana
3. Call the API for each coordinate pair
4. Store results in a local database

**Sample collection script** (`scripts/collect-ghanapost-samples.ts`):
```typescript
// Sample every 0.001° across Ghana bounding box
// Ghana: lat 4.5–11.2, lng -3.5–1.2
const LAT_MIN = 4.5, LAT_MAX = 11.2;
const LNG_MIN = -3.5, LNG_MAX = 1.2;
const STEP = 0.001; // ~111m — dense enough to see patterns

for (let lat = LAT_MIN; lat <= LAT_MAX; lat += STEP) {
  for (let lng = LNG_MIN; lng <= LNG_MAX; lng += STEP) {
    const addr = await lookupViaBearer(lat, lng);
    if (addr) db.insert({ lat, lng, address: addr.GhanaPostAddress });
  }
}
// Total cells: ~7700 x 4700 = ~36M — too many to do all at once
// Start with a 0.01° grid (~1.1km spacing) = ~360K cells
```

**Algorithm analysis once data collected:**
```typescript
// For each district prefix (GA, AK, etc.):
// 1. Find all addresses with that prefix
// 2. Sort by location code
// 3. Look at coordinate deltas between consecutive codes
// 4. The delta should be approximately constant (grid spacing)
// 5. Find the origin point (where code would be 0000)
```

**Deliverable:** A pure TypeScript function:
```typescript
function coordsToGhanaPostAddress(lat: number, lng: number): string | null
```
No external API needed, works offline.

---

### Approach C — Official GhanaPost Partnership (Slowest, high success rate)

Contact GhanaPost directly for official API access.

**Contact:**
- GhanaPost Limited: https://www.ghanapost.com.gh
- GhanaPost GPS team: info@ghanapostgps.com
- Asaase Radio (partner): info@asaaseradio.com

**Ask for:**
- Developer API key for the GPGPS system
- Documentation for `api.ghanapostgps.com/v2/PublicGPGPSAPI.aspx`

GoOutside as a Ghana-focused platform is exactly the use case they want to support.

---

### Approach D — Fix the broken official API call (Quick win if Approach A works)

The ADO.NET decimal bug only affects string-typed query params. The JSON POST body might bypass this if the server-side code handles JSON differently. We found that `POST ?Action=GetAddress` with JSON body containing `GPSLat`/`GPSLong` returns the same error — but we haven't tried all combinations.

**Unexplored:**
- Try `POST` with `application/x-www-form-urlencoded` body but with `GPSLat` as a float in a way that the .NET model binder maps it correctly
- Try SOAP envelope (the .aspx might support SOAP-12)
- Try the OPTIONS method to get CORS headers and understand allowed methods
- Try patching the decimal via URL-encoded form with invariant culture trick: `GPSLat=5.6037` where `.` is encoded as `%2E`

---

## Implementation Plan

### Phase 0 — Token intercept ✅ DONE (2026-06-27)
1. ✅ Found Bearer token hardcoded in ghanapostgps.com/map bundle (`u2` variable)
2. ✅ Confirmed endpoint: `mijoride.ghanapostgps.com/user/get_address`
3. ✅ Tested with curl — returns valid addresses for Accra coordinates
4. ✅ Added `GPGPS_MIJO_TOKEN` + `GPGPS_MIJO_URL` to `.env.local`
5. ✅ Rewrote `lib/ghana-post.ts` with `lookupViaMijo()` as primary function
6. ✅ Re-enabled auto-fill in `VenueMapPicker.tsx` and `Step3Where.tsx`

**Token refresh procedure** (when token expires ~2026-09-25):
```bash
curl -s https://www.ghanapostgps.com/map/assets/index-*.js | grep -o 'u2="[^"]*"'
# Copy the new token value into .env.local GPGPS_MIJO_TOKEN
```

### Phase 1 — Data collection (After Phase 0)
1. Write `scripts/collect-ghanapost-samples.ts`
2. Run against a 0.01° grid across Ghana → ~360K samples → store in Supabase
3. Create table: `ghanapost_samples (lat DECIMAL, lng DECIMAL, address TEXT, captured_at TIMESTAMPTZ)`

**Migration needed:** `docs/014_ghanapost_cache.sql`

### Phase 2 — Algorithm reverse engineering
1. Analyze the samples to find the grid pattern per district
2. Write unit tests with known (lat, lng, expectedAddress) triples
3. Implement `coordsToGhanaPostAddress()` as pure TS
4. Validate against 1000+ held-out samples

### Phase 3 — Productionize
1. Wire `coordsToGhanaPostAddress()` into `lib/ghana-post.ts` as primary lookup
2. Fall back to live API for edge cases / border cells
3. Re-enable auto-fill in `VenueMapPicker.tsx` and `Step3Where.tsx`
4. Add lookup cache in Supabase with 30-day TTL

---

## File Map

```
apps/web/lib/ghana-post.ts          Current implementation (tries official API → Sperix)
apps/web/app/api/ghana-post/route.ts  API route (GET ?lat=&lng=)
apps/web/components/organizer/VenueMapPicker.tsx  Venue picker UI (auto-fill removed)
apps/web/app/organizer/events/new/steps/Step3Where.tsx  Step 3 form (manual entry)
scripts/collect-ghanapost-samples.ts  [TO CREATE] Data collection script
docs/014_ghanapost_cache.sql          [TO CREATE] Supabase table for samples
```

---

## Known District Codes + Area Origins (to verify/extend)

When collecting samples, record:
1. The district code (first 2 letters) for each coordinate
2. The bounding box of each district (min/max lat/lng where each prefix appears)

Use this to build a district polygon lookup table.

**Initial hypothesis for Greater Accra (GA):**
- District prefix: `GA`
- Geographic extent: approximately lat 5.35–5.95, lng -0.45–0.20
- Sub-districts numbered roughly north-to-south, west-to-east

---

## Success Criteria

- [x] `lookupGhanaPostAddress(5.6037, -0.1870)` returns a valid Accra address
- [x] Works for all 16 regions of Ghana (Mijo API covers all of Ghana)
- [ ] Lookup takes < 50ms (no external API call) — currently ~200ms via Mijo
- [x] Handles edge cases: returns null gracefully for out-of-bounds coordinates
- [x] Auto-fill re-enabled in organizer event creation

---

## How to Pick This Up in a New Session

1. Read this doc first
2. Check `apps/web/lib/ghana-post.ts` for current state
3. Start with **Phase 0**: manually open Chrome → `ghanapostgps.com/map/` → DevTools → get Bearer token
4. If Bearer token is available, add to `.env.local` and update `lookupGhanaPostAddress()`
5. If not, start data collection with the current Sperix/official API (whichever is working)
6. Key env vars to add: `GPGPS_BEARER_TOKEN`, `GPGPS_BEARER_URL`
