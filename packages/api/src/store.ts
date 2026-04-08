import { randomBytes, randomUUID } from 'node:crypto';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import {
  AppServices,
  AuditLogRecord,
  Category,
  Event,
  EventStatus,
  EventWithRelations,
  NotificationRecord,
  OrganizerAnalytics,
  OrganizerProfile,
  OrganizerStatus,
  PaginatedResult,
  Payment,
  PaymentStatus,
  PurchaseTicketResult,
  Report,
  Review,
  Ticket,
  TicketPriceType,
  TicketStatus,
  TicketType,
  User,
  UserRole,
  Venue,
  WebhookEventRecord
} from './domain.js';
import { ApiError, assertPresent } from './lib/errors.js';
import { assertNoEmoji } from './lib/no-emoji.js';
import { slugify, uniqueSlug } from './lib/slug.js';

type CreateUserInput = {
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  phone?: string | null;
  role?: UserRole;
};

type CreateEventInput = {
  organizerId: string;
  categoryId: string;
  venueId?: string | null;
  title: string;
  description: string;
  shortDescription?: string | null;
  startDatetime: string;
  endDatetime: string;
  timezone: string;
  totalCapacity?: number | null;
  isOnline: boolean;
  onlineLink?: string | null;
  customLocation?: string | null;
  tags?: string[];
  ticketTypes: Array<{
    name: string;
    description?: string | null;
    price: number;
    priceType: TicketPriceType;
    quantityTotal?: number | null;
    maxPerUser?: number;
    saleStartsAt?: string | null;
    saleEndsAt?: string | null;
    sortOrder?: number;
  }>;
};

type PurchaseTicketInput = {
  eventId: string;
  ticketTypeId: string;
  quantity: number;
  attendeeInfo?: {
    name?: string;
    email?: string;
  };
};

type ProcessWebhookInput = {
  reference: string;
  providerEventId?: string | null;
  signature?: string | null;
  payload: Record<string, unknown>;
};

const defaultNotificationPrefs = {
  email: true,
  push: true,
  sms: false,
  in_app: true
};

function timestamp(services: AppServices): string {
  return services.now().toISOString();
}

function pageResult<T>(items: T[], page: number, limit: number): PaginatedResult<T> {
  const total = items.length;
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  const offset = (page - 1) * limit;
  const data = items.slice(offset, offset + limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
}

export class MemoryStore {
  readonly users = new Map<string, User>();
  readonly organizerProfiles = new Map<string, OrganizerProfile>();
  readonly categories = new Map<string, Category>();
  readonly venues = new Map<string, Venue>();
  readonly events = new Map<string, Event>();
  readonly ticketTypes = new Map<string, TicketType>();
  readonly tickets = new Map<string, Ticket>();
  readonly payments = new Map<string, Payment>();
  readonly reviews = new Map<string, Review>();
  readonly reports = new Map<string, Report>();
  readonly notifications = new Map<string, NotificationRecord>();
  readonly webhookEvents = new Map<string, WebhookEventRecord>();
  readonly auditLogs = new Map<string, AuditLogRecord>();
  readonly savedEvents = new Set<string>();

  constructor() {
    this.seedCategories();
  }

  private seedCategories() {
    const now = new Date().toISOString();
    const categories: Array<Omit<Category, 'id' | 'createdAt'>> = [
      { name: 'Music & Concerts', slug: 'music', iconKey: 'music-4', color: '#7C3AED', isActive: true, sortOrder: 1 },
      { name: 'Tech & Innovation', slug: 'tech', iconKey: 'monitor-smartphone', color: '#2563EB', isActive: true, sortOrder: 2 },
      { name: 'Food & Drink', slug: 'food-drink', iconKey: 'utensils-crossed', color: '#D97706', isActive: true, sortOrder: 3 },
      { name: 'Arts & Culture', slug: 'arts', iconKey: 'palette', color: '#DB2777', isActive: true, sortOrder: 4 },
      { name: 'Sports & Fitness', slug: 'sports', iconKey: 'dumbbell', color: '#16A34A', isActive: true, sortOrder: 5 },
      { name: 'Business & Networking', slug: 'networking', iconKey: 'briefcase-business', color: '#0891B2', isActive: true, sortOrder: 6 },
      { name: 'Education & Workshops', slug: 'education', iconKey: 'graduation-cap', color: '#CA8A04', isActive: true, sortOrder: 7 },
      { name: 'Community & Social', slug: 'community', iconKey: 'users', color: '#9333EA', isActive: true, sortOrder: 8 }
    ];

    categories.forEach((category) => {
      const id = randomUUID();
      this.categories.set(id, { id, createdAt: now, ...category });
    });
  }

  private sanitizeText(value: string, fieldName: string): string {
    const trimmed = value.trim();
    assertNoEmoji(trimmed, fieldName);
    return trimmed;
  }

  private recordAudit(actorUserId: string | null, action: string, entityType: string | null, entityId: string | null, metadata: Record<string, unknown> = {}) {
    const log: AuditLogRecord = {
      id: randomUUID(),
      actorUserId,
      action,
      entityType,
      entityId,
      metadata,
      ipAddress: null,
      userAgent: null,
      createdAt: new Date().toISOString()
    };

    this.auditLogs.set(log.id, log);
  }

  recordNotification(userId: string, type: string, title: string, body: string, data: Record<string, unknown> = {}) {
    const entry: NotificationRecord = {
      id: randomUUID(),
      userId,
      type,
      title,
      body,
      data,
      channel: 'in_app',
      isRead: false,
      readAt: null,
      createdAt: new Date().toISOString()
    };

    this.notifications.set(entry.id, entry);
  }

  getUserByClerkId(clerkId: string) {
    return [...this.users.values()].find((user) => user.clerkId === clerkId) ?? null;
  }

  getUserById(userId: string) {
    return this.users.get(userId) ?? null;
  }

  createOrUpdateUser(input: CreateUserInput, services: AppServices) {
    const existing = this.getUserByClerkId(input.clerkId);
    const now = timestamp(services);

    if (existing) {
      const updated: User = {
        ...existing,
        email: this.sanitizeText(input.email, 'email').toLowerCase(),
        firstName: this.sanitizeText(input.firstName, 'first_name'),
        lastName: this.sanitizeText(input.lastName, 'last_name'),
        avatarUrl: input.avatarUrl ?? existing.avatarUrl,
        phone: input.phone ?? existing.phone,
        updatedAt: now
      };
      this.users.set(updated.id, updated);
      return updated;
    }

    const user: User = {
      id: randomUUID(),
      clerkId: input.clerkId,
      email: this.sanitizeText(input.email, 'email').toLowerCase(),
      phone: input.phone ?? null,
      firstName: this.sanitizeText(input.firstName, 'first_name'),
      lastName: this.sanitizeText(input.lastName, 'last_name'),
      avatarUrl: input.avatarUrl ?? null,
      role: input.role ?? 'attendee',
      isActive: true,
      interests: [],
      locationCity: 'Accra',
      notificationPrefs: { ...defaultNotificationPrefs },
      createdAt: now,
      updatedAt: now
    };

    this.users.set(user.id, user);
    return user;
  }

  markUserDeleted(clerkId: string, services: AppServices) {
    const user = this.getUserByClerkId(clerkId);
    if (!user) {
      return null;
    }

    const updated: User = {
      ...user,
      isActive: false,
      updatedAt: timestamp(services)
    };

    this.users.set(updated.id, updated);
    return updated;
  }

  updateUser(userId: string, input: Partial<Pick<User, 'firstName' | 'lastName' | 'avatarUrl' | 'phone' | 'locationCity'>>, services: AppServices) {
    const user = assertPresent(this.getUserById(userId), 404, 'User not found');
    const updated: User = {
      ...user,
      firstName: input.firstName ? this.sanitizeText(input.firstName, 'first_name') : user.firstName,
      lastName: input.lastName ? this.sanitizeText(input.lastName, 'last_name') : user.lastName,
      avatarUrl: input.avatarUrl ?? user.avatarUrl,
      phone: input.phone ?? user.phone,
      locationCity: input.locationCity ? this.sanitizeText(input.locationCity, 'location_city') : user.locationCity,
      updatedAt: timestamp(services)
    };

    this.users.set(updated.id, updated);
    return updated;
  }

  updateUserInterests(userId: string, interests: string[], services: AppServices) {
    const user = assertPresent(this.getUserById(userId), 404, 'User not found');
    const normalized = interests.map((interest) => this.sanitizeText(interest, 'interest').toLowerCase());
    const updated: User = {
      ...user,
      interests: [...new Set(normalized)],
      updatedAt: timestamp(services)
    };

    this.users.set(updated.id, updated);
    return updated;
  }

  listUsers() {
    return [...this.users.values()].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  listCategories() {
    return [...this.categories.values()].filter((category) => category.isActive).sort((left, right) => left.sortOrder - right.sortOrder);
  }

  createEvent(input: CreateEventInput, services: AppServices) {
    const organizer = assertPresent(this.getUserById(input.organizerId), 404, 'Organizer not found');
    if (organizer.role !== 'organizer' && organizer.role !== 'admin') {
      throw new ApiError(403, 'Only organizers can create events');
    }

    const category = assertPresent(this.categories.get(input.categoryId), 404, 'Category not found');
    if (!category.isActive) {
      throw new ApiError(400, 'Category is inactive');
    }

    const start = new Date(input.startDatetime);
    const end = new Date(input.endDatetime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      throw new ApiError(400, 'Invalid event date range');
    }

    const slugBase = slugify(this.sanitizeText(input.title, 'title'));
    const slug = uniqueSlug(slugBase, new Set([...this.events.values()].map((event) => event.slug)));
    const now = timestamp(services);
    const eventId = randomUUID();

    const event: Event = {
      id: eventId,
      organizerId: organizer.id,
      categoryId: input.categoryId,
      venueId: input.venueId ?? null,
      title: this.sanitizeText(input.title, 'title'),
      slug,
      description: this.sanitizeText(input.description, 'description'),
      shortDescription: input.shortDescription ? this.sanitizeText(input.shortDescription, 'short_description') : null,
      tags: (input.tags ?? []).map((tag) => this.sanitizeText(tag, 'tag').toLowerCase()),
      bannerUrl: null,
      galleryUrls: [],
      videoUrl: null,
      startDatetime: input.startDatetime,
      endDatetime: input.endDatetime,
      timezone: input.timezone,
      isOnline: input.isOnline,
      onlineLink: input.onlineLink ?? null,
      customLocation: input.customLocation ? this.sanitizeText(input.customLocation, 'custom_location') : null,
      totalCapacity: input.totalCapacity ?? null,
      ticketsSold: 0,
      status: 'draft',
      isFeatured: false,
      publishedAt: null,
      cancelledAt: null,
      cancellationReason: null,
      viewsCount: 0,
      savesCount: 0,
      avgRating: null,
      reviewsCount: 0,
      clonedFrom: null,
      createdAt: now,
      updatedAt: now
    };

    this.events.set(event.id, event);
    input.ticketTypes.forEach((ticketTypeInput, index) => {
      const ticketType: TicketType = {
        id: randomUUID(),
        eventId: event.id,
        name: this.sanitizeText(ticketTypeInput.name, 'ticket_type_name'),
        description: ticketTypeInput.description ? this.sanitizeText(ticketTypeInput.description, 'ticket_type_description') : null,
        price: ticketTypeInput.price,
        priceType: ticketTypeInput.priceType,
        currency: 'GHS',
        quantityTotal: ticketTypeInput.quantityTotal ?? null,
        quantitySold: 0,
        maxPerUser: ticketTypeInput.maxPerUser ?? 5,
        saleStartsAt: ticketTypeInput.saleStartsAt ?? null,
        saleEndsAt: ticketTypeInput.saleEndsAt ?? null,
        isActive: true,
        sortOrder: ticketTypeInput.sortOrder ?? index + 1,
        createdAt: now,
        updatedAt: now
      };
      this.ticketTypes.set(ticketType.id, ticketType);
    });

    this.recordAudit(organizer.id, 'event.created', 'event', event.id, { slug: event.slug });
    return this.getEventDetail(event.id, organizer.id);
  }

  private eventTicketTypes(eventId: string) {
    return [...this.ticketTypes.values()]
      .filter((ticketType) => ticketType.eventId === eventId)
      .sort((left, right) => left.sortOrder - right.sortOrder);
  }

  getEventDetail(eventId: string, requesterId?: string | null): EventWithRelations {
    const event = assertPresent(this.events.get(eventId), 404, 'Event not found');
    if (event.status !== 'published' && requesterId !== event.organizerId) {
      throw new ApiError(404, 'Event not found');
    }

    const organizer = this.getUserById(event.organizerId);
    return {
      ...event,
      ticketTypes: this.eventTicketTypes(event.id),
      organizer: organizer
        ? {
            id: organizer.id,
            firstName: organizer.firstName,
            lastName: organizer.lastName,
            avatarUrl: organizer.avatarUrl
          }
        : null,
      category: this.categories.get(event.categoryId) ?? null,
      venue: event.venueId ? this.venues.get(event.venueId) ?? null : null
    };
  }

  listEvents(options: {
    requesterId?: string | null;
    page: number;
    limit: number;
    category?: string;
    city?: string;
    price?: 'free' | 'paid';
    q?: string;
    organizerId?: string;
    featuredOnly?: boolean;
    trendingOnly?: boolean;
  }): PaginatedResult<EventWithRelations> {
    let events = [...this.events.values()].filter((event) => {
      if (event.status === 'published') {
        return true;
      }

      return options.requesterId === event.organizerId;
    });

    if (options.organizerId) {
      events = events.filter((event) => event.organizerId === options.organizerId);
    }

    if (options.category) {
      const slugs = new Set(options.category.split(',').map((value) => value.trim()));
      const categoryIds = new Set(
        [...this.categories.values()].filter((category) => slugs.has(category.slug)).map((category) => category.id)
      );
      events = events.filter((event) => categoryIds.has(event.categoryId));
    }

    if (options.city) {
      const city = options.city.toLowerCase();
      events = events.filter((event) => {
        if (event.venueId) {
          return this.venues.get(event.venueId)?.city.toLowerCase() === city;
        }

        return (event.customLocation ?? '').toLowerCase().includes(city);
      });
    }

    if (options.price) {
      events = events.filter((event) =>
        this.eventTicketTypes(event.id).some((ticketType) => ticketType.priceType === options.price)
      );
    }

    if (options.q) {
      const query = options.q.toLowerCase();
      events = events.filter((event) =>
        [event.title, event.description, event.shortDescription ?? '', ...event.tags].join(' ').toLowerCase().includes(query)
      );
    }

    if (options.featuredOnly) {
      events = events.filter((event) => event.isFeatured);
    }

    if (options.trendingOnly) {
      events = events.sort((left, right) => right.viewsCount - left.viewsCount || right.ticketsSold - left.ticketsSold);
    } else {
      events = events.sort((left, right) => left.startDatetime.localeCompare(right.startDatetime));
    }

    return pageResult(
      events.map((event) => this.getEventDetail(event.id, options.requesterId)),
      options.page,
      options.limit
    );
  }

  updateEvent(eventId: string, organizerId: string, input: Partial<CreateEventInput>, services: AppServices) {
    const event = assertPresent(this.events.get(eventId), 404, 'Event not found');
    if (event.organizerId !== organizerId) {
      throw new ApiError(403, 'Forbidden');
    }

    const updated: Event = {
      ...event,
      title: input.title ? this.sanitizeText(input.title, 'title') : event.title,
      description: input.description ? this.sanitizeText(input.description, 'description') : event.description,
      shortDescription: input.shortDescription !== undefined
        ? input.shortDescription
          ? this.sanitizeText(input.shortDescription, 'short_description')
          : null
        : event.shortDescription,
      startDatetime: input.startDatetime ?? event.startDatetime,
      endDatetime: input.endDatetime ?? event.endDatetime,
      timezone: input.timezone ?? event.timezone,
      totalCapacity: input.totalCapacity ?? event.totalCapacity,
      isOnline: input.isOnline ?? event.isOnline,
      onlineLink: input.onlineLink !== undefined ? input.onlineLink : event.onlineLink,
      customLocation: input.customLocation !== undefined ? input.customLocation ?? null : event.customLocation,
      tags: input.tags ? input.tags.map((tag) => this.sanitizeText(tag, 'tag').toLowerCase()) : event.tags,
      categoryId: input.categoryId ?? event.categoryId,
      venueId: input.venueId !== undefined ? input.venueId ?? null : event.venueId,
      updatedAt: timestamp(services)
    };

    this.events.set(updated.id, updated);
    this.recordAudit(organizerId, 'event.updated', 'event', eventId);
    return this.getEventDetail(eventId, organizerId);
  }

  publishEvent(eventId: string, organizerId: string, services: AppServices) {
    const event = assertPresent(this.events.get(eventId), 404, 'Event not found');
    if (event.organizerId !== organizerId) {
      throw new ApiError(403, 'Forbidden');
    }

    const ticketTypes = this.eventTicketTypes(event.id);
    if (ticketTypes.length === 0) {
      throw new ApiError(400, 'Event must have at least one ticket type before publish');
    }

    const updated: Event = {
      ...event,
      status: 'published',
      publishedAt: event.publishedAt ?? timestamp(services),
      updatedAt: timestamp(services)
    };
    this.events.set(updated.id, updated);
    this.recordAudit(organizerId, 'event.published', 'event', eventId);
    return this.getEventDetail(eventId, organizerId);
  }

  unpublishEvent(eventId: string, organizerId: string, services: AppServices) {
    const event = assertPresent(this.events.get(eventId), 404, 'Event not found');
    if (event.organizerId !== organizerId) {
      throw new ApiError(403, 'Forbidden');
    }

    const updated: Event = {
      ...event,
      status: 'draft',
      updatedAt: timestamp(services)
    };
    this.events.set(updated.id, updated);
    this.recordAudit(organizerId, 'event.unpublished', 'event', eventId);
    return this.getEventDetail(eventId, organizerId);
  }

  cancelEvent(eventId: string, organizerId: string, reason: string | null, services: AppServices) {
    const event = assertPresent(this.events.get(eventId), 404, 'Event not found');
    if (event.organizerId !== organizerId) {
      throw new ApiError(403, 'Forbidden');
    }

    const updated: Event = {
      ...event,
      status: 'cancelled',
      cancelledAt: timestamp(services),
      cancellationReason: reason,
      updatedAt: timestamp(services)
    };
    this.events.set(updated.id, updated);
    this.recordAudit(organizerId, 'event.cancelled', 'event', eventId, { reason });
    return this.getEventDetail(eventId, organizerId);
  }

  deleteDraftEvent(eventId: string, organizerId: string) {
    const event = assertPresent(this.events.get(eventId), 404, 'Event not found');
    if (event.organizerId !== organizerId) {
      throw new ApiError(403, 'Forbidden');
    }
    if (event.status !== 'draft') {
      throw new ApiError(400, 'Only draft events can be deleted');
    }

    this.events.delete(eventId);
    [...this.ticketTypes.values()]
      .filter((ticketType) => ticketType.eventId === eventId)
      .forEach((ticketType) => this.ticketTypes.delete(ticketType.id));
    this.recordAudit(organizerId, 'event.deleted', 'event', eventId);
  }

  cloneEvent(eventId: string, organizerId: string, services: AppServices) {
    const event = assertPresent(this.events.get(eventId), 404, 'Event not found');
    const cloned = this.createEvent(
      {
        organizerId,
        categoryId: event.categoryId,
        venueId: event.venueId,
        title: `${event.title} Copy`,
        description: event.description,
        shortDescription: event.shortDescription,
        startDatetime: event.startDatetime,
        endDatetime: event.endDatetime,
        timezone: event.timezone,
        totalCapacity: event.totalCapacity,
        isOnline: event.isOnline,
        onlineLink: event.onlineLink,
        customLocation: event.customLocation,
        tags: event.tags,
        ticketTypes: this.eventTicketTypes(eventId).map((ticketType) => ({
          name: ticketType.name,
          description: ticketType.description,
          price: ticketType.price,
          priceType: ticketType.priceType,
          quantityTotal: ticketType.quantityTotal,
          maxPerUser: ticketType.maxPerUser,
          saleStartsAt: ticketType.saleStartsAt,
          saleEndsAt: ticketType.saleEndsAt,
          sortOrder: ticketType.sortOrder
        }))
      },
      services
    );

    const clonedEvent = assertPresent(this.events.get(cloned.id), 404, 'Cloned event missing');
    this.events.set(cloned.id, { ...clonedEvent, clonedFrom: event.id });
    return this.getEventDetail(cloned.id, organizerId);
  }

  saveEvent(userId: string, eventId: string) {
    assertPresent(this.events.get(eventId), 404, 'Event not found');
    const key = `${userId}:${eventId}`;
    if (!this.savedEvents.has(key)) {
      this.savedEvents.add(key);
      const event = assertPresent(this.events.get(eventId), 404, 'Event not found');
      this.events.set(eventId, { ...event, savesCount: event.savesCount + 1 });
    }
  }

  unsaveEvent(userId: string, eventId: string) {
    const key = `${userId}:${eventId}`;
    if (this.savedEvents.delete(key)) {
      const event = assertPresent(this.events.get(eventId), 404, 'Event not found');
      this.events.set(eventId, { ...event, savesCount: Math.max(event.savesCount - 1, 0) });
    }
  }

  private async issueTicket(input: {
    userId: string;
    eventId: string;
    ticketTypeId: string;
    paymentId: string | null;
    attendeeName: string | null;
    attendeeEmail: string | null;
    services: AppServices;
  }) {
    const ticketType = assertPresent(this.ticketTypes.get(input.ticketTypeId), 404, 'Ticket type not found');
    const event = assertPresent(this.events.get(input.eventId), 404, 'Event not found');
    const nonce = randomBytes(32).toString('hex');
    const id = randomUUID();
    const qrCode = jwt.sign({ ticket_id: id, event_id: input.eventId, nonce }, input.services.qrJwtSecret);
    const qrSecretHash = await bcrypt.hash(nonce, 10);
    const now = timestamp(input.services);

    const ticket: Ticket = {
      id,
      eventId: input.eventId,
      ticketTypeId: input.ticketTypeId,
      userId: input.userId,
      paymentId: input.paymentId,
      qrCode,
      qrSecretHash,
      status: 'active',
      checkedInAt: null,
      checkedInBy: null,
      purchasePrice: ticketType.price,
      currency: ticketType.currency,
      attendeeName: input.attendeeName,
      attendeeEmail: input.attendeeEmail,
      createdAt: now,
      updatedAt: now
    };

    this.tickets.set(ticket.id, ticket);
    this.ticketTypes.set(ticketType.id, {
      ...ticketType,
      quantitySold: ticketType.quantitySold + 1,
      updatedAt: now
    });
    this.events.set(event.id, {
      ...event,
      ticketsSold: event.ticketsSold + 1,
      updatedAt: now
    });

    return ticket;
  }

  async purchaseTickets(userId: string, input: PurchaseTicketInput, services: AppServices): Promise<PurchaseTicketResult> {
    const user = assertPresent(this.getUserById(userId), 404, 'User not found');
    const event = assertPresent(this.events.get(input.eventId), 404, 'Event not found');
    const ticketType = assertPresent(this.ticketTypes.get(input.ticketTypeId), 404, 'Ticket type not found');

    if (event.status !== 'published') {
      throw new ApiError(400, 'Event is not published');
    }

    if (ticketType.eventId !== event.id || !ticketType.isActive) {
      throw new ApiError(400, 'Ticket type is not available');
    }

    if (ticketType.quantityTotal !== null && ticketType.quantitySold + input.quantity > ticketType.quantityTotal) {
      throw new ApiError(400, 'Ticket type is sold out');
    }

    if (event.totalCapacity !== null && event.ticketsSold + input.quantity > event.totalCapacity) {
      throw new ApiError(400, 'Event is at capacity');
    }

    const existingTickets = [...this.tickets.values()].filter(
      (ticket) => ticket.userId === user.id && ticket.ticketTypeId === ticketType.id && ticket.status !== 'cancelled'
    );
    if (existingTickets.length + input.quantity > ticketType.maxPerUser) {
      throw new ApiError(400, 'Purchase exceeds max_per_user limit');
    }

    const attendeeName = input.attendeeInfo?.name ? this.sanitizeText(input.attendeeInfo.name, 'attendee_name') : `${user.firstName} ${user.lastName}`;
    const attendeeEmail = input.attendeeInfo?.email ? this.sanitizeText(input.attendeeInfo.email, 'attendee_email').toLowerCase() : user.email;

    if (ticketType.priceType === 'free') {
      const tickets = await Promise.all(
        Array.from({ length: input.quantity }, () =>
          this.issueTicket({
            userId,
            eventId: event.id,
            ticketTypeId: ticketType.id,
            paymentId: null,
            attendeeName,
            attendeeEmail,
            services
          })
        )
      );

      return {
        tickets,
        payment: null,
        status: 'confirmed'
      };
    }

    const now = timestamp(services);
    const payment: Payment = {
      id: randomUUID(),
      userId: user.id,
      eventId: event.id,
      ticketTypeId: ticketType.id,
      quantity: input.quantity,
      paystackReference: `pay_${randomUUID().replace(/-/g, '')}`,
      paystackAccessCode: `access_${randomUUID().replace(/-/g, '')}`,
      amount: ticketType.price * input.quantity,
      amountMinor: Math.round(ticketType.price * input.quantity * 100),
      currency: ticketType.currency,
      status: 'pending',
      paymentChannel: null,
      paidAt: null,
      refundedAt: null,
      refundReason: null,
      metadata: {
        userId,
        eventId: event.id,
        ticketTypeId: ticketType.id,
        quantity: input.quantity,
        attendeeName,
        attendeeEmail
      },
      createdAt: now,
      updatedAt: now
    };

    this.payments.set(payment.id, payment);

    return {
      tickets: null,
      payment: {
        reference: payment.paystackReference,
        accessCode: payment.paystackAccessCode ?? '',
        authorizationUrl: `https://checkout.paystack.com/${payment.paystackReference}`,
        amount: payment.amount,
        currency: payment.currency
      },
      status: 'payment_required'
    };
  }

  getPaymentByReference(reference: string) {
    return [...this.payments.values()].find((payment) => payment.paystackReference === reference) ?? null;
  }

  listUserPayments(userId: string) {
    return [...this.payments.values()].filter((payment) => payment.userId === userId);
  }

  ticketsByPaymentReference(reference: string) {
    const payment = this.getPaymentByReference(reference);
    if (!payment) {
      return [];
    }

    return [...this.tickets.values()].filter((ticket) => ticket.paymentId === payment.id);
  }

  async processPaystackWebhook(input: ProcessWebhookInput, services: AppServices) {
    const eventRecord: WebhookEventRecord = {
      id: randomUUID(),
      provider: 'paystack',
      eventType: String(input.payload.event ?? 'unknown'),
      externalEventId: input.providerEventId ?? null,
      signature: input.signature ?? null,
      payload: input.payload,
      processingStatus: 'received',
      processedAt: null,
      errorMessage: null,
      createdAt: timestamp(services)
    };
    this.webhookEvents.set(eventRecord.id, eventRecord);

    const payment = assertPresent(this.getPaymentByReference(input.reference), 404, 'Payment not found');
    if (payment.status === 'success' || payment.status === 'refunded') {
      this.webhookEvents.set(eventRecord.id, {
        ...eventRecord,
        processingStatus: 'duplicate',
        processedAt: timestamp(services)
      });
      return payment;
    }

    const verified = await services.paystack.verifyTransaction(payment.paystackReference);
    if (verified.status !== 'success') {
      const failed = {
        ...payment,
        status: 'failed' as PaymentStatus,
        updatedAt: timestamp(services)
      };
      this.payments.set(payment.id, failed);
      this.webhookEvents.set(eventRecord.id, {
        ...eventRecord,
        processingStatus: 'failed',
        errorMessage: 'Verification failed',
        processedAt: timestamp(services)
      });
      throw new ApiError(400, 'Payment verification failed');
    }

    const ticketType = assertPresent(this.ticketTypes.get(payment.ticketTypeId), 404, 'Ticket type not found');
    const event = assertPresent(this.events.get(payment.eventId), 404, 'Event not found');

    if (
      (ticketType.quantityTotal !== null && ticketType.quantitySold + payment.quantity > ticketType.quantityTotal) ||
      (event.totalCapacity !== null && event.ticketsSold + payment.quantity > event.totalCapacity)
    ) {
      const refunded: Payment = {
        ...payment,
        status: 'refunded',
        refundedAt: timestamp(services),
        refundReason: 'Capacity unavailable during settlement',
        updatedAt: timestamp(services)
      };
      this.payments.set(refunded.id, refunded);
      this.webhookEvents.set(eventRecord.id, {
        ...eventRecord,
        processingStatus: 'oversell_refunded',
        processedAt: timestamp(services)
      });
      return refunded;
    }

    const settledPayment: Payment = {
      ...payment,
      status: 'success',
      paymentChannel: verified.channel,
      paidAt: verified.paidAt,
      updatedAt: timestamp(services)
    };
    this.payments.set(settledPayment.id, settledPayment);

    const attendeeName = typeof payment.metadata.attendeeName === 'string' ? payment.metadata.attendeeName : null;
    const attendeeEmail = typeof payment.metadata.attendeeEmail === 'string' ? payment.metadata.attendeeEmail : null;

    for (let index = 0; index < payment.quantity; index += 1) {
      await this.issueTicket({
        userId: payment.userId,
        eventId: payment.eventId,
        ticketTypeId: payment.ticketTypeId,
        paymentId: payment.id,
        attendeeName,
        attendeeEmail,
        services
      });
    }

    this.webhookEvents.set(eventRecord.id, {
      ...eventRecord,
      processingStatus: 'processed',
      processedAt: timestamp(services)
    });

    return settledPayment;
  }

  async verifyTicketQr(organizerId: string, eventId: string, qrCode: string, services: AppServices) {
    const organizer = assertPresent(this.getUserById(organizerId), 404, 'Organizer not found');
    if (organizer.role !== 'organizer' && organizer.role !== 'admin') {
      throw new ApiError(403, 'Forbidden');
    }

    const event = assertPresent(this.events.get(eventId), 404, 'Event not found');
    if (event.organizerId !== organizerId && organizer.role !== 'admin') {
      throw new ApiError(403, 'Forbidden');
    }

    try {
      const decoded = jwt.verify(qrCode, services.qrJwtSecret) as {
        ticket_id: string;
        event_id: string;
        nonce: string;
      };

      if (decoded.event_id !== eventId) {
        return { valid: false as const, reason: 'wrong_event' as const };
      }

      const ticket = assertPresent(this.tickets.get(decoded.ticket_id), 404, 'Ticket not found');
      if (ticket.status === 'used') {
        return { valid: false as const, reason: 'already_used' as const, checkedInAt: ticket.checkedInAt };
      }
      if (ticket.status === 'cancelled') {
        return { valid: false as const, reason: 'cancelled' as const };
      }

      const matches = await bcrypt.compare(decoded.nonce, ticket.qrSecretHash);
      if (!matches) {
        return { valid: false as const, reason: 'invalid_qr' as const };
      }

      const updatedTicket: Ticket = {
        ...ticket,
        status: 'used',
        checkedInAt: timestamp(services),
        checkedInBy: organizerId,
        updatedAt: timestamp(services)
      };
      this.tickets.set(updatedTicket.id, updatedTicket);

      const ticketType = assertPresent(this.ticketTypes.get(ticket.ticketTypeId), 404, 'Ticket type not found');
      return {
        valid: true as const,
        ticket: {
          id: updatedTicket.id,
          status: updatedTicket.status,
          attendeeName: updatedTicket.attendeeName,
          attendeeEmail: updatedTicket.attendeeEmail,
          ticketType: ticketType.name,
          event: {
            id: event.id,
            title: event.title,
            startDatetime: event.startDatetime
          }
        }
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      return { valid: false as const, reason: 'invalid_qr' as const };
    }
  }

  getUserTickets(userId: string) {
    return [...this.tickets.values()].filter((ticket) => ticket.userId === userId);
  }

  getTicketForRequester(ticketId: string, requesterId: string) {
    const ticket = assertPresent(this.tickets.get(ticketId), 404, 'Ticket not found');
    const event = assertPresent(this.events.get(ticket.eventId), 404, 'Event not found');
    const requester = this.getUserById(requesterId);
    if (ticket.userId !== requesterId && event.organizerId !== requesterId && requester?.role !== 'admin') {
      throw new ApiError(403, 'Forbidden');
    }
    return ticket;
  }

  cancelTicket(ticketId: string, userId: string, services: AppServices) {
    const ticket = assertPresent(this.tickets.get(ticketId), 404, 'Ticket not found');
    if (ticket.userId !== userId) {
      throw new ApiError(403, 'Forbidden');
    }

    const updated: Ticket = {
      ...ticket,
      status: 'cancelled',
      updatedAt: timestamp(services)
    };
    this.tickets.set(updated.id, updated);
    return updated;
  }

  applyOrganizer(userId: string, input: { organizationName: string; bio?: string | null; websiteUrl?: string | null }, services: AppServices) {
    const existing = [...this.organizerProfiles.values()].find((profile) => profile.userId === userId);
    if (existing) {
      throw new ApiError(400, 'Organizer profile already exists');
    }

    const profile: OrganizerProfile = {
      id: randomUUID(),
      userId,
      organizationName: this.sanitizeText(input.organizationName, 'organization_name'),
      bio: input.bio ? this.sanitizeText(input.bio, 'bio') : null,
      websiteUrl: input.websiteUrl ?? null,
      socialLinks: {},
      logoUrl: null,
      status: 'pending',
      verifiedAt: null,
      verifiedBy: null,
      paystackSubaccount: null,
      totalEvents: 0,
      totalRevenue: 0,
      createdAt: timestamp(services),
      updatedAt: timestamp(services)
    };

    this.organizerProfiles.set(profile.id, profile);
    this.recordAudit(userId, 'organizer.applied', 'organizer_profile', profile.id);
    return profile;
  }

  getOrganizerProfileByUserId(userId: string) {
    return [...this.organizerProfiles.values()].find((profile) => profile.userId === userId) ?? null;
  }

  updateOrganizerProfile(userId: string, input: Partial<Pick<OrganizerProfile, 'organizationName' | 'bio' | 'websiteUrl'>>, services: AppServices) {
    const profile = assertPresent(this.getOrganizerProfileByUserId(userId), 404, 'Organizer profile not found');
    const updated: OrganizerProfile = {
      ...profile,
      organizationName: input.organizationName ? this.sanitizeText(input.organizationName, 'organization_name') : profile.organizationName,
      bio: input.bio !== undefined ? input.bio ? this.sanitizeText(input.bio, 'bio') : null : profile.bio,
      websiteUrl: input.websiteUrl !== undefined ? input.websiteUrl ?? null : profile.websiteUrl,
      updatedAt: timestamp(services)
    };
    this.organizerProfiles.set(updated.id, updated);
    return updated;
  }

  approveOrganizer(profileId: string, adminId: string, services: AppServices) {
    const admin = assertPresent(this.getUserById(adminId), 404, 'Admin not found');
    if (admin.role !== 'admin') {
      throw new ApiError(403, 'Forbidden');
    }

    const profile = assertPresent(this.organizerProfiles.get(profileId), 404, 'Organizer profile not found');
    const user = assertPresent(this.getUserById(profile.userId), 404, 'Organizer user not found');

    const updatedProfile: OrganizerProfile = {
      ...profile,
      status: 'approved',
      verifiedAt: timestamp(services),
      verifiedBy: adminId,
      updatedAt: timestamp(services)
    };

    const updatedUser: User = {
      ...user,
      role: 'organizer',
      updatedAt: timestamp(services)
    };

    this.organizerProfiles.set(updatedProfile.id, updatedProfile);
    this.users.set(updatedUser.id, updatedUser);
    this.recordAudit(adminId, 'organizer.approved', 'organizer_profile', profileId, { userId: user.id });
    return updatedProfile;
  }

  rejectOrganizer(profileId: string, adminId: string, reason: string | null, services: AppServices) {
    const admin = assertPresent(this.getUserById(adminId), 404, 'Admin not found');
    if (admin.role !== 'admin') {
      throw new ApiError(403, 'Forbidden');
    }

    const profile = assertPresent(this.organizerProfiles.get(profileId), 404, 'Organizer profile not found');
    const updatedProfile: OrganizerProfile = {
      ...profile,
      status: 'rejected',
      updatedAt: timestamp(services)
    };
    this.organizerProfiles.set(updatedProfile.id, updatedProfile);
    this.recordAudit(adminId, 'organizer.rejected', 'organizer_profile', profileId, { reason });
    return updatedProfile;
  }

  organizerAnalytics(userId: string): OrganizerAnalytics {
    const events = [...this.events.values()].filter((event) => event.organizerId === userId);
    const payments = [...this.payments.values()].filter((payment) => events.some((event) => event.id === payment.eventId) && payment.status === 'success');
    const now = new Date();

    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalTicketsSold = events.reduce((sum, event) => sum + event.ticketsSold, 0);
    const avgEventRating = events.length === 0 ? 0 : Number((events.reduce((sum, event) => sum + (event.avgRating ?? 0), 0) / events.length).toFixed(2));

    const revenueByMonth = payments.reduce<Array<{ month: string; revenue: number }>>((accumulator, payment) => {
      const month = payment.createdAt.slice(0, 7);
      const bucket = accumulator.find((entry) => entry.month === month);
      if (bucket) {
        bucket.revenue += payment.amount;
      } else {
        accumulator.push({ month, revenue: payment.amount });
      }
      return accumulator;
    }, []);

    const topTicketTypes = [...this.ticketTypes.values()]
      .filter((ticketType) => events.some((event) => event.id === ticketType.eventId))
      .map((ticketType) => ({
        name: ticketType.name,
        sold: ticketType.quantitySold,
        revenue: ticketType.quantitySold * ticketType.price
      }))
      .sort((left, right) => right.revenue - left.revenue)
      .slice(0, 5);

    return {
      summary: {
        totalEvents: events.length,
        totalTicketsSold,
        totalRevenue,
        avgEventRating,
        upcomingEvents: events.filter((event) => new Date(event.startDatetime) > now).length
      },
      eventsPerformance: events.map((event) => ({
        eventId: event.id,
        title: event.title,
        ticketsSold: event.ticketsSold,
        capacity: event.totalCapacity,
        fillRate: event.totalCapacity ? Number(((event.ticketsSold / event.totalCapacity) * 100).toFixed(2)) : 0,
        revenue: payments.filter((payment) => payment.eventId === event.id).reduce((sum, payment) => sum + payment.amount, 0),
        avgRating: event.avgRating,
        status: event.status
      })),
      revenueByMonth,
      topTicketTypes
    };
  }

  organizerAttendees(organizerId: string, eventId: string) {
    const event = assertPresent(this.events.get(eventId), 404, 'Event not found');
    if (event.organizerId !== organizerId) {
      throw new ApiError(403, 'Forbidden');
    }

    return [...this.tickets.values()]
      .filter((ticket) => ticket.eventId === eventId)
      .map((ticket) => ({
        id: ticket.id,
        attendeeName: ticket.attendeeName,
        attendeeEmail: ticket.attendeeEmail,
        status: ticket.status,
        checkedInAt: ticket.checkedInAt
      }));
  }

  adminDashboard() {
    return {
      users: this.users.size,
      events: this.events.size,
      payments: [...this.payments.values()].filter((payment) => payment.status === 'success').length,
      tickets: this.tickets.size,
      organizerApplications: [...this.organizerProfiles.values()].filter((profile) => profile.status === 'pending').length
    };
  }

  adminPayments() {
    return [...this.payments.values()].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  adminReports() {
    return [...this.reports.values()].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  adminLogs() {
    return {
      auditLogs: [...this.auditLogs.values()].sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
      webhookEvents: [...this.webhookEvents.values()].sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    };
  }
}
