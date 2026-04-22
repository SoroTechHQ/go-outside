export interface LandingEvent {
  id:          string;
  slug:        string;
  title:       string;
  category:    string;
  eyebrow:     string;
  imageUrl:    string;
  price:       string;
  minPrice:    number;
  isFree:      boolean;
  date:        string;
  location:    string;
  scarcity?:   { state: string; label: string };
  friendCount?: number;
}

export const LANDING_EVENTS: LandingEvent[] = [
  {
    id:          "ga-rooftop",
    slug:        "ga-rooftop-after-hours",
    title:       "Ga Rooftop After Hours",
    category:    "Music",
    eyebrow:     "FRIDAY IN OSU",
    imageUrl:    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=800&q=80",
    price:       "GHS 180",
    minPrice:    180,
    isFree:      false,
    date:        "Friday, Apr 18 · 7:00 PM",
    location:    "Osu, Accra",
    scarcity:    { state: "almost_sold_out", label: "68 left" },
    friendCount: 47,
  },
  {
    id:          "product-market-accra",
    slug:        "product-market-accra",
    title:       "Product Market Accra",
    category:    "Tech",
    eyebrow:     "BUILDERS AND OPERATORS",
    imageUrl:    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=400&q=75",
    price:       "Free",
    minPrice:    0,
    isFree:      true,
    date:        "Sat, Apr 26 · 10:00 AM",
    location:    "Airport City, Accra",
    friendCount: 12,
  },
  {
    id:          "chef-table",
    slug:        "accra-chef-table-vol-4",
    title:       "Accra Chef Table Vol. 4",
    category:    "Food",
    eyebrow:     "CHEF RESIDENCY",
    imageUrl:    "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=400&q=75",
    price:       "GHS 240",
    minPrice:    240,
    isFree:      false,
    date:        "Thu, May 1 · 6:30 PM",
    location:    "Airport Residential, Accra",
    scarcity:    { state: "almost_sold_out", label: "14 left" },
  },
  {
    id:          "kumasi-creative",
    slug:        "kumasi-creative-club",
    title:       "Kumasi Creative Club",
    category:    "Arts",
    eyebrow:     "WORKSHOP AND SALON",
    imageUrl:    "https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?auto=format&fit=crop&w=400&q=75",
    price:       "GHS 95",
    minPrice:    95,
    isFree:      false,
    date:        "Sat, May 10 · 4:00 PM",
    location:    "Nhyiaeso, Kumasi",
    friendCount: 8,
  },
  {
    id:          "kwahu-easter",
    slug:        "kwahu-easter-house",
    title:       "Kwahu Easter House",
    category:    "Networking",
    eyebrow:     "LAKEFRONT SOCIAL CLUB",
    imageUrl:    "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&w=400&q=75",
    price:       "GHS 240",
    minPrice:    240,
    isFree:      false,
    date:        "Sun, Apr 20 · 2:00 PM",
    location:    "Kwahu Ridge, Eastern Region",
    scarcity:    { state: "selling_fast", label: "Selling fast" },
  },
  {
    id:          "beach-bonfire",
    slug:        "beach-bonfire-live",
    title:       "Beach Bonfire Live",
    category:    "Music",
    eyebrow:     "LABADI BEACH",
    imageUrl:    "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=400&q=75",
    price:       "Free",
    minPrice:    0,
    isFree:      true,
    date:        "Sat, May 3 · 5:00 PM",
    location:    "Labadi, Accra",
    friendCount: 23,
  },
  {
    id:          "build-ghana",
    slug:        "build-ghana-summit",
    title:       "Build Ghana Summit",
    category:    "Tech",
    eyebrow:     "EAST LEGON",
    imageUrl:    "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=400&q=75",
    price:       "GHS 50",
    minPrice:    50,
    isFree:      false,
    date:        "Fri, May 9 · 9:00 AM",
    location:    "East Legon, Accra",
    friendCount: 34,
  },
  {
    id:          "sip-paint",
    slug:        "sip-and-paint-night",
    title:       "Sip & Paint Night",
    category:    "Arts",
    eyebrow:     "AIRPORT RESIDENTIAL",
    imageUrl:    "https://images.unsplash.com/photo-1536924940846-227afb31e2a5?auto=format&fit=crop&w=400&q=75",
    price:       "GHS 120",
    minPrice:    120,
    isFree:      false,
    date:        "Sat, Apr 19 · 6:00 PM",
    location:    "Airport Residential, Accra",
    friendCount: 6,
  },
];

export interface TickerEvent {
  category: string;
  name:     string;
  location: string;
  signal:   string;
}

export const TICKER_EVENTS: TickerEvent[] = [
  { category: "Music",      name: "Ga Rooftop After Hours",  location: "Osu",                  signal: "68 left"   },
  { category: "Tech",       name: "Product Market Accra",    location: "Airport City",          signal: "Free"      },
  { category: "Food",       name: "Accra Chef Table Vol. 4", location: "Airport Residential",   signal: "14 left"   },
  { category: "Networking", name: "Kwahu Easter House",      location: "Kwahu Ridge",           signal: "Tomorrow"  },
  { category: "Arts",       name: "Kumasi Creative Club",    location: "Nhyiaeso, Kumasi",      signal: "32 left"   },
  { category: "Music",      name: "Beach Bonfire Live",      location: "Labadi",                signal: "Free"      },
  { category: "Tech",       name: "Build Ghana Summit",      location: "East Legon",            signal: "90 left"   },
  { category: "Arts",       name: "Sip & Paint Night",       location: "Airport Residential",   signal: "Sat"       },
];

export const CATEGORY_COLORS: Record<string, string> = {
  Music:      "#7c3aed",
  Tech:       "#2563eb",
  Food:       "#d97706",
  Arts:       "#be185d",
  Sports:     "#059669",
  Networking: "#0891b2",
  Education:  "#b45309",
  Community:  "#5b21b6",
};
