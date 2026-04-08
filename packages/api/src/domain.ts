export type UserRole = 'admin' | 'organizer' | 'attendee';
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';
export type TicketPriceType = 'free' | 'paid';
export type TicketStatus = 'active' | 'used' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded';
export type OrganizerStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type ReviewStatus = 'visible' | 'flagged' | 'removed';
export type ReportStatus = 'open' | 'reviewed' | 'resolved';
export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app';

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  in_app: boolean;
}

export interface User {
  id: string;
  clerkId: string;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  role: UserRole;
  isActive: boolean;
  interests: string[];
  locationCity: string;
  notificationPrefs: NotificationPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizerProfile {
  id: string;
  userId: string;
  organizationName: string;
  bio: string | null;
  websiteUrl: string | null;
  socialLinks: Record<string, string>;
  logoUrl: string | null;
  status: OrganizerStatus;
  verifiedAt: string | null;
  verifiedBy: string | null;
  paystackSubaccount: string | null;
  totalEvents: number;
  totalRevenue: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  iconKey: string;
  color: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  capacity: number | null;
  googleMapsUrl: string | null;
  createdBy: string | null;
  isVerified: boolean;
  createdAt: string;
}

export interface Event {
  id: string;
  organizerId: string;
  categoryId: string;
  venueId: string | null;
  title: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  tags: string[];
  bannerUrl: string | null;
  galleryUrls: string[];
  videoUrl: string | null;
  startDatetime: string;
  endDatetime: string;
  timezone: string;
  isOnline: boolean;
  onlineLink: string | null;
  customLocation: string | null;
  totalCapacity: number | null;
  ticketsSold: number;
  status: EventStatus;
  isFeatured: boolean;
  publishedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  viewsCount: number;
  savesCount: number;
  avgRating: number | null;
  reviewsCount: number;
  clonedFrom: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketType {
  id: string;
  eventId: string;
  name: string;
  description: string | null;
  price: number;
  priceType: TicketPriceType;
  currency: string;
  quantityTotal: number | null;
  quantitySold: number;
  maxPerUser: number;
  saleStartsAt: string | null;
  saleEndsAt: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Ticket {
  id: string;
  eventId: string;
  ticketTypeId: string;
  userId: string;
  paymentId: string | null;
  qrCode: string;
  qrSecretHash: string;
  status: TicketStatus;
  checkedInAt: string | null;
  checkedInBy: string | null;
  purchasePrice: number;
  currency: string;
  attendeeName: string | null;
  attendeeEmail: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  userId: string;
  eventId: string;
  ticketTypeId: string;
  quantity: number;
  paystackReference: string;
  paystackAccessCode: string | null;
  amount: number;
  amountMinor: number;
  currency: string;
  status: PaymentStatus;
  paymentChannel: string | null;
  paidAt: string | null;
  refundedAt: string | null;
  refundReason: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  eventId: string;
  userId: string;
  ticketId: string | null;
  rating: number;
  body: string | null;
  status: ReviewStatus;
  organizerReply: string | null;
  organizerRepliedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  entityType: string;
  entityId: string;
  reason: string;
  details: string | null;
  status: ReportStatus;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  channel: NotificationChannel;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface WebhookEventRecord {
  id: string;
  provider: string;
  eventType: string;
  externalEventId: string | null;
  signature: string | null;
  payload: Record<string, unknown>;
  processingStatus: string;
  processedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
}

export interface AuditLogRecord {
  id: string;
  actorUserId: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface AuthSubject {
  sub: string;
}

export interface PaystackVerification {
  reference: string;
  status: 'success' | 'failed';
  amountMinor: number;
  currency: string;
  paidAt: string;
  channel: string;
}

export interface AuthService {
  verifyAccessToken(token: string): Promise<AuthSubject>;
}

export interface PaystackService {
  verifyTransaction(reference: string): Promise<PaystackVerification>;
}

export interface NotificationService {
  send(userId: string, type: string, title: string, body: string, data?: Record<string, unknown>): Promise<void>;
}

export interface AppServices {
  auth: AuthService;
  paystack: PaystackService;
  notifications: NotificationService;
  qrJwtSecret: string;
  paystackWebhookSecret: string;
  now(): Date;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface PurchaseTicketResult {
  tickets: Ticket[] | null;
  payment: {
    reference: string;
    accessCode: string;
    authorizationUrl: string;
    amount: number;
    currency: string;
  } | null;
  status: 'confirmed' | 'payment_required';
}

export interface EventWithRelations extends Event {
  ticketTypes: TicketType[];
  organizer: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatarUrl'> | null;
  category: Category | null;
  venue: Venue | null;
}

export interface OrganizerAnalytics {
  summary: {
    totalEvents: number;
    totalTicketsSold: number;
    totalRevenue: number;
    avgEventRating: number;
    upcomingEvents: number;
  };
  eventsPerformance: Array<{
    eventId: string;
    title: string;
    ticketsSold: number;
    capacity: number | null;
    fillRate: number;
    revenue: number;
    avgRating: number | null;
    status: EventStatus;
  }>;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
  }>;
  topTicketTypes: Array<{
    name: string;
    sold: number;
    revenue: number;
  }>;
}
