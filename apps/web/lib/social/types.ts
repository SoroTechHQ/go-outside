// Canonical social types — shared across service layer and API responses

export type FollowStatus = {
  following: boolean;
  followedBy: boolean;
  mutual: boolean;
};

export type SocialUser = {
  id: string;
  clerkId: string;
  username: string | null;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  city: string | null;
  pulseTier: string;
  pulseScore: number;
  followerCount: number;
  isFollowing: boolean;
  followedBy: boolean;
  mutual: boolean;
  mutualCount: number;
  sharedEventCount: number;
  reason: string | null;
};

export type SocialActivityVerb =
  | "followed"
  | "saved_event"
  | "registered"
  | "checked_in"
  | "posted"
  | "reviewed"
  | "liked";

export type SocialActivityItem = {
  id: string;
  actorUserId: string;
  actorName: string;
  actorUsername: string | null;
  actorAvatarUrl: string | null;
  verb: SocialActivityVerb;
  targetType: "user" | "event" | "post" | "organizer";
  targetId: string;
  targetTitle: string | null;
  targetHref: string;
  eventId?: string;
  eventSlug?: string;
  eventImageUrl?: string | null;
  createdAt: string;
  privacy: "public" | "followers" | "friends";
};

export type FeedMode = "for-you" | "following" | "plans";
