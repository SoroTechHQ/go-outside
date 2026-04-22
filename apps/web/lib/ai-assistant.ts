export type AssistantEvent = {
  id: string;
  title: string;
  slug: string;
  href: string;
  banner_url: string | null;
  start_datetime: string;
  venue_name: string | null;
  city: string | null;
  category_name: string | null;
  category_slug: string | null;
  price_label: string;
  price_value: number;
  short_description: string;
};

export type AssistantPick = {
  event_id: string;
  title: string;
  reason: string;
  event: AssistantEvent | null;
};

export type AssistantResponse = {
  intro: string;
  summary: string;
  followUps: string[];
  picks: AssistantPick[];
  totalMatches: number;
  searchHref: string | null;
};
