export type TrendSection = "events" | "organizers" | "topics";

export type TrendReason = {
  label: string;
  value: string;
};

export type TrendingEvent = {
  id: string;
  title: string;
  slug: string;
  banner_url: string | null;
  start_datetime: string | null;
  price_label: string | null;
  trending_score: number;
  views_count: number;
  saves_count: number;
  tickets_sold: number;
  snippet_count: number;
  organizer: {
    id: string;
    username: string | null;
    name: string;
  } | null;
  reasons: TrendReason[];
};

export type TrendingOrganizer = {
  id: string;
  username: string | null;
  name: string;
  logo_url: string | null;
  follower_count: number;
  event_count: number;
  snippet_count: number;
  trending_score: number;
  reasons: TrendReason[];
};

export type TrendingTopic = {
  tag: string;
  count: number;
  event_count: number;
  trending_score: number;
  lead_event_slug: string | null;
  reasons: TrendReason[];
};

export type TrendingSnippet = {
  id: string;
  body: string | null;
  rating: number;
  created_at: string;
  vibe_tags: string[];
  photo_url: string | null;
  media_urls: string[];
  user: {
    id: string;
    username: string | null;
    name: string;
    avatar_url: string | null;
  } | null;
  event: {
    id: string;
    slug: string;
    title: string;
  } | null;
};

export type TrendingResponse = {
  section: TrendSection;
  events: TrendingEvent[];
  organizers: TrendingOrganizer[];
  topics: TrendingTopic[];
  generated_at: string;
  window_hours: number;
};

export type TrendingEventDetail = {
  event: TrendingEvent;
  related_topics: string[];
  snippets: TrendingSnippet[];
};

export type TrendingOrganizerDetail = {
  organizer: TrendingOrganizer;
  top_events: TrendingEvent[];
  snippets: TrendingSnippet[];
};

export type TrendingTopicDetail = {
  topic: TrendingTopic;
  events: TrendingEvent[];
  snippets: TrendingSnippet[];
  related_organizers: TrendingOrganizer[];
};
