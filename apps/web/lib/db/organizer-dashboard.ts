import { supabaseAdmin } from "../supabase";

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
  start_datetime: string;
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

export type OrganizerDashboardData = {
  organizer: {
    name: string;
    initials: string;
    bio: string;
    city: string;
    websiteUrl: string | null;
    socialLinks: Array<{ label: string; href: string }>;
    verified: boolean;
    totalEvents: number;
  };
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

function formatDateLabel(value: string) {
  return new Date(value).toLocaleDateString("en-GH", {
    month: "short",
    day: "numeric",
  });
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
  const weights = [0.36, 0.52, 0.44, 0.78, 1, 0.88, 0.62];
  const peak = Math.max(18, Math.round(totalTickets / 7));

  return labels.map((label, index) => ({
    label,
    value: Math.max(8, Math.round(peak * weights[index])),
  }));
}

function getEventStatus(event: OrganizerEventRow): OrganizerDashboardData["recentEvents"][number]["statusLabel"] {
  if (event.status !== "published") return "Draft";
  if (event.total_capacity != null && event.tickets_sold >= event.total_capacity) return "Sold Out";
  if (new Date(event.start_datetime).getTime() < Date.now()) return "Past";
  return "Live";
}

function getStatusTone(status: OrganizerDashboardData["recentEvents"][number]["statusLabel"]) {
  if (status === "Draft") return "draft" as const;
  if (status === "Sold Out") return "sold" as const;
  return "live" as const;
}

export async function getOrganizerDashboardData(userId: string): Promise<OrganizerDashboardData | null> {
  const [{ data: profile }, { data: events }] = await Promise.all([
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
  const followerCount = Math.max(
    180,
    Math.round(eventCount * 126 + ticketSales * 0.72 + revenue / 850),
  );
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

  return {
    organizer: {
      name: organizerName,
      initials: getInitials(organizerName),
      bio:
        organizerProfile.bio?.trim() ||
        "Verified organizer account on GoOutside. Publish events, grow your following, and manage the full attendee experience from one place.",
      city: organizerProfile.users?.location_city ?? "Accra",
      websiteUrl: organizerProfile.website_url,
      socialLinks: buildSocialLinks(organizerProfile.social_links),
      verified: organizerProfile.status === "approved",
      totalEvents: eventCount,
    },
    overview: {
      ticketSales,
      ticketSalesDelta: `+${Math.max(8, Math.round(ticketSales * 0.18))}% vs last month`,
      followerCount,
      followerDelta: `+${Math.max(24, Math.round(followerCount * 0.06))} this week`,
      eventViews,
      eventViewsDelta: `${eventViews > 1600 ? "+" : "-"}${Math.max(3, Math.round(eventViews * 0.04))}% this week`,
      revenue,
      revenueDelta: `+${Math.max(10, Math.round((revenue || 12000) / 2600))}% this month`,
      conversionRate,
      organicReach,
      boostedReach,
    },
    salesSeries: buildSalesSeries(ticketSales),
    recentEvents,
    hashtags: Array.from(new Set(hashtags)).slice(0, 10),
    activity: [
      {
        id: "ticket-spike",
        tone: "green",
        title: "Ticket spike",
        body: `${organizerName} picked up ${Math.max(12, Math.round(ticketSales * 0.08))} new purchases in the last 24 hours.`,
        timeLabel: "12 min ago",
      },
      {
        id: "new-followers",
        tone: "purple",
        title: "Audience growth",
        body: `${Math.max(18, Math.round(followerCount * 0.04))} new followers came in from event shares and profile visits.`,
        timeLabel: "48 min ago",
      },
      {
        id: "comment-burst",
        tone: "amber",
        title: "Community activity",
        body: `Questions are clustering around ${recentEvents[0]?.title ?? "your latest event"} — worth pinning a response.`,
        timeLabel: "1h ago",
      },
      {
        id: "boost-window",
        tone: "coral",
        title: "Boost window",
        body: `Your best-performing reach window is Thursday to Saturday evenings right now.`,
        timeLabel: "Today",
      },
    ],
    snippets: [
      {
        id: "snippet-1",
        user: "Ama O.",
        rating: 5,
        text: "Line moved quickly, sound was clean, and the room actually felt curated.",
        eventTitle: recentEvents[0]?.title ?? "Latest event",
        featured: true,
      },
      {
        id: "snippet-2",
        user: "Kofi M.",
        rating: 4,
        text: "Good crowd mix and the DJ pacing was right. Would come earlier next time.",
        eventTitle: recentEvents[1]?.title ?? "Community event",
        featured: false,
      },
      {
        id: "snippet-3",
        user: "Efua A.",
        rating: 5,
        text: "The event card convinced me first, but the actual experience delivered even more.",
        eventTitle: recentEvents[2]?.title ?? "Upcoming event",
        featured: false,
      },
    ],
  };
}
