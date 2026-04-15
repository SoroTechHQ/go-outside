import { Hono } from 'hono';

import { AppServices } from '../domain.js';
import { AppVariables } from '../middleware/auth.js';
import { MemoryStore } from '../store.js';
import { getInteractions } from './interactions.js';

export function createPreviewRouter(store: MemoryStore, services: AppServices) {
  const router = new Hono<{ Variables: AppVariables }>();

  // GET /events/:slug/preview — enriched payload for peek panel
  router.get('/:slug', (c) => {
    const slug = c.req.param('slug');
    const userId = c.req.query('user_id') ?? null;

    const event = [...store.events.values()].find((e) => e.slug === slug);
    if (!event) return c.json({ error: 'Event not found' }, 404);

    const interactions = getInteractions();

    // Social proof
    const saves = interactions.filter((i) => i.toId === event.id && i.edgeType === 'save').length;
    const registrations = interactions.filter(
      (i) => i.toId === event.id && i.edgeType === 'registered'
    ).length;
    const lastHourCutoff = Date.now() - 60 * 60 * 1000;
    const bookedLastHour = interactions.filter(
      (i) =>
        i.toId === event.id &&
        i.edgeType === 'registered' &&
        new Date(i.createdAt).getTime() > lastHourCutoff
    ).length;

    // Related events (same category, different event)
    const related = [...store.events.values()]
      .filter(
        (e) =>
          e.categoryId === event.categoryId &&
          e.id !== event.id &&
          e.status === 'published' &&
          new Date(e.startDatetime) > services.now()
      )
      .slice(0, 4)
      .map((e) => ({
        id:            e.id,
        slug:          e.slug,
        title:         e.title,
        startDatetime: e.startDatetime,
        bannerUrl:     e.bannerUrl ?? null,
      }));

    // Organizer snippet
    const organizer = [...store.users.values()].find((u) => u.id === event.organizerId);
    const orgProfile = [...store.organizerProfiles.values()].find(
      (op) => op.userId === event.organizerId
    );

    // Ticket types
    const ticketTypes = [...store.ticketTypes.values()].filter(
      (tt) => tt.eventId === event.id && tt.isActive
    );
    const minPrice = ticketTypes.length > 0 ? Math.min(...ticketTypes.map((tt) => tt.price)) : 0;
    const maxCapacity = event.totalCapacity ?? null;
    const ticketsSold = event.ticketsSold;

    // Scarcity
    let scarcityState = 'normal';
    let scarcityLabel = '';
    let ticketsRemaining: number | null = null;

    if (maxCapacity !== null) {
      const fillRate = ticketsSold / maxCapacity;
      ticketsRemaining = maxCapacity - ticketsSold;

      if (fillRate >= 1.0) {
        scarcityState = 'sold_out';
        scarcityLabel = 'Sold out';
      } else if (fillRate >= 0.97) {
        scarcityState = 'final_spots';
        scarcityLabel = `Final ${ticketsRemaining} spot${ticketsRemaining === 1 ? '' : 's'}`;
      } else if (fillRate >= 0.90) {
        scarcityState = 'almost_sold_out';
        scarcityLabel = `${ticketsRemaining} tickets left`;
      } else if (fillRate >= 0.60) {
        scarcityState = 'selling_fast';
        scarcityLabel = 'Selling fast';
      }
    }

    // Log peek_open interaction async
    setImmediate(() => {
      if (userId) {
        interactions.push({
          id:        services.now().toISOString() + Math.random(),
          fromId:    userId,
          fromType:  'user',
          toId:      event.id,
          toType:    'event',
          edgeType:  'peek_open',
          weight:    1.5,
          dwellMs:   null,
          source:    'peek_panel',
          sessionId: null,
          position:  null,
          section:   null,
          isActive:  true,
          createdAt: services.now().toISOString(),
        });
      }
    });

    return c.json({
      // Standard event fields
      id:               event.id,
      slug:             event.slug,
      title:            event.title,
      description:      event.description,
      shortDescription: event.shortDescription,
      startDatetime:    event.startDatetime,
      endDatetime:      event.endDatetime,
      bannerUrl:        event.bannerUrl ?? null,
      galleryUrls:      event.galleryUrls,
      tags:             event.tags,
      isOnline:         event.isOnline,
      onlineLink:       event.onlineLink ?? null,
      customLocation:   event.customLocation ?? null,
      avgRating:        event.avgRating ?? null,
      reviewsCount:     event.reviewsCount,

      // Enriched fields
      ticket_types: ticketTypes.map((tt) => ({
        id:          tt.id,
        name:        tt.name,
        price:       tt.price,
        currency:    tt.currency,
        priceType:   tt.priceType,
        description: tt.description,
        available:   tt.quantityTotal !== null
          ? Math.max(0, tt.quantityTotal - tt.quantitySold)
          : null,
      })),
      price_from: minPrice,

      social_proof: {
        total_going:      registrations,
        booked_last_hour: bookedLastHour,
        saved_last_24h:   saves,
        trending_rank:    null, // computed by worker in Phase 2
      },

      scarcity: {
        state:             scarcityState,
        tickets_remaining: ticketsRemaining,
        label:             scarcityLabel,
      },

      related_events: related,

      organizer_snippet: organizer && orgProfile ? {
        user_id:      organizer.id,
        display_name: orgProfile.organizationName,
        avatar_url:   organizer.avatarUrl ?? null,
        total_events: orgProfile.totalEvents,
        avg_rating:   event.avgRating ?? null,
      } : null,

      // Friends going (demo: empty — wired in Phase D with real auth)
      friends_going: [],
    });
  });

  return router;
}
