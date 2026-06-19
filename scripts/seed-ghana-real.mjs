#!/usr/bin/env node
/**
 * GoOutside — Ghana Real-Data Seed Script
 * ─────────────────────────────────────────────────────────────────────────────
 * All seed records use UUIDs prefixed with `dd000` — this is the single source
 * of truth for both insertion and teardown. No external packages required.
 *
 * Usage:
 *   node scripts/seed-ghana-real.mjs --seed          # write to DB
 *   node scripts/seed-ghana-real.mjs --teardown      # remove all seed data
 *   node scripts/seed-ghana-real.mjs --seed --dry-run
 *   node scripts/seed-ghana-real.mjs --status        # count seeded rows
 *
 * npm shortcut (add to root package.json):
 *   "seed:ghana":    "node scripts/seed-ghana-real.mjs --seed"
 *   "seed:teardown": "node scripts/seed-ghana-real.mjs --teardown"
 */

// ── Config ────────────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://szobygsvdlzypuspcafu.supabase.co";
const SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6b2J5Z3N2ZGx6eXB1c3BjYWZ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTkxMDA1MiwiZXhwIjoyMDkxNDg2MDUyfQ.PXmB3-lT7t0FK9DUm3lAG543QpDo5E75R0Ng1OGvirc";

const SEED_PREFIX = "dd000"; // all seed IDs start with this — teardown uses LIKE 'dd000%'

const MODE = process.argv.includes("--teardown")
  ? "teardown"
  : process.argv.includes("--status")
    ? "status"
    : "seed";
const DRY = process.argv.includes("--dry-run");

// ── ID helpers ────────────────────────────────────────────────────────────────
// Format: dd000TT0-0000-0000-0000-NNNNNNNNNNNN
// TT = entity type: 01=users, 02=venues, 04=events, 05=ticket_types
function sid(type, n) {
  return `dd000${type}0-0000-0000-0000-${String(n).padStart(12, "0")}`;
}
const U = (n) => sid("01", n); // user
const V = (n) => sid("02", n); // venue
const E = (n) => sid("04", n); // event
const T = (n) => sid("05", n); // ticket_type

// ── HTTP helpers ──────────────────────────────────────────────────────────────
const H = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=minimal",
};

async function rpc_rest(method, table, body, extra = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method,
    headers: { ...H, ...extra },
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const txt = await res.text();
  let data;
  try { data = JSON.parse(txt); } catch { data = txt; }
  return { ok: res.ok, status: res.status, data };
}

async function db_upsert(table, rows) {
  if (DRY) { console.log(`  [DRY] upsert ${table} (${rows.length} rows)`); return { ok: true }; }
  return rpc_rest("POST", table, rows, { Prefer: "resolution=merge-duplicates,return=minimal" });
}

async function db_select(table, qs) {
  return rpc_rest("GET", `${table}?${qs}`, null);
}

async function db_delete(table, filter) {
  if (DRY) { console.log(`  [DRY] delete ${table} WHERE ${filter}`); return { ok: true }; }
  return rpc_rest("DELETE", `${table}?${filter}`, null);
}

function ok(msg)   { console.log(`  ✓ ${msg}`); }
function warn(msg) { console.log(`  ⚠ ${msg}`); }
function err(msg)  { console.log(`  ✗ ${msg}`); }
function step(msg) { console.log(`\n── ${msg}`); }

// ── DATA ──────────────────────────────────────────────────────────────────────

// Avatar pool — Nappy/@nappystudio + diverse Unsplash portraits
const AVATARS_M = [
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1530268729831-4b0b9e170218?w=200&h=200&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=200&h=200&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1499996860823-5214fcc65f8f?w=200&h=200&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop&auto=format",
];
const AVATARS_F = [
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1531123414780-f74242c2b052?w=200&h=200&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=200&h=200&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1597586124394-fbd6ef244026?w=200&h=200&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1620842736139-50d9e2e7d22e?w=200&h=200&fit=crop&auto=format",
];
let am = 0, af = 0;
const nextM = () => AVATARS_M[am++ % AVATARS_M.length];
const nextF = () => AVATARS_F[af++ % AVATARS_F.length];

// ── 1. ORGANIZER USERS (IDs 001–010) ─────────────────────────────────────────
const ORGANIZER_USERS = [
  { id: U(1),  g:"m", first:"Kofi",    last:"Asante",   city:"Osu, Accra",         interests:["music","community","arts"],       pulse:820,  tier:"regular",  username:"kofi.accravibes",   bio:"Curating the best of Accra's music and culture since 2019." },
  { id: U(2),  g:"m", first:"Kwame",   last:"Darko",    city:"East Legon, Accra",  interests:["music","arts","community"],       pulse:940,  tier:"regular",  username:"kwame.culture",     bio:"Producer of Ghana's biggest music festivals. Making history one event at a time." },
  { id: U(3),  g:"m", first:"Ebo",     last:"Mensah",   city:"Airport Residential, Accra", interests:["tech","networking","education"], pulse:710,  tier:"regular",  username:"ebo.gctech",        bio:"Building Ghana's tech ecosystem through world-class events." },
  { id: U(4),  g:"f", first:"Abena",   last:"Owusu",    city:"Labone, Accra",      interests:["arts","community","education"],   pulse:650,  tier:"regular",  username:"abena.akoma",       bio:"Celebrating West African art, craft, and creativity." },
  { id: U(5),  g:"m", first:"Kojo",    last:"Boateng",  city:"Jamestown, Accra",   interests:["arts","music","community"],       pulse:780,  tier:"regular",  username:"kojo.chalewote",    bio:"The team behind Accra's most iconic street art festival." },
  { id: U(6),  g:"m", first:"Yaw",     last:"Amoah",    city:"Osu, Accra",         interests:["music","arts","community"],       pulse:880,  tier:"regular",  username:"yaw.rockstone",     bio:"Hip-hop, highlife, and everything in between. Ghana to the world." },
  { id: U(7),  g:"f", first:"Akosua",  last:"Quaye",    city:"Airport Residential, Accra", interests:["tech","education","networking"], pulse:590,  tier:"regular",  username:"akosua.ispace",     bio:"Ghana's home for tech innovation and startup culture." },
  { id: U(8),  g:"m", first:"Nana",    last:"Appiah",   city:"East Legon, Accra",  interests:["music","food-drink","community"], pulse:760,  tier:"regular",  username:"nana.kotoka",       bio:"From rooftop sessions to amphitheatre nights — Accra's nightlife authority." },
  { id: U(9),  g:"m", first:"Kwabena", last:"Osei",     city:"Kumasi",             interests:["arts","community","music"],       pulse:620,  tier:"regular",  username:"kwabena.kumasiarts","bio":"Connecting Kumasi's creative community through culture and craft." },
  { id: U(10), g:"f", first:"Ama",     last:"Frimpong", city:"Takoradi",           interests:["community","food-drink","arts"],  pulse:540,  tier:"regular",  username:"ama.takoradievents","bio":"Bringing world-class events to Ghana's oil city." },
];

const ORG_PROFILES = [
  { user_id:U(1),  name:"Accra Vibes Collective",      bio:"Ghana's premier event curation collective — rooftop bars, beach parties, jazz nights.", website:"https://accravibes.co",           instagram:"accravibes",      category:["music","community"] },
  { user_id:U(2),  name:"Culture Management Group",    bio:"Producers of AfroFuture Ghana and West Africa's biggest music festivals.",               website:"https://afrofuturefestival.com",  instagram:"afrofuturefest",  category:["music","arts"] },
  { user_id:U(3),  name:"Gold Coast Tech Hub",         bio:"Building Ghana's tech ecosystem through world-class conferences, hackathons, and demos.", website:"https://goldcoasttechhub.com",   instagram:"goldcoasttech",   category:["tech","education"] },
  { user_id:U(4),  name:"Akoma Arts Foundation",       bio:"Celebrating West African art, craft, and creativity through exhibitions and workshops.",  website:"https://akomaarts.org",          instagram:"akomaarts",       category:["arts","community"] },
  { user_id:U(5),  name:"Chale Wote Festival Crew",    bio:"The team behind Accra's most iconic free street art and music festival in James Town.",  website:"https://accradotalt.com",        instagram:"accradotalt",     category:["arts","community"] },
  { user_id:U(6),  name:"Rockstone Entertainment",     bio:"Hip-hop, highlife, and everything in between. Ghana to the world since 2001.",           website:"https://rockstonegh.com",        instagram:"reggierockstone", category:["music","arts"] },
  { user_id:U(7),  name:"iSpace Foundation Ghana",     bio:"Ghana's leading tech innovation hub powering startups, hackathons, and growth events.",   website:"https://ispacegh.com",           instagram:"ispacegh",        category:["tech","education"] },
  { user_id:U(8),  name:"Kotoka Entertainment",        bio:"From rooftop sessions to open-air concerts — Accra's nightlife authority.",               website:"https://kotokaentertainment.com",instagram:"kotokaent",       category:["music","community"] },
  { user_id:U(9),  name:"Kumasi Arts Collective",      bio:"Connecting Kumasi's creative community through Kente, craft, and contemporary art.",      website:"https://kumasiarts.gh",          instagram:"kumasiarts",      category:["arts","community"] },
  { user_id:U(10), name:"Takoradi Events Hub",         bio:"Bringing world-class events to Ghana's oil city. From concerts to trade expos.",          website:"https://takoradievents.com",     instagram:"takoradievents",  category:["community","music"] },
];

// ── 2. ATTENDEE USERS (IDs 011–050) ──────────────────────────────────────────
const ATTENDEE_USERS = [
  { id:U(11), g:"m", first:"Emmanuel", last:"Mensah",    city:"Osu, Accra",          interests:["music","food-drink","community"], pulse:340, tier:"regular" },
  { id:U(12), g:"f", first:"Gifty",    last:"Darko",     city:"East Legon, Accra",   interests:["arts","community","education"],   pulse:210, tier:"explorer" },
  { id:U(13), g:"m", first:"Isaac",    last:"Boateng",   city:"Cantonments, Accra",  interests:["tech","networking","sports"],     pulse:155, tier:"explorer" },
  { id:U(14), g:"f", first:"Adwoa",    last:"Nkrumah",   city:"Labone, Accra",       interests:["food-drink","arts","community"],  pulse:390, tier:"regular" },
  { id:U(15), g:"m", first:"Kweku",    last:"Adjei",     city:"Spintex, Accra",      interests:["music","tech","networking"],      pulse:480, tier:"regular" },
  { id:U(16), g:"f", first:"Efua",     last:"Quaye",     city:"Madina, Accra",       interests:["education","arts","community"],   pulse:175, tier:"explorer" },
  { id:U(17), g:"m", first:"Daniel",   last:"Frimpong",  city:"Achimota, Accra",     interests:["sports","music","community"],     pulse:88,  tier:"newcomer" },
  { id:U(18), g:"f", first:"Priscilla",last:"Laryea",    city:"Dansoman, Accra",     interests:["food-drink","community","arts"],  pulse:265, tier:"explorer" },
  { id:U(19), g:"m", first:"Fiifi",    last:"Ampofo",    city:"Osu, Accra",          interests:["music","arts","food-drink"],      pulse:510, tier:"regular" },
  { id:U(20), g:"f", first:"Akua",     last:"Aidoo",     city:"Airport Residential, Accra",interests:["tech","education","networking"],pulse:320, tier:"regular" },
  { id:U(21), g:"m", first:"Bright",   last:"Ansah",     city:"Tema, Accra",         interests:["sports","community","music"],     pulse:145, tier:"explorer" },
  { id:U(22), g:"f", first:"Abena",    last:"Sarpong",   city:"Legon, Accra",        interests:["education","arts","community"],   pulse:295, tier:"explorer" },
  { id:U(23), g:"m", first:"Kwame",    last:"Bonsu",     city:"Kumasi",              interests:["music","food-drink","arts"],      pulse:420, tier:"regular" },
  { id:U(24), g:"f", first:"Yaa",      last:"Acheampong",city:"Kumasi",              interests:["arts","community","education"],   pulse:190, tier:"explorer" },
  { id:U(25), g:"m", first:"Koby",     last:"Tetteh",    city:"Osu, Accra",          interests:["music","networking","tech"],      pulse:395, tier:"regular" },
  { id:U(26), g:"f", first:"Naa",      last:"Lartey",    city:"Cantonments, Accra",  interests:["food-drink","arts","community"],  pulse:230, tier:"explorer" },
  { id:U(27), g:"m", first:"Richmond", last:"Adusei",    city:"East Legon, Accra",   interests:["tech","sports","networking"],     pulse:165, tier:"explorer" },
  { id:U(28), g:"f", first:"Maame",    last:"Agyei",     city:"Spintex, Accra",      interests:["community","education","arts"],   pulse:75,  tier:"newcomer" },
  { id:U(29), g:"m", first:"Ato",      last:"Kyei",      city:"Labone, Accra",       interests:["music","arts","food-drink"],      pulse:560, tier:"regular" },
  { id:U(30), g:"f", first:"Comfort",  last:"Gyimah",    city:"Achimota, Accra",     interests:["arts","education","community"],   pulse:305, tier:"regular" },
  { id:U(31), g:"m", first:"Samuel",   last:"Donkor",    city:"Tamale",              interests:["sports","community","music"],     pulse:130, tier:"explorer" },
  { id:U(32), g:"f", first:"Akosua",   last:"Antwi",     city:"Cape Coast",          interests:["arts","food-drink","community"],  pulse:220, tier:"explorer" },
  { id:U(33), g:"m", first:"Michael",  last:"Asamoah",   city:"Osu, Accra",          interests:["music","networking","food-drink"],pulse:445, tier:"regular" },
  { id:U(34), g:"f", first:"Adjoa",    last:"Poku",      city:"Madina, Accra",       interests:["community","arts","education"],   pulse:185, tier:"explorer" },
  { id:U(35), g:"m", first:"Kofi",     last:"Antwi",     city:"Kumasi",              interests:["tech","education","networking"],  pulse:270, tier:"explorer" },
  { id:U(36), g:"f", first:"Ewurama",  last:"Bediako",   city:"Dansoman, Accra",     interests:["music","arts","community"],       pulse:350, tier:"regular" },
  { id:U(37), g:"m", first:"Prince",   last:"Asante",    city:"East Legon, Accra",   interests:["sports","music","tech"],          pulse:410, tier:"regular" },
  { id:U(38), g:"f", first:"Abigail",  last:"Ofori",     city:"Takoradi",            interests:["food-drink","community","arts"],  pulse:140, tier:"explorer" },
  { id:U(39), g:"m", first:"Desmond",  last:"Amankwah",  city:"Accra",               interests:["music","food-drink","community"], pulse:95,  tier:"newcomer" },
  { id:U(40), g:"f", first:"Abenaa",   last:"Teye",      city:"Tema, Accra",         interests:["education","tech","community"],   pulse:285, tier:"explorer" },
  { id:U(41), g:"m", first:"Kwabena",  last:"Nsiah",     city:"Legon, Accra",        interests:["tech","networking","education"],  pulse:370, tier:"regular" },
  { id:U(42), g:"f", first:"Serwaa",   last:"Ackah",     city:"Osu, Accra",          interests:["arts","music","food-drink"],      pulse:490, tier:"regular" },
  { id:U(43), g:"m", first:"Joseph",   last:"Twumasi",   city:"Kumasi",              interests:["sports","community","music"],     pulse:200, tier:"explorer" },
  { id:U(44), g:"f", first:"Akweley",  last:"Nartey",    city:"Cantonments, Accra",  interests:["community","arts","education"],   pulse:160, tier:"explorer" },
  { id:U(45), g:"m", first:"Yaw",      last:"Osei",      city:"Airport Residential, Accra",interests:["music","networking","arts"],  pulse:530, tier:"regular" },
  { id:U(46), g:"f", first:"Jennifer", last:"Darko",     city:"East Legon, Accra",   interests:["food-drink","arts","community"],  pulse:245, tier:"explorer" },
  { id:U(47), g:"m", first:"Kelvin",   last:"Lamptey",   city:"Jamestown, Accra",    interests:["arts","music","community"],       pulse:115, tier:"explorer" },
  { id:U(48), g:"f", first:"Vida",     last:"Addo",      city:"Kumasi",              interests:["education","community","arts"],   pulse:330, tier:"regular" },
  { id:U(49), g:"m", first:"Ebo",      last:"Acquah",    city:"Takoradi",            interests:["sports","food-drink","community"],pulse:175, tier:"explorer" },
  { id:U(50), g:"f", first:"Nana Akua",last:"Amponsah",  city:"Accra",               interests:["music","arts","networking"],      pulse:405, tier:"regular" },
];

// ── 3. VENUES (IDs 001–015) ───────────────────────────────────────────────────
const VENUES = [
  { id:V(1),  name:"+233 Jazz Bar & Grill",              address:"Airport Road, Adjacent Stanbic HQ",   city:"Accra",    lat:5.5929,  lng:-0.1811, cap:350,   maps:"https://maps.google.com/?q=%2B233+Jazz+Bar+Accra" },
  { id:V(2),  name:"Skybar25",                           address:"Green Alta Building, Tetteh Quarshie", city:"Accra",    lat:5.6100,  lng:-0.1730, cap:400,   maps:"https://maps.google.com/?q=Skybar25+Accra" },
  { id:V(3),  name:"Labadi Beach Hotel",                 address:"La Beach Road, Labadi",                city:"Accra",    lat:5.5594,  lng:-0.1528, cap:2000,  maps:"https://maps.google.com/?q=Labadi+Beach+Hotel+Accra" },
  { id:V(4),  name:"National Theatre of Ghana",          address:"Liberation Road, West Ridge",          city:"Accra",    lat:5.5466,  lng:-0.2054, cap:1500,  maps:"https://maps.google.com/?q=National+Theatre+Ghana" },
  { id:V(5),  name:"El-Wak Stadium",                     address:"Liberation Road, Airport Area",        city:"Accra",    lat:5.6017,  lng:-0.1769, cap:10000, maps:"https://maps.google.com/?q=El-Wak+Stadium+Accra" },
  { id:V(6),  name:"Accra International Conference Centre", address:"Castle Road, Central Accra",        city:"Accra",    lat:5.5494,  lng:-0.2074, cap:3000,  maps:"https://maps.google.com/?q=AICC+Accra" },
  { id:V(7),  name:"Kokrobite Beach",                    address:"Kokrobite, Greater Accra",             city:"Accra",    lat:5.5000,  lng:-0.3667, cap:5000,  maps:"https://maps.google.com/?q=Kokrobite+Beach+Ghana" },
  { id:V(8),  name:"Bukom Jazz Bar",                     address:"Bukom Square, James Town",             city:"Accra",    lat:5.5350,  lng:-0.2100, cap:200,   maps:"https://maps.google.com/?q=Bukom+Jazz+Bar+Accra" },
  { id:V(9),  name:"iSpace Foundation",                  address:"14 Mango Tree Avenue, Airport Residential", city:"Accra", lat:5.6017, lng:-0.1900, cap:150, maps:"https://maps.google.com/?q=iSpace+Foundation+Accra" },
  { id:V(10), name:"University of Ghana Great Hall",     address:"Legon Campus, Accra",                  city:"Accra",    lat:5.6500,  lng:-0.1830, cap:800,   maps:"https://maps.google.com/?q=University+of+Ghana+Great+Hall" },
  { id:V(11), name:"Alliance Française d'Accra",         address:"Liberation Road, Cantonment",          city:"Accra",    lat:5.5571,  lng:-0.2027, cap:500,   maps:"https://maps.google.com/?q=Alliance+Francaise+Accra" },
  { id:V(12), name:"Movenpick Ambassador Hotel",         address:"Independence Avenue, Accra",           city:"Accra",    lat:5.5695,  lng:-0.2088, cap:800,   maps:"https://maps.google.com/?q=Movenpick+Ambassador+Accra" },
  { id:V(13), name:"KNUST Amphitheatre",                 address:"KNUST Campus, Kumasi",                 city:"Kumasi",   lat:6.6741,  lng:-1.5714, cap:3500,  maps:"https://maps.google.com/?q=KNUST+Kumasi" },
  { id:V(14), name:"Cape Coast Castle Grounds",          address:"Victoria Road, Cape Coast",            city:"Cape Coast",lat:5.1031, lng:-1.2451, cap:500,   maps:"https://maps.google.com/?q=Cape+Coast+Castle+Ghana" },
  { id:V(15), name:"Aliu Mahama Sports Stadium",         address:"Stadium Road, Tamale",                 city:"Tamale",   lat:9.4008,  lng:-0.8393, cap:5000,  maps:"https://maps.google.com/?q=Aliu+Mahama+Stadium+Tamale" },
];

// ── 4. EVENT IMAGES (stable Unsplash CDN URLs) ────────────────────────────────
const IMG = {
  music:      "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&h=630&fit=crop&auto=format&q=85",
  music2:     "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&h=630&fit=crop&auto=format&q=85",
  music3:     "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1200&h=630&fit=crop&auto=format&q=85",
  music4:     "https://images.unsplash.com/photo-1501612780327-45045538702b?w=1200&h=630&fit=crop&auto=format&q=85",
  tech:       "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=630&fit=crop&auto=format&q=85",
  tech2:      "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=1200&h=630&fit=crop&auto=format&q=85",
  food:       "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=630&fit=crop&auto=format&q=85",
  food2:      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=630&fit=crop&auto=format&q=85",
  arts:       "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=630&fit=crop&auto=format&q=85",
  arts2:      "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=1200&h=630&fit=crop&auto=format&q=85",
  community:  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&h=630&fit=crop&auto=format&q=85",
  community2: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=1200&h=630&fit=crop&auto=format&q=85",
  sports:     "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200&h=630&fit=crop&auto=format&q=85",
  networking: "https://images.unsplash.com/photo-1559223607-a43c990c692c?w=1200&h=630&fit=crop&auto=format&q=85",
  education:  "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&h=630&fit=crop&auto=format&q=85",
  beach:      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=630&fit=crop&auto=format&q=85",
};

// ── 5. EVENTS (IDs 001–020) ───────────────────────────────────────────────────
// All events are grounded in real Ghana venues with realistic dates, pricing in GHS.
const EVENTS = [
  {
    id: E(1), org: U(2), venue: V(5), cat: "music",
    title: "AfroFuture Ghana 2026",
    slug: "afrofuture-ghana-2026",
    desc: "The biggest Afrobeats festival on the continent returns to El-Wak Stadium. Three nights of Ghana's biggest acts alongside international headliners — Burna Boy, Stonebwoy, Black Sherif, and more TBA. Day parties, after-parties, and the legendary festival village.",
    short: "Ghana's biggest Afrobeats festival. 3 nights, 50,000+ fans, Africa's biggest acts.",
    start: "2026-12-26T18:00:00+00:00", end: "2026-12-29T04:00:00+00:00",
    cap: 15000, featured: true, landmark: true, sponsored: true,
    banner: IMG.music, gallery: [IMG.music2, IMG.music3],
    tags: ["afrobeats","festival","accra","music","ghana","december"],
    tickets: [
      { id:T(1),  name:"General Admission",  price:350,  type:"paid", qty:8000 },
      { id:T(2),  name:"VIP Wristband",       price:850,  type:"paid", qty:3000 },
      { id:T(3),  name:"VVIP Experience",     price:2000, type:"paid", qty:500  },
      { id:T(4),  name:"3-Day Weekend Pass",  price:950,  type:"paid", qty:1500 },
    ],
  },
  {
    id: E(2), org: U(3), venue: V(6), cat: "tech",
    title: "Ghana Tech Summit 2026",
    slug: "ghana-tech-summit-2026",
    desc: "Ghana's premier technology conference brings together 2,500+ founders, engineers, investors, and builders for two days of insight-dense talks and curated networking. Theme: 'Building Africa At Scale'. Speakers from Google Africa, Flutterwave, Paystack, mPharma, and Andela.",
    short: "Ghana's biggest tech conference. 2,500+ builders, 50+ speakers, 2 days of impact.",
    start: "2026-07-09T08:00:00+00:00", end: "2026-07-10T18:00:00+00:00",
    cap: 2500, featured: true, landmark: false, sponsored: true,
    banner: IMG.tech, gallery: [IMG.tech2, IMG.networking],
    tags: ["tech","startup","conference","innovation","ghana","africa"],
    tickets: [
      { id:T(5),  name:"Attendee Pass",       price:200,  type:"paid", qty:1800 },
      { id:T(6),  name:"Builder Pass (Early)", price:80,  type:"paid", qty:400  },
      { id:T(7),  name:"Speaker / VIP",        price:0,   type:"free", qty:100  },
      { id:T(8),  name:"Investor Table",       price:1200, type:"paid", qty:50  },
    ],
  },
  {
    id: E(3), org: U(5), venue: V(8), cat: "arts",
    title: "Chale Wote Street Art Festival",
    slug: "chale-wote-street-art-2026",
    desc: "The 14th edition of Accra's iconic free street art, music, and performance festival transforms the historic James Town waterfront. Expect murals, live painting, spoken word, afrobeat street performances, pop-up markets, and the celebrated Midnight Zombie Run.",
    short: "Accra's iconic free street art festival in historic James Town. 3 days of pure culture.",
    start: "2026-08-21T10:00:00+00:00", end: "2026-08-23T23:00:00+00:00",
    cap: 10000, featured: true, landmark: true, sponsored: false,
    banner: IMG.arts, gallery: [IMG.arts2, IMG.community],
    tags: ["art","culture","street-art","free","jamestown","accra"],
    tickets: [
      { id:T(9),  name:"Free Entry",              price:0,  type:"free", qty:8000 },
      { id:T(10), name:"Artist Supporter Badge",  price:50, type:"paid", qty:1500 },
      { id:T(11), name:"Midnight Zombie Run Pass",price:80, type:"paid", qty:500  },
    ],
  },
  {
    id: E(4), org: U(9), venue: V(13), cat: "arts",
    title: "Kumasi Craft & Kente Expo 2026",
    slug: "kumasi-craft-kente-expo-2026",
    desc: "A showcase of Ashanti craft mastery and contemporary Ghanaian design. 200+ artisans from across the Ashanti, Brong-Ahafo, and Northern regions exhibit kente, adinkra, woodcarving, beadwork, and pottery. Live demonstrations, workshops, and a curated fine arts gallery.",
    short: "200+ Ghanaian artisans. Live kente weaving, woodcarving, and fine art. Free entry.",
    start: "2026-07-18T09:00:00+00:00", end: "2026-07-19T17:00:00+00:00",
    cap: 3000, featured: false, landmark: false, sponsored: false,
    banner: IMG.arts2, gallery: [IMG.arts, IMG.community2],
    tags: ["craft","kente","kumasi","art","expo","ashanti"],
    tickets: [
      { id:T(12), name:"Day Entry (Free)",          price:0,   type:"free", qty:2000 },
      { id:T(13), name:"Workshop Bundle (2 sessions)",price:60, type:"paid", qty:600 },
      { id:T(14), name:"Collector Preview (Fri PM)", price:150, type:"paid", qty:200 },
    ],
  },
  {
    id: E(5), org: U(1), venue: V(1), cat: "music",
    title: "Jazz Night at +233 — July Edition",
    slug: "jazz-night-233-july-2026",
    desc: "Accra's finest monthly jazz gathering at Ghana's most celebrated live music bar. Resident trio opens the night, followed by a featured ensemble from Kumasi and a surprise guest set. Candle-lit tables, curated cocktails, and the warm +233 atmosphere.",
    short: "Accra's best monthly jazz evening. Intimate, candlelit, always worth it.",
    start: "2026-07-11T19:30:00+00:00", end: "2026-07-11T23:30:00+00:00",
    cap: 200, featured: false, landmark: false, sponsored: false,
    banner: IMG.music3, gallery: [IMG.music4, IMG.community],
    tags: ["jazz","live-music","accra","intimate","233bar","monthly"],
    tickets: [
      { id:T(15), name:"Standard Table (2 seats)", price:120, type:"paid", qty:120 },
      { id:T(16), name:"Premium Reserved",          price:200, type:"paid", qty:60  },
    ],
  },
  {
    id: E(6), org: U(1), venue: V(3), cat: "food-drink",
    title: "Ghana Food & Drink Festival 2026",
    slug: "ghana-food-drink-festival-2026",
    desc: "A 2-day culinary celebration at Labadi Beach Hotel showcasing the best of Ghanaian cuisine alongside international flavours. 50+ restaurant pop-ups, master chef demonstrations, cocktail masterclasses, a kids' cooking zone, and the much-anticipated Best Jollof Cook-Off with GHS 10,000 prize.",
    short: "Ghana's biggest food festival. 50+ pop-ups, the Jollof Cook-Off, and cocktail masterclasses.",
    start: "2026-09-05T11:00:00+00:00", end: "2026-09-06T21:00:00+00:00",
    cap: 4000, featured: true, landmark: false, sponsored: true,
    banner: IMG.food, gallery: [IMG.food2, IMG.community],
    tags: ["food","drink","festival","jollof","culinary","accra","labadi"],
    tickets: [
      { id:T(17), name:"Day Entry",         price:80,  type:"paid", qty:2500 },
      { id:T(18), name:"Weekend Pass",      price:140, type:"paid", qty:1000 },
      { id:T(19), name:"Masterclass Add-on",price:60,  type:"paid", qty:300  },
      { id:T(20), name:"VIP Lounge Pass",   price:350, type:"paid", qty:200  },
    ],
  },
  {
    id: E(7), org: U(8), venue: V(2), cat: "music",
    title: "Skybar25 Sunset Sessions",
    slug: "skybar25-sunset-sessions-aug-2026",
    desc: "Accra's most panoramic rooftop venue hosts its signature monthly sunset party. DJ sets from Ghana's hottest selectors, afrobeats, amapiano, highlife, and R&B — with the city skyline as your backdrop. Dress code: Smart Casual.",
    short: "Accra's best rooftop party. Skybar25, sunset views, and Ghana's hottest DJs.",
    start: "2026-08-01T17:00:00+00:00", end: "2026-08-02T02:00:00+00:00",
    cap: 400, featured: false, landmark: false, sponsored: false,
    banner: IMG.music4, gallery: [IMG.music, IMG.community2],
    tags: ["rooftop","party","accra","skybar","sunset","dj","afrobeats"],
    tickets: [
      { id:T(21), name:"Early Bird",       price:80,  type:"paid", qty:200 },
      { id:T(22), name:"Regular Entry",    price:120, type:"paid", qty:150 },
      { id:T(23), name:"VIP Table (4 pax)",price:600, type:"paid", qty:50  },
    ],
  },
  {
    id: E(8), org: U(7), venue: V(9), cat: "tech",
    title: "iSpace Hackathon Accra — Fintech Edition",
    slug: "ispace-hackathon-accra-fintech-2026",
    desc: "48-hour hackathon at iSpace Foundation focused on financial inclusion and fintech innovation for Ghana and West Africa. Teams of 2–5 compete for GHS 15,000 in prizes. Mentors from Zeepay, ExpressPay, and Chipper Cash on site. Open to developers, designers, and product managers.",
    short: "48-hour fintech hackathon. GHS 15,000 in prizes. Ghana's best builders welcome.",
    start: "2026-07-25T08:00:00+00:00", end: "2026-07-27T12:00:00+00:00",
    cap: 150, featured: false, landmark: false, sponsored: false,
    banner: IMG.tech2, gallery: [IMG.tech, IMG.networking],
    tags: ["hackathon","fintech","tech","accra","ispace","coding","startup"],
    tickets: [
      { id:T(24), name:"Team Registration (per team)", price:0, type:"free", qty:30 },
      { id:T(25), name:"Individual Hacker",            price:0, type:"free", qty:90 },
    ],
  },
  {
    id: E(9), org: U(6), venue: V(4), cat: "music",
    title: "Highlife Legends Night",
    slug: "highlife-legends-night-2026",
    desc: "A tribute concert celebrating the golden era of Ghanaian highlife at the National Theatre. Featuring live performances from veteran artists and the next generation keeping the tradition alive. Full band orchestration, special archival audio-visual segment, and a highlife dance floor.",
    short: "A live tribute to Ghana's greatest music tradition. Full band, legends, National Theatre.",
    start: "2026-09-19T18:00:00+00:00", end: "2026-09-19T23:00:00+00:00",
    cap: 1200, featured: true, landmark: false, sponsored: false,
    banner: IMG.music2, gallery: [IMG.music3, IMG.arts],
    tags: ["highlife","ghana","live-music","national-theatre","legends","culture"],
    tickets: [
      { id:T(26), name:"Stalls",              price:150, type:"paid", qty:800 },
      { id:T(27), name:"Circle Seats",        price:250, type:"paid", qty:300 },
      { id:T(28), name:"Golden Circle (VIP)", price:500, type:"paid", qty:100 },
    ],
  },
  {
    id: E(10), org: U(3), venue: V(6), cat: "education",
    title: "Kente & Code — Women in Tech Ghana",
    slug: "kente-code-women-tech-ghana-2026",
    desc: "A full-day conference and workshop series celebrating and equipping women in Ghana's technology sector. Panel discussions, hands-on coding workshops, portfolio reviews, and mentorship speed-rounds. Speakers include tech leaders from Google Africa, mPharma, Farmerline, and Andela.",
    short: "Ghana's biggest women-in-tech conference. Panels, workshops, mentorship, and community.",
    start: "2026-08-29T08:00:00+00:00", end: "2026-08-29T18:00:00+00:00",
    cap: 600, featured: true, landmark: false, sponsored: false,
    banner: IMG.education, gallery: [IMG.tech, IMG.community],
    tags: ["women","tech","education","conference","accra","coding","womenintech"],
    tickets: [
      { id:T(29), name:"General Admission",   price:50,  type:"paid", qty:400 },
      { id:T(30), name:"Student (ID required)",price:20, type:"paid", qty:150 },
      { id:T(31), name:"Corporate Sponsor",   price:300, type:"paid", qty:50  },
    ],
  },
  {
    id: E(11), org: U(1), venue: V(3), cat: "community",
    title: "Labadi Beach All-White Party",
    slug: "labadi-beach-all-white-2026",
    desc: "The hottest beach party in Accra. All white attire required. Sunset cocktail hour followed by live DJ sets from midnight. International and Ghanaian headliners, fire performers, and a fireworks finale at dawn.",
    short: "Accra's ultimate all-white beach party at Labadi. Cocktails, fire, and fireworks at dawn.",
    start: "2026-10-03T17:00:00+00:00", end: "2026-10-04T05:00:00+00:00",
    cap: 2000, featured: true, landmark: false, sponsored: false,
    banner: IMG.beach, gallery: [IMG.music, IMG.community2],
    tags: ["beach","party","labadi","accra","all-white","nightlife"],
    tickets: [
      { id:T(32), name:"Early Bird",          price:150, type:"paid", qty:800  },
      { id:T(33), name:"Regular Entry",       price:200, type:"paid", qty:800  },
      { id:T(34), name:"VIP Table (6 pax)",   price:1500,type:"paid", qty:100  },
      { id:T(35), name:"VIP Cabana (10 pax)", price:3500,type:"paid", qty:50   },
    ],
  },
  {
    id: E(12), org: U(2), venue: V(7), cat: "music",
    title: "Kokrobite Beach Festival",
    slug: "kokrobite-beach-festival-2026",
    desc: "A full weekend of music, dance, and community at Ghana's legendary beach village. Reggae, Afrobeats, and percussion from sunrise to sunset. Beach camping, yoga at dawn, local food vendors, and fire-dance performances at night. Family-friendly during the day, vibrant at night.",
    short: "Full weekend of music and dance on Ghana's most iconic beach. Camping available.",
    start: "2026-11-14T10:00:00+00:00", end: "2026-11-16T22:00:00+00:00",
    cap: 5000, featured: false, landmark: false, sponsored: false,
    banner: IMG.beach, gallery: [IMG.community, IMG.music4],
    tags: ["kokrobite","beach","festival","reggae","afrobeats","camping","ghana"],
    tickets: [
      { id:T(36), name:"Day Pass",            price:80,  type:"paid", qty:2000 },
      { id:T(37), name:"Full Weekend",        price:200, type:"paid", qty:2000 },
      { id:T(38), name:"Weekend + Camping",   price:300, type:"paid", qty:500  },
    ],
  },
  {
    id: E(13), org: U(8), venue: V(12), cat: "networking",
    title: "Accra Founders Dinner — Q3",
    slug: "accra-founders-dinner-q3-2026",
    desc: "An intimate curated dinner for Ghana and West Africa-based founders at Movenpick Ambassador Hotel. 60 seats only. No pitch decks. Just honest conversations about building, failing, raising, and scaling. Guest speaker TBA — confirmed Tier 1 founder.",
    short: "60-seat founders dinner. Curated conversations, honest building talk, no pitches.",
    start: "2026-07-23T19:00:00+00:00", end: "2026-07-23T22:30:00+00:00",
    cap: 60, featured: false, landmark: false, sponsored: false,
    banner: IMG.networking, gallery: [IMG.community2, IMG.food],
    tags: ["founders","startup","networking","dinner","accra","entrepreneurs"],
    tickets: [
      { id:T(39), name:"Founder Seat",      price:0, type:"free", qty:50 },
      { id:T(40), name:"Investor / Advisor",price:0, type:"free", qty:10 },
    ],
  },
  {
    id: E(14), org: U(4), venue: V(11), cat: "arts",
    title: "West Africa Fashion Showcase — Accra",
    slug: "west-africa-fashion-showcase-accra-2026",
    desc: "Alliance Française hosts a runway showcase spotlighting 20 emerging West African fashion designers. Ready-to-wear, couture, and streetwear lines blending traditional textiles with contemporary cuts. Pop-up sales throughout the evening. Press night on Saturday.",
    short: "20 emerging West African designers. Runway, pop-up sales, and a celebration of African fashion.",
    start: "2026-10-17T18:00:00+00:00", end: "2026-10-17T22:00:00+00:00",
    cap: 400, featured: false, landmark: false, sponsored: false,
    banner: IMG.arts2, gallery: [IMG.arts, IMG.community2],
    tags: ["fashion","design","accra","africa","runway","emerging-designers"],
    tickets: [
      { id:T(41), name:"General Admission", price:100, type:"paid", qty:300 },
      { id:T(42), name:"Press Night VIP",   price:250, type:"paid", qty:80  },
    ],
  },
  {
    id: E(15), org: U(7), venue: V(9), cat: "education",
    title: "Product Management Bootcamp Accra",
    slug: "pm-bootcamp-accra-2026",
    desc: "An intensive 2-day product management bootcamp for aspiring and practicing PMs in Ghana. Curriculum: user research, Figma prototyping, roadmap prioritization, metrics, and stakeholder management. Facilitated by PMs from Jumia, Vodafone Ghana, and Paystack. Certificate on completion.",
    short: "2-day PM bootcamp. Real curriculum, industry mentors, and a certificate. 30 seats.",
    start: "2026-08-08T09:00:00+00:00", end: "2026-08-09T17:00:00+00:00",
    cap: 30, featured: false, landmark: false, sponsored: false,
    banner: IMG.education, gallery: [IMG.tech2, IMG.networking],
    tags: ["product","management","bootcamp","accra","education","pm","career"],
    tickets: [
      { id:T(43), name:"Bootcamp Seat",      price:350, type:"paid", qty:25 },
      { id:T(44), name:"Student / Graduate", price:150, type:"paid", qty:5  },
    ],
  },
  {
    id: E(16), org: U(6), venue: V(8), cat: "music",
    title: "Bukom Jazz & Highlife Night",
    slug: "bukom-jazz-highlife-night-2026",
    desc: "A late-night session in the historic Bukom neighborhood that gave Ghana its boxing legends and vibrant street culture. Live jazz and highlife from 9pm, with the Bukom All-Stars quartet performing until 2am. Street food vendors, palm wine, and the sounds of old Accra.",
    short: "Jazz and highlife in historic Bukom. Street food, palm wine, and Accra's musical soul.",
    start: "2026-08-15T21:00:00+00:00", end: "2026-08-16T02:00:00+00:00",
    cap: 200, featured: false, landmark: false, sponsored: false,
    banner: IMG.music3, gallery: [IMG.community, IMG.music4],
    tags: ["jazz","highlife","bukom","jamestown","accra","livemusic","nightlife"],
    tickets: [
      { id:T(45), name:"Entry", price:50, type:"paid", qty:200 },
    ],
  },
  {
    id: E(17), org: U(9), venue: V(14), cat: "community",
    title: "PANAFEST Cape Coast 2026",
    slug: "panafest-cape-coast-2026",
    desc: "Pan-African Historical Theatre Festival returns to Cape Coast Castle for its biennial edition. Three days of drama, film, music, and intellectual discourse exploring the African diaspora. Performances at Cape Coast Castle, University of Cape Coast, and the Castle grounds. Open to the African diaspora globally.",
    short: "Biennial Pan-African festival at Cape Coast Castle. Drama, film, music, discourse.",
    start: "2026-07-30T10:00:00+00:00", end: "2026-08-01T22:00:00+00:00",
    cap: 500, featured: true, landmark: true, sponsored: false,
    banner: IMG.arts, gallery: [IMG.community2, IMG.arts2],
    tags: ["panafest","cape-coast","diaspora","africa","festival","culture","heritage"],
    tickets: [
      { id:T(46), name:"Full Festival Pass",  price:200, type:"paid", qty:300 },
      { id:T(47), name:"Day Pass",            price:80,  type:"paid", qty:150 },
      { id:T(48), name:"Diaspora Delegate",   price:0,   type:"free", qty:50  },
    ],
  },
  {
    id: E(18), org: U(10), venue: V(15), cat: "community",
    title: "Tamale Cultural Night 2026",
    slug: "tamale-cultural-night-2026",
    desc: "A celebration of Northern Ghana's rich cultural heritage at Aliu Mahama Stadium. Traditional dama and takai dances, smock fashion, kologo music performances, and the crowning of the cultural ambassador. Local food market with TZ, fufu, and groundnut soup. Free entry for Tamale residents.",
    short: "Northern Ghana's cultural showcase. Traditional dances, kologo music, and local cuisine.",
    start: "2026-09-26T16:00:00+00:00", end: "2026-09-26T22:00:00+00:00",
    cap: 3000, featured: false, landmark: false, sponsored: false,
    banner: IMG.community, gallery: [IMG.community2, IMG.arts],
    tags: ["tamale","culture","northern-ghana","dama","kologo","heritage","community"],
    tickets: [
      { id:T(49), name:"Free Entry (Tamale residents)", price:0,  type:"free", qty:2500 },
      { id:T(50), name:"Out-of-Region Pass",            price:30, type:"paid", qty:500  },
    ],
  },
  {
    id: E(19), org: U(3), venue: V(10), cat: "education",
    title: "UG Career Fair — Technology & Finance",
    slug: "ug-career-fair-tech-finance-2026",
    desc: "The University of Ghana's flagship career fair connects final-year students and recent graduates with Ghana's leading technology and finance employers. 40+ companies including MTN Ghana, GCB Bank, Fidelity Bank, Hubtel, Jumia, Vodafone Ghana. CV clinics, mock interviews, and graduate recruitment on the spot.",
    short: "40+ Ghana employers, CV clinics, and on-the-spot graduate recruitment. Free entry.",
    start: "2026-10-08T09:00:00+00:00", end: "2026-10-08T17:00:00+00:00",
    cap: 800, featured: false, landmark: false, sponsored: true,
    banner: IMG.education, gallery: [IMG.networking, IMG.community],
    tags: ["career","graduate","university","accra","tech","finance","recruitment"],
    tickets: [
      { id:T(51), name:"Student Entry (Free)", price:0,   type:"free", qty:600 },
      { id:T(52), name:"Alumni / Public",      price:20,  type:"paid", qty:200 },
    ],
  },
  {
    id: E(20), org: U(4), venue: V(11), cat: "community",
    title: "East Legon Design & Makers Market",
    slug: "east-legon-design-makers-market-2026",
    desc: "A curated open-air market at Alliance Française spotlighting Ghana's independent designers, lifestyle brands, and home goods creators. Shop directly from 60+ Ghanaian makers, enjoy live Afrobeats sets, food trucks, and discover the next wave of Accra's creative economy. Pet-friendly, family-friendly.",
    short: "60+ Ghanaian designers. Fashion, home goods, art, live music, food trucks.",
    start: "2026-08-22T10:00:00+00:00", end: "2026-08-23T18:00:00+00:00",
    cap: 1500, featured: false, landmark: false, sponsored: false,
    banner: IMG.community2, gallery: [IMG.arts2, IMG.community],
    tags: ["market","design","fashion","accra","shopping","community","makers"],
    tickets: [
      { id:T(53), name:"Shopper Entry (Free)",  price:0,   type:"free", qty:1200 },
      { id:T(54), name:"Vendor Registration",   price:200, type:"paid", qty:200  },
      { id:T(55), name:"Early Preview (Fri PM)",price:30,  type:"paid", qty:100  },
    ],
  },
];

// ── 6. FOLLOWS (seed attendees following organizers) ──────────────────────────
// Each attendee follows a subset of organizers — power-law distribution
function buildFollows() {
  const follows = [];
  const attendeeIds = ATTENDEE_USERS.map((u) => u.id);
  const organizerIds = ORGANIZER_USERS.map((u) => u.id);

  // Each attendee follows 3–8 organizers (seeded deterministically)
  attendeeIds.forEach((followerId, i) => {
    const count = 3 + (i % 6); // 3–8
    const shuffled = [...organizerIds].sort(() => Math.sin(i * 17.3) - 0.5);
    shuffled.slice(0, count).forEach((followingId) => {
      follows.push({ follower_id: followerId, following_id: followingId });
    });
  });
  return follows;
}

// ── 7. GRAPH EDGES (structural + behavioral signals) ─────────────────────────
function buildEdges(catMap) {
  const edges = [];
  const attendeeIds = ATTENDEE_USERS.map((u) => u.id);

  EVENTS.forEach((ev, i) => {
    const catId = catMap[ev.cat];
    if (catId) {
      edges.push({ from_id:ev.id, from_type:"event", to_id:catId,    to_type:"category",  edge_type:"belongs_to",  weight:1.0 });
    }
    edges.push({   from_id:ev.id, from_type:"event", to_id:ev.org,   to_type:"organizer", edge_type:"organized_by", weight:1.0 });
    edges.push({   from_id:ev.id, from_type:"event", to_id:ev.venue, to_type:"venue",     edge_type:"held_at",      weight:1.0 });

    // Simulate saves from ~40% of attendees per event (deterministic)
    attendeeIds.forEach((uid, j) => {
      if ((i + j) % 5 < 2) {
        edges.push({ from_id:uid, from_type:"user", to_id:ev.id, to_type:"event", edge_type:"save", weight:5.0 });
      }
      if ((i + j) % 7 < 2) {
        edges.push({ from_id:uid, from_type:"user", to_id:ev.id, to_type:"event", edge_type:"card_click", weight:2.0 });
      }
    });
  });
  return edges;
}

// ── MAIN ──────────────────────────────────────────────────────────────────────

async function seed() {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  GoOutside Ghana Seed${DRY ? " [DRY RUN]" : ""}`);
  console.log(`${"═".repeat(60)}`);

  // ── Fetch category IDs ────────────────────────────────────────────────────
  step("Fetching category IDs");
  const { ok: cOk, data: cats } = await db_select("categories", "select=id,slug&is_active=eq.true");
  if (!cOk || !Array.isArray(cats)) { err("Could not fetch categories — run migrations first"); process.exit(1); }
  const catMap = Object.fromEntries(cats.map((c) => [c.slug, c.id]));
  ok(`Categories found: ${Object.keys(catMap).join(", ")}`);

  // ── Seed organizer users ──────────────────────────────────────────────────
  step("Seeding 10 organizer users");
  const orgUserRows = ORGANIZER_USERS.map((u) => ({
    id: u.id,
    clerk_id: `seed_clerk_org_${String(ORGANIZER_USERS.indexOf(u) + 1).padStart(3, "0")}`,
    email: `seed.org.${u.username.replace(/\./g, "")}@gooutside.test`,
    first_name: u.first,
    last_name: u.last,
    role: "organizer",
    account_type: "organizer",
    is_verified_organizer: true,
    location_city: u.city,
    interests: u.interests,
    pulse_score: u.pulse,
    pulse_tier: u.tier,
    pulse_points_balance: 0,
    pulse_points_lifetime: 0,
    onboarding_complete: true,
    avatar_url: u.g === "m" ? nextM() : nextF(),
    bio: u.bio,
    username: u.username,
    organizer_category: ORG_PROFILES.find((p) => p.user_id === u.id)?.category ?? [],
    organizer_social_links: { instagram: ORG_PROFILES.find((p) => p.user_id === u.id)?.instagram },
    is_active: true,
  }));
  const { ok: uOrgOk, data: uOrgErr } = await db_upsert("users", orgUserRows);
  uOrgOk ? ok(`${orgUserRows.length} organizer users upserted`) : err(`Users failed: ${JSON.stringify(uOrgErr).slice(0, 120)}`);

  // ── Seed organizer_profiles ───────────────────────────────────────────────
  step("Seeding 10 organizer profiles");
  const orgProfileRows = ORG_PROFILES.map((p) => ({
    user_id: p.user_id,
    organization_name: p.name,
    bio: p.bio,
    website_url: p.website,
    social_links: { instagram: p.instagram },
    status: "approved",
    verified_at: new Date().toISOString(),
    total_events: 0,
    total_revenue: 0,
  }));
  const { ok: opOk, data: opErr } = await db_upsert("organizer_profiles", orgProfileRows);
  opOk ? ok(`${orgProfileRows.length} organizer profiles upserted`) : err(`Org profiles failed: ${JSON.stringify(opErr).slice(0, 120)}`);

  // ── Seed attendee users ───────────────────────────────────────────────────
  step("Seeding 40 attendee users");
  const attendeeRows = ATTENDEE_USERS.map((u, i) => ({
    id: u.id,
    clerk_id: `seed_clerk_att_${String(i + 1).padStart(3, "0")}`,
    email: `seed.att.${i + 1}@gooutside.test`,
    first_name: u.first,
    last_name: u.last,
    role: "attendee",
    account_type: "user",
    location_city: u.city,
    interests: u.interests,
    pulse_score: u.pulse,
    pulse_tier: u.tier,
    pulse_points_balance: Math.floor(u.pulse * 0.3),
    pulse_points_lifetime: u.pulse,
    onboarding_complete: true,
    avatar_url: u.g === "m" ? nextM() : nextF(),
    is_active: true,
    vibe: { frequency: ["monthly", "weekly", "occasionally"][i % 3], crew: ["solo", "friends", "partner"][i % 3], time: [["evenings","weekends"][i % 2]] },
  }));
  const { ok: attOk, data: attErr } = await db_upsert("users", attendeeRows);
  attOk ? ok(`${attendeeRows.length} attendee users upserted`) : err(`Attendees failed: ${JSON.stringify(attErr).slice(0, 120)}`);

  // ── Seed venues ───────────────────────────────────────────────────────────
  step("Seeding 15 real Ghana venues");
  const venueRows = VENUES.map((v) => ({
    id: v.id,
    name: v.name,
    address: v.address,
    city: v.city,
    country: "Ghana",
    latitude: v.lat,
    longitude: v.lng,
    capacity: v.cap,
    google_maps_url: v.maps,
    is_verified: true,
  }));
  const { ok: vOk, data: vErr } = await db_upsert("venues", venueRows);
  vOk ? ok(`${venueRows.length} venues upserted`) : err(`Venues failed: ${JSON.stringify(vErr).slice(0, 120)}`);

  // ── Seed events ───────────────────────────────────────────────────────────
  step("Seeding 20 Ghana events");
  let evCount = 0;
  for (const ev of EVENTS) {
    const catId = catMap[ev.cat];
    if (!catId) { warn(`Skipping "${ev.title}" — unknown category "${ev.cat}"`); continue; }
    const { ok: evOk, data: evErr } = await db_upsert("events", [{
      id: ev.id,
      organizer_id: ev.org,
      category_id: catId,
      venue_id: ev.venue,
      title: ev.title,
      slug: ev.slug,
      description: ev.desc,
      short_description: ev.short,
      tags: ev.tags,
      banner_url: ev.banner,
      gallery_urls: ev.gallery,
      start_datetime: ev.start,
      end_datetime: ev.end,
      timezone: "Africa/Accra",
      is_online: false,
      total_capacity: ev.cap,
      tickets_sold: 0,
      status: "published",
      published_at: new Date().toISOString(),
      is_featured: ev.featured,
      is_landmark: ev.landmark,
      is_sponsored: ev.sponsored,
      views_count: Math.floor(ev.cap * 0.3 + 100),
      saves_count: Math.floor(ev.cap * 0.05 + 10),
    }]);
    evOk ? evCount++ : err(`Event failed "${ev.title}": ${JSON.stringify(evErr).slice(0, 100)}`);
  }
  ok(`${evCount} events upserted`);

  // ── Seed ticket types ─────────────────────────────────────────────────────
  step("Seeding ticket types");
  const allTickets = [];
  let ttOrder = 0;
  EVENTS.forEach((ev) => {
    ev.tickets.forEach((tt, i) => {
      allTickets.push({
        id: tt.id,
        event_id: ev.id,
        name: tt.name,
        price: tt.price,
        price_type: tt.type,
        currency: "GHS",
        quantity_total: tt.qty,
        quantity_sold: 0,
        max_per_user: 5,
        is_active: true,
        sort_order: i,
      });
      ttOrder++;
    });
  });
  const { ok: ttOk, data: ttErr } = await db_upsert("ticket_types", allTickets);
  ttOk ? ok(`${allTickets.length} ticket types upserted`) : err(`Ticket types failed: ${JSON.stringify(ttErr).slice(0, 120)}`);

  // ── Seed follows ──────────────────────────────────────────────────────────
  step("Seeding follow relationships");
  const follows = buildFollows();
  // Batch insert 50 at a time
  let followCount = 0;
  for (let i = 0; i < follows.length; i += 50) {
    const batch = follows.slice(i, i + 50);
    const { ok: fOk } = await db_upsert("follows", batch);
    if (fOk) followCount += batch.length;
  }
  ok(`${followCount} follow relationships upserted`);

  // ── Seed graph edges ──────────────────────────────────────────────────────
  step("Seeding graph edges");
  const edges = buildEdges(catMap);
  let edgeCount = 0;
  for (let i = 0; i < edges.length; i += 30) {
    const batch = edges.slice(i, i + 30);
    const { ok: eOk } = await db_upsert("graph_edges", batch);
    if (eOk) edgeCount += batch.length;
  }
  ok(`${edgeCount} graph edges upserted`);

  // ── Done ──────────────────────────────────────────────────────────────────
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  SEED COMPLETE${DRY ? " (DRY RUN)" : ""}`);
  console.log(`${"═".repeat(60)}`);
  console.log(`  Users:        ${orgUserRows.length + attendeeRows.length} (${orgUserRows.length} organizers, ${attendeeRows.length} attendees)`);
  console.log(`  Venues:       ${venueRows.length}`);
  console.log(`  Events:       ${evCount}`);
  console.log(`  Ticket types: ${allTickets.length}`);
  console.log(`  Follows:      ${followCount}`);
  console.log(`  Graph edges:  ${edgeCount}`);
  console.log(`\n  All seed records use IDs starting with "${SEED_PREFIX}"`);
  console.log(`  Run --teardown to remove everything cleanly.\n`);
}

async function teardown() {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  GoOutside Ghana TEARDOWN${DRY ? " [DRY RUN]" : ""}`);
  console.log(`${"═".repeat(60)}`);
  console.log(`  Removing all seed records by explicit ID list...\n`);

  // Build in-list filters (PostgREST `in` operator works on UUID columns)
  const allUserIds   = [...ORGANIZER_USERS, ...ATTENDEE_USERS].map((u) => u.id).join(",");
  const orgUserIds   = ORGANIZER_USERS.map((u) => u.id).join(",");
  const attUserIds   = ATTENDEE_USERS.map((u) => u.id).join(",");
  const venueIds     = VENUES.map((v) => v.id).join(",");
  const eventIds     = EVENTS.map((e) => e.id).join(",");
  const ticketIds    = EVENTS.flatMap((e) => e.tickets.map((t) => t.id)).join(",");

  // Reverse FK order. graph_edges has no FK constraints — must be explicit.
  const steps = [
    ["graph_edges",           `from_id=in.(${eventIds})`],
    ["graph_edges",           `to_id=in.(${eventIds})`],
    ["graph_edges",           `from_id=in.(${allUserIds})`],
    ["graph_edges",           `to_id=in.(${allUserIds})`],
    ["ticket_types",          `id=in.(${ticketIds})`],
    ["scarcity_state",        `event_id=in.(${eventIds})`],
    ["events",                `id=in.(${eventIds})`],
    ["organizer_profiles",    `user_id=in.(${orgUserIds})`],
    ["follows",               `follower_id=in.(${attUserIds})`],
    ["follows",               `following_id=in.(${orgUserIds})`],
    ["user_interest_vectors", `user_id=in.(${allUserIds})`],
    ["venues",                `id=in.(${venueIds})`],
    ["users",                 `id=in.(${allUserIds})`],
  ];

  for (const [table, filter] of steps) {
    const { ok: dOk, data: dErr } = await db_delete(table, filter);
    dOk ? ok(`${table}`) : warn(`${table}: ${JSON.stringify(dErr).slice(0, 80)}`);
  }

  console.log(`\n  TEARDOWN COMPLETE${DRY ? " (DRY RUN)" : ""}.\n`);
}

async function status() {
  console.log(`\n── Seed status\n`);

  // Build comma-separated ID lists for PostgREST `in` operator
  const userIds   = [...ORGANIZER_USERS, ...ATTENDEE_USERS].map((u) => u.id).join(",");
  const venueIds  = VENUES.map((v) => v.id).join(",");
  const eventIds  = EVENTS.map((e) => e.id).join(",");
  const ticketIds = EVENTS.flatMap((e) => e.tickets.map((t) => t.id)).join(",");

  const countIn = async (table, col, ids) => {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${col}=in.(${ids})&limit=0`, {
      headers: { ...H, Prefer: "count=exact" },
    });
    const cr = r.headers.get("content-range");
    return cr ? (cr.split("/")[1] ?? "0") : "0";
  };

  const uCount  = await countIn("users",              "id",          userIds);
  const opCount = await countIn("organizer_profiles", "user_id",     [...ORGANIZER_USERS].map((u) => u.id).join(","));
  const vCount  = await countIn("venues",             "id",          venueIds);
  const eCount  = await countIn("events",             "id",          eventIds);
  const ttCount = await countIn("ticket_types",       "id",          ticketIds);
  const fCount  = await countIn("follows",            "follower_id", [...ATTENDEE_USERS].map((u) => u.id).join(","));
  const geCount = await countIn("graph_edges",        "from_id",     eventIds);

  const rows = [
    ["users (50 expected)",          uCount],
    ["organizer_profiles (10)",       opCount],
    ["venues (15)",                   vCount],
    ["events (20)",                   eCount],
    ["ticket_types (55)",             ttCount],
    ["follows (~216)",                fCount],
    ["graph_edges (from events)",     geCount],
  ];
  rows.forEach(([label, count]) => console.log(`  ${label.padEnd(32)} ${count}`));
  console.log();
}

// ── Dispatch ──────────────────────────────────────────────────────────────────
if (MODE === "teardown")     await teardown();
else if (MODE === "status")  await status();
else                         await seed();
