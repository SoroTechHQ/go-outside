import {
  demoData,
  getEventBySlug,
  type AttendeeTicket,
  type EventItem,
} from "@gooutside/demo-data";
import { ProfileClient } from "./ProfileClient";
import type { UserProfile } from "./types";

export default function ProfilePage() {
  const attendee = demoData.attendee as typeof demoData.attendee & {
    xpPoints: number;
    xpTier: string;
  };

  const tickets = attendee.tickets as AttendeeTicket[];
  const pastTickets = tickets.filter((t) => t.status === "past");
  const pastEvents = pastTickets
    .map((t) => getEventBySlug(t.eventSlug))
    .filter(Boolean) as EventItem[];

  const profile: UserProfile = {
    id: "user-kofi-mensah",
    name: attendee.name,
    handle: "kofi.mensah",
    bio: "Culture seeker. Always at the right place at the right time. Accra nightlife is my love language.",
    location: "Osu, Accra",
    avatarUrl: null,
    coverUrl: null,
    joinedAt: "January 2024",
    pulseScore: 1240,
    pulseTier: "City Native",
    neighbourhoodRank: 3,
    cityRankPercent: 12,
    eventsAttended: pastTickets.length,
    friendCount: 24,
    followingCount: 12,
    snippetCount: 2,
    topCategories: ["Music", "Arts", "Tech"],
    importedTweetIds: [],
    isOwnProfile: true,
  };

  return (
    <main className="min-h-screen bg-[var(--bg-base)] pb-32 text-[var(--text-primary)]">
      <ProfileClient
        profile={profile}
        pastTickets={pastTickets}
        pastEvents={pastEvents}
      />
    </main>
  );
}
