export type LandmarkEvent = {
  id:       string;   // stable slug-style ID (not a Supabase UUID)
  name:     string;
  category: string;
  year:     number;
  related:  string[]; // IDs of related events to surface on select
};

export const LANDMARK_EVENTS: LandmarkEvent[] = [
  // ── Music ────────────────────────────────────────────────────────────────
  {
    id:       "afronation-2024",
    name:     "Afronation Ghana 2024",
    category: "music",
    year:     2024,
    related:  ["afronation-2023", "vgma-2024", "Ghana-music-festival-2024"],
  },
  {
    id:       "afronation-2023",
    name:     "Afronation Ghana 2023",
    category: "music",
    year:     2023,
    related:  ["afronation-2022", "vgma-2023"],
  },
  {
    id:       "afronation-2022",
    name:     "Afronation Ghana 2022",
    category: "music",
    year:     2022,
    related:  ["afronation-2023"],
  },
  {
    id:       "vgma-2024",
    name:     "VGMA 2024",
    category: "music",
    year:     2024,
    related:  ["vgma-2023", "afronation-2024"],
  },
  {
    id:       "vgma-2023",
    name:     "VGMA 2023",
    category: "music",
    year:     2023,
    related:  ["vgma-2024"],
  },
  {
    id:       "Ghana-music-festival-2024",
    name:     "Ghana Music Festival 2024",
    category: "music",
    year:     2024,
    related:  ["afronation-2024", "labadi-beach-festival-2023"],
  },
  {
    id:       "labadi-beach-festival-2023",
    name:     "Labadi Beach Festival 2023",
    category: "music",
    year:     2023,
    related:  ["labadi-beach-festival-2022", "Ghana-music-festival-2024"],
  },
  {
    id:       "labadi-beach-festival-2022",
    name:     "Labadi Beach Festival 2022",
    category: "music",
    year:     2022,
    related:  ["labadi-beach-festival-2023"],
  },
  {
    id:       "uncle-ebo-2024",
    name:     "Uncle Ebo Taylor's Music Workshop",
    category: "music",
    year:     2024,
    related:  ["Ghana-music-festival-2024"],
  },

  // ── Tech ─────────────────────────────────────────────────────────────────
  {
    id:       "gts-2024",
    name:     "Ghana Tech Summit 2024",
    category: "tech",
    year:     2024,
    related:  ["gts-2023", "techghana-2024"],
  },
  {
    id:       "gts-2023",
    name:     "Ghana Tech Summit 2023",
    category: "tech",
    year:     2023,
    related:  ["gts-2024", "techghana-2023"],
  },
  {
    id:       "techghana-2024",
    name:     "TechGhana Conference 2024",
    category: "tech",
    year:     2024,
    related:  ["gts-2024"],
  },
  {
    id:       "techghana-2023",
    name:     "TechGhana Conference 2023",
    category: "tech",
    year:     2023,
    related:  ["gts-2023"],
  },
  {
    id:       "accra-startup-summit-2024",
    name:     "Accra Startup Summit 2024",
    category: "tech",
    year:     2024,
    related:  ["gts-2024", "techghana-2024"],
  },

  // ── Arts & Culture ────────────────────────────────────────────────────────
  {
    id:       "chalewote-2024",
    name:     "Chale Wote Festival 2024",
    category: "arts",
    year:     2024,
    related:  ["chalewote-2023", "ghana-film-festival-2024"],
  },
  {
    id:       "chalewote-2023",
    name:     "Chale Wote Festival 2023",
    category: "arts",
    year:     2023,
    related:  ["chalewote-2024", "chalewote-2022"],
  },
  {
    id:       "chalewote-2022",
    name:     "Chale Wote Festival 2022",
    category: "arts",
    year:     2022,
    related:  ["chalewote-2023"],
  },
  {
    id:       "ghana-film-festival-2024",
    name:     "Ghana International Film Festival 2024",
    category: "arts",
    year:     2024,
    related:  ["chalewote-2024"],
  },
  {
    id:       "accra-art-week-2023",
    name:     "Accra Art Week 2023",
    category: "arts",
    year:     2023,
    related:  ["chalewote-2023"],
  },

  // ── Food & Drink ──────────────────────────────────────────────────────────
  {
    id:       "osu-night-market-2024",
    name:     "Osu Night Market 2024",
    category: "food-drink",
    year:     2024,
    related:  ["osu-night-market-2023", "accra-food-festival-2024"],
  },
  {
    id:       "osu-night-market-2023",
    name:     "Osu Night Market 2023",
    category: "food-drink",
    year:     2023,
    related:  ["osu-night-market-2024"],
  },
  {
    id:       "accra-food-festival-2024",
    name:     "Accra Food Festival 2024",
    category: "food-drink",
    year:     2024,
    related:  ["osu-night-market-2024"],
  },
  {
    id:       "ghana-supper-club-2023",
    name:     "Ghana Supper Club 2023",
    category: "food-drink",
    year:     2023,
    related:  ["accra-food-festival-2024"],
  },

  // ── Sports ────────────────────────────────────────────────────────────────
  {
    id:       "accra-marathon-2024",
    name:     "Accra Marathon 2024",
    category: "sports",
    year:     2024,
    related:  ["accra-marathon-2023", "accra-5k-2024"],
  },
  {
    id:       "accra-marathon-2023",
    name:     "Accra Marathon 2023",
    category: "sports",
    year:     2023,
    related:  ["accra-marathon-2024"],
  },
  {
    id:       "accra-5k-2024",
    name:     "Accra 5K Run 2024",
    category: "sports",
    year:     2024,
    related:  ["accra-marathon-2024"],
  },
  {
    id:       "ghana-cup-final-2024",
    name:     "Ghana FA Cup Final 2024",
    category: "sports",
    year:     2024,
    related:  ["ghana-cup-final-2023"],
  },
  {
    id:       "ghana-cup-final-2023",
    name:     "Ghana FA Cup Final 2023",
    category: "sports",
    year:     2023,
    related:  ["ghana-cup-final-2024"],
  },

  // ── Networking ────────────────────────────────────────────────────────────
  {
    id:       "accra-founders-night-2024",
    name:     "Accra Founders Night 2024",
    category: "networking",
    year:     2024,
    related:  ["gts-2024", "accra-startup-summit-2024"],
  },
  {
    id:       "she-leads-ghana-2024",
    name:     "She Leads Ghana 2024",
    category: "networking",
    year:     2024,
    related:  ["accra-founders-night-2024"],
  },

  // ── Education ─────────────────────────────────────────────────────────────
  {
    id:       "tedx-accra-2024",
    name:     "TEDx Accra 2024",
    category: "education",
    year:     2024,
    related:  ["tedx-accra-2023", "gts-2024"],
  },
  {
    id:       "tedx-accra-2023",
    name:     "TEDx Accra 2023",
    category: "education",
    year:     2023,
    related:  ["tedx-accra-2024"],
  },
  {
    id:       "ghana-startup-school-2024",
    name:     "Ghana Startup School 2024",
    category: "education",
    year:     2024,
    related:  ["tedx-accra-2024"],
  },

  // ── Community ─────────────────────────────────────────────────────────────
  {
    id:       "independence-day-parade-2024",
    name:     "Independence Day Parade 2024",
    category: "community",
    year:     2024,
    related:  ["independence-day-parade-2023"],
  },
  {
    id:       "independence-day-parade-2023",
    name:     "Independence Day Parade 2023",
    category: "community",
    year:     2023,
    related:  ["independence-day-parade-2024"],
  },
  {
    id:       "accra-cleanup-2024",
    name:     "Greater Accra Cleanup 2024",
    category: "community",
    year:     2024,
    related:  ["independence-day-parade-2024"],
  },
];

/** Initial events shown in the grid (first 12, spread across categories) */
export const INITIAL_LANDMARK_IDS = [
  "afronation-2024",
  "vgma-2024",
  "chalewote-2024",
  "gts-2024",
  "osu-night-market-2024",
  "accra-marathon-2024",
  "tedx-accra-2024",
  "accra-founders-night-2024",
  "labadi-beach-festival-2023",
  "techghana-2023",
  "ghana-film-festival-2024",
  "accra-food-festival-2024",
];

export const LANDMARK_BY_ID = new Map<string, LandmarkEvent>(
  LANDMARK_EVENTS.map((e) => [e.id, e])
);
