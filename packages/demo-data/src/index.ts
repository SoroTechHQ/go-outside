import rawDemo from "./demo.json";

export type NavLink = {
  label: string;
  href: string;
  iconKey?: string;
};

export type Category = {
  slug: string;
  name: string;
  iconKey: string;
  description: string;
};

export type Organizer = {
  id: string;
  name: string;
  tag: string;
  city: string;
  verified: boolean;
  followersLabel: string;
  eventsLabel: string;
};

export type TicketType = {
  name: string;
  priceLabel: string;
  remainingLabel: string;
};

export type EventItem = {
  id: string;
  slug: string;
  title: string;
  eyebrow: string;
  city: string;
  venue: string;
  locationLine: string;
  dateLabel: string;
  timeLabel: string;
  priceLabel: string;
  priceValue: number;
  capacityLabel: string;
  shortDescription: string;
  description: string;
  categorySlug: string;
  organizerId: string;
  status: string;
  featured: boolean;
  trending: boolean;
  saved: boolean;
  rating: string;
  bannerTone: string;
  ticketTypes: TicketType[];
  gallery: string[];
  tags: string[];
};

export type Review = {
  eventSlug: string;
  author: string;
  title: string;
  body: string;
  rating: string;
};

export type AttendeeTicket = {
  id: string;
  eventSlug: string;
  status: string;
  typeLabel: string;
  reference: string;
  seatLabel: string;
  holderName: string;
  calendarLabel: string;
  shareLabel: string;
};

export const demoData = rawDemo;

export const categories = demoData.categories as Category[];
export const events = demoData.events as EventItem[];
export const organizers = demoData.organizers as Organizer[];
export const reviews = demoData.reviews as Review[];

export function getEventBySlug(slug: string) {
  return events.find((event) => event.slug === slug);
}

export function getOrganizerById(id: string) {
  return organizers.find((organizer) => organizer.id === id);
}

export function getCategoryBySlug(slug: string) {
  return categories.find((category) => category.slug === slug);
}

export function getReviewsByEvent(slug: string) {
  return reviews.filter((review) => review.eventSlug === slug);
}

export function getAttendeeTicketById(ticketId: string) {
  const tickets = demoData.attendee.tickets as AttendeeTicket[];
  return tickets.find((ticket) => ticket.id === ticketId);
}

export function getSavedEvents() {
  return events.filter((event) => demoData.attendee.savedEventSlugs.includes(event.slug));
}

export function getRecommendedEvents() {
  return events.filter((event) =>
    demoData.attendee.recommendedEventSlugs.includes(event.slug),
  );
}

export function filterEvents(filters: {
  city?: string;
  category?: string;
  price?: string;
  query?: string;
}) {
  return events.filter((event) => {
    const cityMatch = !filters.city || filters.city === "All cities" || event.city === filters.city;
    const categoryMatch =
      !filters.category || filters.category === "all" || event.categorySlug === filters.category;
    const priceMatch =
      !filters.price ||
      filters.price === "all" ||
      (filters.price === "free" ? event.priceValue === 0 : event.priceValue > 0);
    const queryMatch =
      !filters.query ||
      `${event.title} ${event.shortDescription} ${event.city}`.toLowerCase().includes(filters.query.toLowerCase());

    return cityMatch && categoryMatch && priceMatch && queryMatch;
  });
}
