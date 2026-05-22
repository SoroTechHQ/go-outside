import { supabaseAdmin } from "../../../lib/supabase";

type OrganizerProfileRow = {
  organization_name: string;
  bio: string | null;
  website_url: string | null;
  social_links: Record<string, string> | null;
  logo_url: string | null;
  status: string;
  total_events: number;
  total_revenue: number | string | null;
  users: {
    first_name: string;
    last_name: string;
    location_city: string | null;
  } | null;
};

type OrganizerEventRow = {
  id: string;
  slug: string;
  title: string;
  start_datetime: string | null;
  tickets_sold: number;
  total_capacity: number | null;
  status: string;
  saves_count: number;
  tags: string[] | null;
  categories: {
    name: string;
    slug: string;
  } | null;
  venues: {
    name: string;
    city: string;
  } | null;
  custom_location: string | null;
};

export type OrganizerPost = {
  id: string;
  body: string;
  imageUrl: string | null;
  likeCount: number;
  createdAt: string;
  eventTitle: string | null;
};

export type OrganizerDashboardData = {
  organizer: {
    name: string;
    initials: string;
    bio: string;
    city: string;
    logoUrl: string | null;
    websiteUrl: string | null;
    socialLinks: Array<{ label: string; href: string }>;
    social_links: Record<string, string> | null;
    verified: boolean;
    totalEvents: number;
  };
  posts: OrganizerPost[];
  overview: {
    ticketSales: number;
    ticketSalesDelta: string;
    followerCount: number;
    followerDelta: string;
    eventViews: number;
    eventViewsDelta: string;
    revenue: number;
    revenueDelta: string;
    conversionRate: number;
    organicReach: number;
    boostedReach: number;
  };
  salesSeries: Array<{ label: string; value: number }>;
  recentEvents: Array<{
    id: string;
    slug: string;
    title: string;
    dateLabel: string;
    statusLabel: "Live" | "Draft" | "Sold Out" | "Past";
    statusTone: "live" | "draft" | "sold";
    category: string;
    venue: string;
    sold: number;
    capacity: number | null;
    soldRatio: number;
    revenue: number;
    snippets: number;
  }>;
  hashtags: string[];
  activity: Array<{
    id: string;
    tone: "green" | "purple" | "amber" | "coral";
    title: string;
    body: string;
    timeLabel: string;
  }>;
  snippets: Array<{
    id: string;
    user: string;
    rating: number;
    text: string;
    eventTitle: string;
    featured: boolean;
  }>;
};

export type OrganizerCalendarItem = {
  id: string;
  day: number;
  kind: "event" | "post" | "campaign";
  title: string;
  timeLabel: string;
  status: string;
};

export type OrganizerAudienceData = {
  pulseBreakdown: Array<{ label: string; percentage: number }>;
  referralSources: Array<{ label: string; value: number }>;
  neighbourhoods: Array<{ name: string; share: number }>;
  ageBands: Array<{ label: string; share: number }>;
};

export type OrganizerHashtagPerformance = Array<{
  tag: string;
  postCount: number;
  avgReachPerPost: number;
  totalEngagements: number;
}>;

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatTimeAgo(value: string): string {
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toLocaleDateString("en-GH", { month: "short", day: "numeric" });
}

function formatDateLabel(value: string | null) {
  if (!value) return "No date";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "No date";
  return d.toLocaleDateString("en-GH", { month: "short", day: "numeric" });
}

function buildSocialLinks(input: Record<string, string> | null | undefined) {
  if (!input) return [];

  return Object.entries(input)
    .filter(([, href]) => Boolean(href))
    .slice(0, 4)
    .map(([label, href]) => ({
      label: label.charAt(0).toUpperCase() + label.slice(1),
      href,
    }));
}

function buildSalesSeries(totalTickets: number) {
  const labels = ["M", "T", "W", "T", "F", "S", "S"];
  if (totalTickets === 0) {
    return labels.map((label) => ({ label, value: 0 }));
  }
  const weights = [0.36, 0.52, 0.44, 0.78, 1, 0.88, 0.62];
  const peak = Math.max(1, Math.round(totalTickets / 7));
  return labels.map((label, index) => ({
    label,
    value: Math.round(peak * weights[index]!),
  }));
}

function getEventStatus(event: OrganizerEventRow): OrganizerDashboardData["recentEvents"][number]["statusLabel"] {
  if (event.status !== "published") return "Draft";
  if (event.total_capacity != null && event.tickets_sold >= event.total_capacity) return "Sold Out";
  if (event.start_datetime && new Date(event.start_datetime).getTime() < Date.now()) return "Past";
  return "Live";
}

function getStatusTone(status: OrganizerDashboardData["recentEvents"][number]["statusLabel"]) {
  if (status === "Draft") return "draft" as const;
  if (status === "Sold Out") return "sold" as const;
  return "live" as const;
}

function deltaLabel(thisWeek: number, lastWeek: number, suffix = "this week"): string {
  if (lastWeek === 0 && thisWeek === 0) return "No activity yet";
  if (lastWeek === 0) return `+${thisWeek} ${suffix}`;
  const pct = Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct}% vs last week`;
}

export async function getOrganizerDashboardData(userId: string): Promise<OrganizerDashboardData | null> {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: profile }, { data: events }, { count: followerCount }, { data: rawPosts }, { data: rawNotifications }, { data: rawSnippets }, { count: followersThisWeek }, { count: followersLastWeek }] = await Promise.all([
    supabaseAdmin
      .from("organizer_profiles")
      .select(`
        organization_name,
        bio,
        website_url,
        social_links,
        logo_url,
        status,
        total_events,
        total_revenue,
        users!organizer_profiles_user_id_fkey (
          first_name,
          last_name,
          location_city
        )
      `)
      .eq("user_id", userId)
      .maybeSingle(),
    supabaseAdmin
      .from("events")
      .select(`
        id,
        slug,
        title,
        start_datetime,
        tickets_sold,
        total_capacity,
        status,
        saves_count,
        tags,
        custom_location,
        categories (name, slug),
        venues (name, city)
      `)
      .eq("organizer_id", userId)
      .order("start_datetime", { ascending: false })
      .limit(8),
    supabaseAdmin
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", userId),
    supabaseAdmin
      .from("posts")
      .select("id, body, image_url, like_count, created_at, events(title)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(6),
    supabaseAdmin
      .from("notifications")
      .select("id, type, title, body, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabaseAdmin
      .from("snippets")
      .select("id, body, rating, is_public, created_at, users(first_name, last_name), events!inner(title, organizer_id)")
      .eq("events.organizer_id", userId)
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(4),
    supabaseAdmin
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", userId)
      .gte("created_at", weekAgo),
    supabaseAdmin
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", userId)
      .gte("created_at", twoWeeksAgo)
      .lt("created_at", weekAgo),
  ]);

  if (!profile) return null;

  const organizerProfile = profile as unknown as OrganizerProfileRow;
  const organizerEvents = (events ?? []) as unknown as OrganizerEventRow[];
  const eventCount = organizerEvents.length || organizerProfile.total_events || 0;
  const ticketSales = organizerEvents.reduce((sum, event) => sum + event.tickets_sold, 0);
  const revenue = Number(organizerProfile.total_revenue ?? 0);
  const eventViews = organizerEvents.reduce(
    (sum, event) => sum + event.tickets_sold * 11 + event.saves_count * 17,
    0,
  );
  const realFollowerCount = followerCount ?? 0;
  const boostedReach = clamp(Math.round(eventViews * 0.35), 120, Math.max(120, eventViews));
  const organicReach = Math.max(240, eventViews - boostedReach);
  const conversionRate = clamp(
    eventViews > 0 ? Number(((ticketSales / eventViews) * 100).toFixed(1)) : 6.4,
    2.4,
    38.9,
  );

  const tagCounts = new Map<string, number>();
  for (const event of organizerEvents) {
    for (const tag of event.tags ?? []) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }

  const hashtags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => `#${tag.replace(/^#/, "")}`)
    .slice(0, 8);

  if (hashtags.length < 5) {
    hashtags.push("#accraevents", "#weekendinaccra", "#gooutside");
  }

  const recentEvents = organizerEvents.slice(0, 4).map((event) => {
    const statusLabel = getEventStatus(event);
    const capacity = event.total_capacity;
    const soldRatio = capacity ? clamp(Math.round((event.tickets_sold / capacity) * 100), 0, 100) : 0;

    return {
      id: event.id,
      slug: event.slug,
      title: event.title,
      dateLabel: formatDateLabel(event.start_datetime),
      statusLabel,
      statusTone: getStatusTone(statusLabel),
      category: event.categories?.name ?? "Event",
      venue: event.venues?.name ?? event.custom_location ?? event.venues?.city ?? "Accra",
      sold: event.tickets_sold,
      capacity,
      soldRatio,
      revenue: Math.round((event.tickets_sold * Math.max(80, revenue / Math.max(ticketSales, 1))) / 10) * 10,
      snippets: Math.max(0, Math.round(event.saves_count / 2)),
    };
  });

  const organizerName = organizerProfile.organization_name;

  const posts: OrganizerPost[] = (rawPosts ?? []).map((p: Record<string, unknown>) => ({
    id: p.id as string,
    body: (p.body as string) ?? "",
    imageUrl: (p.image_url as string | null) ?? null,
    likeCount: (p.like_count as number) ?? 0,
    createdAt: p.created_at as string,
    eventTitle: (p.events as { title: string } | null)?.title ?? null,
  }));

  return {
    organizer: {
      name: organizerName,
      initials: getInitials(organizerName),
      bio:
        organizerProfile.bio?.trim() ||
        "Verified organizer account on GoOutside. Publish events, grow your following, and manage the full attendee experience from one place.",
      city: organizerProfile.users?.location_city ?? "Accra",
      logoUrl: organizerProfile.logo_url,
      websiteUrl: organizerProfile.website_url,
      socialLinks: buildSocialLinks(organizerProfile.social_links),
      social_links: organizerProfile.social_links,
      verified: organizerProfile.status === "approved",
      totalEvents: eventCount,
    },
    overview: {
      ticketSales,
      ticketSalesDelta: ticketSales === 0 ? "No ticket sales yet" : `${ticketSales} total sold`,
      followerCount: realFollowerCount,
      followerDelta: deltaLabel(followersThisWeek ?? 0, followersLastWeek ?? 0),
      eventViews,
      eventViewsDelta: eventViews === 0 ? "No views yet" : `${eventViews.toLocaleString()} total views`,
      revenue,
      revenueDelta: revenue === 0 ? "No revenue yet" : `GH₵${revenue.toLocaleString()} total`,
      conversionRate,
      organicReach,
      boostedReach,
    },
    posts,
    salesSeries: buildSalesSeries(ticketSales),
    recentEvents,
    hashtags: Array.from(new Set(hashtags)).slice(0, 10),
    activity: (rawNotifications ?? []).map((n: Record<string, unknown>) => {
      const toneMap: Record<string, OrganizerDashboardData["activity"][number]["tone"]> = {
        new_follower: "purple",
        ticket_purchase: "green",
        event_reminder: "amber",
        milestone: "green",
      };
      return {
        id: n.id as string,
        tone: toneMap[n.type as string] ?? "amber",
        title: n.title as string,
        body: n.body as string,
        timeLabel: formatTimeAgo(n.created_at as string),
      };
    }),
    snippets: (rawSnippets ?? []).map((s: Record<string, unknown>) => {
      const user = s.users as { first_name: string; last_name: string } | null;
      const event = s.events as { title: string } | null;
      const firstName = user?.first_name ?? "Someone";
      const lastName = user?.last_name ?? "";
      return {
        id: s.id as string,
        user: `${firstName} ${lastName.slice(0, 1)}.`.trim(),
        rating: s.rating as number,
        text: s.body as string,
        eventTitle: event?.title ?? "Your event",
        featured: (s.rating as number) >= 5,
      };
    }),
  };
}

export function getOrganizerCalendarItems(dashboard: OrganizerDashboardData): OrganizerCalendarItem[] {
  const baseDays = [3, 7, 11, 14, 18, 22, 27];
  const eventItems = dashboard.recentEvents.map((event, index) => ({
    id: `event-${event.id}`,
    day: baseDays[index] ?? 28,
    kind: "event" as const,
    title: event.title,
    timeLabel: index % 2 === 0 ? "7:00 PM" : "2:00 PM",
    status: event.statusLabel,
  }));

  const postItems = dashboard.hashtags.slice(0, 2).map((tag, index) => ({
    id: `post-${tag}`,
    day: [5, 16][index] ?? 5,
    kind: "post" as const,
    title: `Scheduled post ${tag}`,
    timeLabel: "11:30 AM",
    status: "Scheduled",
  }));

  const campaignItems = [
    {
      id: "campaign-boost",
      day: 20,
      kind: "campaign" as const,
      title: "Boost weekend push",
      timeLabel: "9:00 AM",
      status: "Active",
    },
  ];

  return [...eventItems, ...postItems, ...campaignItems].sort((a, b) => a.day - b.day);
}

export function getOrganizerAudienceData(dashboard: OrganizerDashboardData): OrganizerAudienceData {
  const organic = dashboard.overview.organicReach;
  const boosted = dashboard.overview.boostedReach;
  const totalReach = Math.max(organic + boosted, 1);

  return {
    pulseBreakdown: [
      { label: "Legends", percentage: 18 },
      { label: "City Natives", percentage: 27 },
      { label: "Regulars", percentage: 31 },
      { label: "Explorers", percentage: 17 },
      { label: "Newcomers", percentage: 7 },
    ],
    referralSources: [
      { label: "Organic", value: Math.round((organic / totalReach) * 100) },
      { label: "Boosted", value: Math.round((boosted / totalReach) * 100) },
      { label: "Friend Shares", value: 16 },
      { label: "Search", value: 11 },
    ],
    neighbourhoods: [
      { name: "Osu", share: 24 },
      { name: "East Legon", share: 19 },
      { name: "Labone", share: 14 },
      { name: "Cantonments", share: 12 },
      { name: "Tema", share: 9 },
    ],
    ageBands: [
      { label: "18-24", share: 21 },
      { label: "25-29", share: 33 },
      { label: "30-34", share: 24 },
      { label: "35-44", share: 15 },
      { label: "45+", share: 7 },
    ],
  };
}

export function getOrganizerHashtagPerformance(
  dashboard: OrganizerDashboardData,
): OrganizerHashtagPerformance {
  return dashboard.hashtags.slice(0, 6).map((tag, index) => ({
    tag,
    postCount: Math.max(1, 6 - index),
    avgReachPerPost: 1200 - index * 145,
    totalEngagements: 480 - index * 52,
  }));
}

export type OrganizerEventListItem = {
  id: string;
  slug: string;
  title: string;
  dateLabel: string;
  rawDate: string;
  statusLabel: "Live" | "Draft" | "Sold Out" | "Past";
  statusTone: "live" | "draft" | "sold";
  category: string;
  venue: string;
  sold: number;
  capacity: number | null;
  soldRatio: number;
  revenue: number;
  snippets: number;
};

export async function getOrganizerAllEvents(userId: string, revenue: number, totalSold: number): Promise<OrganizerEventListItem[]> {
  const { data: events } = await supabaseAdmin
    .from("events")
    .select(`
      id, slug, title, start_datetime, tickets_sold, total_capacity,
      status, saves_count, tags, custom_location,
      categories (name, slug),
      venues (name, city)
    `)
    .eq("organizer_id", userId)
    .order("start_datetime", { ascending: false });

  return (events ?? [] as unknown as OrganizerEventRow[]).map((event: unknown) => {
    const ev = event as OrganizerEventRow;
    const statusLabel = getEventStatus(ev);
    const capacity = ev.total_capacity;
    const soldRatio = capacity ? clamp(Math.round((ev.tickets_sold / capacity) * 100), 0, 100) : 0;
    return {
      id: ev.id,
      slug: ev.slug,
      title: ev.title,
      dateLabel: formatDateLabel(ev.start_datetime),
      rawDate: ev.start_datetime ?? "",
      statusLabel,
      statusTone: getStatusTone(statusLabel),
      category: (ev.categories as { name: string } | null)?.name ?? "Event",
      venue: (ev.venues as { name: string; city: string } | null)?.name ?? ev.custom_location ?? "Accra",
      sold: ev.tickets_sold,
      capacity,
      soldRatio,
      revenue: Math.round((ev.tickets_sold * Math.max(80, revenue / Math.max(totalSold, 1))) / 10) * 10,
      snippets: Math.max(0, Math.round(ev.saves_count / 2)),
    };
  });
}
