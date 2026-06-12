// Seed/demo data — imported ONLY by seed scripts and simulate.ts
// Never import this from apps/web or apps/admin at runtime.

import rawDemo from "./demo.json";
import rawSeed from "./ghana-seed.json";

import type { Category, EventItem, Organizer, Review, AttendeeTicket } from "./index";

export const demoData = rawDemo;

export const categories   = demoData.categories as Category[];
export const events        = demoData.events as EventItem[];
export const organizers    = demoData.organizers as Organizer[];
export const reviews       = demoData.reviews as Review[];

export function getEventBySlug(slug: string) {
  return events.find((e) => e.slug === slug);
}
export function getOrganizerById(id: string) {
  return organizers.find((o) => o.id === id);
}
export function getCategoryBySlug(slug: string) {
  return categories.find((c) => c.slug === slug);
}
export function getReviewsByEvent(slug: string) {
  return reviews.filter((r) => r.eventSlug === slug);
}
export function getAttendeeTicketById(ticketId: string) {
  const tickets = demoData.attendee.tickets as AttendeeTicket[];
  return tickets.find((t) => t.id === ticketId);
}
export function getSavedEvents() {
  return events.filter((e) => demoData.attendee.savedEventSlugs.includes(e.slug));
}
export function getRecommendedEvents() {
  return events.filter((e) => demoData.attendee.recommendedEventSlugs.includes(e.slug));
}
export function getCategoryEventCount(slug: string) {
  return events.filter((e) => e.categorySlug === slug).length;
}
export function filterEvents(filters: { city?: string; category?: string; price?: string; query?: string }) {
  return events.filter((event) => {
    const cityMatch     = !filters.city     || filters.city === "All cities" || event.city === filters.city;
    const categoryMatch = !filters.category || filters.category === "all"    || event.categorySlug === filters.category;
    const priceMatch    = !filters.price    || filters.price === "all"       || (filters.price === "free" ? event.priceValue === 0 : event.priceValue > 0);
    const queryMatch    = !filters.query    || `${event.title} ${event.shortDescription} ${event.city}`.toLowerCase().includes(filters.query.toLowerCase());
    return cityMatch && categoryMatch && priceMatch && queryMatch;
  });
}

// ── Ghana seed data ───────────────────────────────────────────────────────────

export const seedData         = rawSeed;
export const seedUsers        = rawSeed.users;
export const seedEvents       = rawSeed.events;
export const seedEdges        = rawSeed.graph_edges;
export const seedFriendships  = rawSeed.friendships;
export const seedPosts     = rawSeed.posts;
export const seedFeedSections = rawSeed.feed_sections;
export const seedScarcity     = rawSeed.scarcity_states;

export function getSeedEventBySlug(slug: string) {
  return rawSeed.events.find((e) => e.slug === slug);
}
export function getSeedUserById(id: string) {
  return rawSeed.users.find((u) => u.id === id);
}
export function getSeedEventsByCategory(categorySlug: string) {
  return rawSeed.events.filter((e) => e.categorySlug === categorySlug);
}
export function getSeedUserFriends(userId: string) {
  return rawSeed.friendships
    .filter((f) => (f.requesterId === userId || f.addresseeId === userId) && f.status === "accepted")
    .map((f) => (f.requesterId === userId ? f.addresseeId : f.requesterId));
}
export function getScarcityForEvent(eventId: string) {
  return (rawSeed.scarcity_states as Record<string, { state: string; ticketsRemaining: number; fillRate: number; label: string }>)[eventId] ?? null;
}
export function getSeedFeedSection(sectionKey: string) {
  return (rawSeed.feed_sections as Record<string, unknown>)[sectionKey] ?? null;
}
