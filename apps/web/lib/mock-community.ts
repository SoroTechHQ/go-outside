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
