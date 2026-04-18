import { events as demoEvents, type EventItem } from "@gooutside/demo-data";

export type CommunityProfile = {
  id: string;
  name: string;
  handle: string;
  bio: string;
  location: string;
  avatarUrl: string;
  coverUrl: string;
  joinedAt: string;
  eventsAttended: number;
  friendCount: number;
  followerCount: number;
  followingCount: number;
  pulseScore: number;
  pulseTier: string;
  isOnline: boolean;
  topCategories: string[];
  pastEventSlugs: string[];
};

export type CommunityPost = {
  id: string;
  userId: string;
  user: string;
  handle: string;
  text: string;
  avatar: string;
  time: string;
};

export type UserPost = {
  id: string;
  userId: string;
  text: string;
  time: string;
  likes: number;
  comments: number;
  reposts: number;
  eventRef?: {
    slug: string;
    title: string;
    categorySlug: string;
  };
};

export type UserSnippet = {
  id: string;
  userId: string;
  eventSlug: string;
  eventName: string;
  eventDate: string;
  rating: number;
  body: string;
  vibeTags: string[];
  hasGoldBadge?: boolean;
};

const COMMUNITY_PROFILES: CommunityProfile[] = [
  {
    id: "ama-k",
    name: "Ama Koomson",
    handle: "@ama.k",
    bio: "Chasing good rooms, rooftop sets, and the kind of nights that make Accra feel smaller in the best way.",
    location: "Osu, Accra",
    avatarUrl:
      "https://images.unsplash.com/photo-1494790108755-2616b612b5bd?auto=format&w=160&h=160&fit=crop&crop=faces",
    coverUrl:
      "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&w=1400&fit=crop",
    joinedAt: "March 2024",
    eventsAttended: 18,
    friendCount: 42,
    followerCount: 284,
    followingCount: 76,
    pulseScore: 2840,
    pulseTier: "Scene Kid",
    isOnline: true,
    topCategories: ["Music", "Food", "Culture"],
    pastEventSlugs: ["ga-rooftop-after-hours", "accra-chef-table", "accra-jazz-night"],
  },
  {
    id: "yaw-darko",
    name: "Yaw Darko",
    handle: "@yawdarko",
    bio: "Product guy by day, first one on the RSVP list by night. I keep a running spreadsheet of the city's best gatherings.",
    location: "Labone, Accra",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&w=160&h=160&fit=crop&crop=faces",
    coverUrl:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&w=1400&fit=crop",
    joinedAt: "January 2024",
    eventsAttended: 23,
    friendCount: 58,
    followerCount: 412,
    followingCount: 91,
    pulseScore: 3120,
    pulseTier: "City Native",
    isOnline: true,
    topCategories: ["Tech", "Networking", "Music"],
    pastEventSlugs: ["product-market-accra", "kumasi-creative-club", "kwahu-easter-house"],
  },
  {
    id: "esi-m",
    name: "Esi Mensah",
    handle: "@esi.m_accra",
    bio: "Venue-first explorer. If the room looks right, I am probably already there with two friends and a camera roll full of details.",
    location: "Airport Residential, Accra",
    avatarUrl:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&w=160&h=160&fit=crop&crop=faces",
    coverUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&w=1400&fit=crop",
    joinedAt: "May 2024",
    eventsAttended: 14,
    friendCount: 31,
    followerCount: 193,
    followingCount: 64,
    pulseScore: 2295,
    pulseTier: "Scene Kid",
    isOnline: false,
    topCategories: ["Arts", "Music", "Food"],
    pastEventSlugs: ["accra-chef-table", "ga-rooftop-after-hours", "kumasi-creative-club"],
  },
];

export const EVENT_COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: "post-ama-k",
    userId: "ama-k",
    user: "Ama Koomson",
    handle: "@ama.k",
    text: "Can't believe this is happening in Accra!! The vibes are going to be immaculate.",
    avatar: "AK",
    time: "2h ago",
  },
  {
    id: "post-yaw-darko",
    userId: "yaw-darko",
    user: "Yaw Darko",
    handle: "@yawdarko",
    text: "Been waiting for something like this all year. Grabbed my tickets the second they dropped.",
    avatar: "YD",
    time: "5h ago",
  },
  {
    id: "post-esi-m",
    userId: "esi-m",
    user: "Esi Mensah",
    handle: "@esi.m_accra",
    text: "The venue alone is worth it. Adding this to my list of unmissable experiences.",
    avatar: "EM",
    time: "1d ago",
  },
];

const MOCK_USER_POSTS: UserPost[] = [
  // Ama Koomson posts
  {
    id: "up-ama-1",
    userId: "ama-k",
    text: "The venue alone sold me. Ga Rooftop After Hours delivered more than I expected — front row, great crowd, strong set from start to finish. One for the books.",
    time: "2h ago",
    likes: 48,
    comments: 7,
    reposts: 3,
    eventRef: { slug: "ga-rooftop-after-hours", title: "Ga Rooftop After Hours", categorySlug: "music" },
  },
  {
    id: "up-ama-2",
    userId: "ama-k",
    text: "Accra's event calendar in 2024 is actually unhinged (a compliment). Something worth going to almost every single weekend now. The city finally caught up to its own energy.",
    time: "1d ago",
    likes: 112,
    comments: 19,
    reposts: 24,
  },
  {
    id: "up-ama-3",
    userId: "ama-k",
    text: "Just walked out of Accra Chef Table and I'm still processing it. The third course was insane. The pairing was even better. And the room itself — someone understood the assignment.",
    time: "3d ago",
    likes: 67,
    comments: 11,
    reposts: 8,
    eventRef: { slug: "accra-chef-table", title: "Accra Chef Table", categorySlug: "food" },
  },
  // Yaw Darko posts
  {
    id: "up-yaw-1",
    userId: "yaw-darko",
    text: "Product Market Accra was the room I didn't know I needed. Real founders talking about real problems. No fluff, no pitch decks, just honest conversations about building in Ghana.",
    time: "4h ago",
    likes: 89,
    comments: 14,
    reposts: 31,
    eventRef: { slug: "product-market-accra", title: "Product Market Accra", categorySlug: "tech" },
  },
  {
    id: "up-yaw-2",
    userId: "yaw-darko",
    text: "I have a running spreadsheet with 40+ upcoming events across Accra and Kumasi. DM me if you want the link 😅 the city is genuinely popping right now",
    time: "2d ago",
    likes: 203,
    comments: 47,
    reposts: 68,
  },
  {
    id: "up-yaw-3",
    userId: "yaw-darko",
    text: "Kwahu Easter House tickets are already reselling on the secondary market. Y'all really should've listened when I said to grab early. This one's going to be a moment.",
    time: "5d ago",
    likes: 156,
    comments: 28,
    reposts: 19,
    eventRef: { slug: "kwahu-easter-house", title: "Kwahu Easter House", categorySlug: "music" },
  },
  // Esi Mensah posts
  {
    id: "up-esi-1",
    userId: "esi-m",
    text: "Kumasi Creative Club was better than I expected and I had high expectations going in. The curation was tight, the crowd was right, and the space made you actually want to stay.",
    time: "6h ago",
    likes: 73,
    comments: 9,
    reposts: 12,
    eventRef: { slug: "kumasi-creative-club", title: "Kumasi Creative Club", categorySlug: "arts" },
  },
  {
    id: "up-esi-2",
    userId: "esi-m",
    text: "Not enough people are talking about how much Accra's art and culture event scene has actually leveled up. We're not just keeping up — we're setting the pace now.",
    time: "3d ago",
    likes: 198,
    comments: 33,
    reposts: 41,
  },
];

const MOCK_USER_SNIPPETS: UserSnippet[] = [
  // Ama Koomson snippets
  {
    id: "us-ama-1",
    userId: "ama-k",
    eventSlug: "ga-rooftop-after-hours",
    eventName: "Ga Rooftop After Hours",
    eventDate: "April 5, 2025",
    rating: 5,
    body: "Cinematic without feeling staged. The event felt curated, but still social. Easy to meet people, music pacing was strong, and the venue flow made sense. Will be back for every edition.",
    vibeTags: ["Rooftop", "Afrobeats", "Nightlife"],
    hasGoldBadge: true,
  },
  {
    id: "us-ama-2",
    userId: "ama-k",
    eventSlug: "accra-jazz-night",
    eventName: "Accra Jazz Night",
    eventDate: "March 7, 2025",
    rating: 4,
    body: "Production value was high but the atmosphere stayed warm. Two sets from resident ensembles, a guest feature, and an open-floor closing hour that went longer than expected (nobody complained).",
    vibeTags: ["Jazz", "Live Music", "Intimate"],
  },
  // Yaw Darko snippets
  {
    id: "us-yaw-1",
    userId: "yaw-darko",
    eventSlug: "product-market-accra",
    eventName: "Product Market Accra",
    eventDate: "February 22, 2025",
    rating: 5,
    body: "This is what ecosystem events should look like. Real founders, real problems, real conversations. Left with 3 new contacts, 2 ideas, and a reminder of why Accra's tech scene is worth being optimistic about.",
    vibeTags: ["Tech", "Startup", "Networking"],
    hasGoldBadge: true,
  },
  {
    id: "us-yaw-2",
    userId: "yaw-darko",
    eventSlug: "kumasi-creative-club",
    eventName: "Kumasi Creative Club",
    eventDate: "March 14, 2025",
    rating: 4,
    body: "Drove up from Accra for this one. Worth every minute of the ride. The Creative Club format — intimate rounds, no big stage — makes it actually possible to learn something.",
    vibeTags: ["Arts", "Creative", "Workshop"],
  },
  // Esi Mensah snippets
  {
    id: "us-esi-1",
    userId: "esi-m",
    eventSlug: "kumasi-creative-club",
    eventName: "Kumasi Creative Club",
    eventDate: "March 14, 2025",
    rating: 5,
    body: "The venue flow was impeccable. You could feel where the organizers put their thought — every transition between spaces felt deliberate. The room made you want to linger.",
    vibeTags: ["Arts", "Culture", "Community"],
    hasGoldBadge: true,
  },
  {
    id: "us-esi-2",
    userId: "esi-m",
    eventSlug: "accra-chef-table",
    eventName: "Accra Chef Table",
    eventDate: "April 11, 2025",
    rating: 4,
    body: "The third course was the standout — bold pairing, unexpected combination. The chef took a real swing and it landed. The setting was right too, which matters more than people admit.",
    vibeTags: ["Food", "Fine Dining", "Experience"],
  },
];

export function getCommunityProfileById(id: string): CommunityProfile | null {
  return COMMUNITY_PROFILES.find((profile) => profile.id === id) ?? null;
}

export function getCommunityPastEvents(profileId: string): EventItem[] {
  const profile = getCommunityProfileById(profileId);
  if (!profile) return [];

  return profile.pastEventSlugs
    .map((slug) => demoEvents.find((event) => event.slug === slug))
    .filter((event): event is EventItem => Boolean(event));
}

export function getUserPosts(userId: string): UserPost[] {
  return MOCK_USER_POSTS.filter((p) => p.userId === userId);
}

export function getUserSnippets(userId: string): UserSnippet[] {
  return MOCK_USER_SNIPPETS.filter((s) => s.userId === userId);
}
