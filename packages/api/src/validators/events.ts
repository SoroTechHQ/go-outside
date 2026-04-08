import { z } from 'zod';

import { noEmojiString, optionalNoEmojiString, paginationSchema } from './common.js';

export const ticketTypeSchema = z.object({
  name: noEmojiString('ticket type name', 2, 80),
  description: optionalNoEmojiString('ticket type description', 500).nullable().optional(),
  price: z.number().min(0),
  priceType: z.enum(['free', 'paid']),
  quantityTotal: z.number().int().positive().nullable().optional(),
  maxPerUser: z.number().int().positive().max(20).optional(),
  saleStartsAt: z.string().datetime().nullable().optional(),
  saleEndsAt: z.string().datetime().nullable().optional(),
  sortOrder: z.number().int().positive().optional()
});

export const createEventSchema = z.object({
  title: noEmojiString('title', 5, 100),
  description: noEmojiString('description', 20, 5000),
  shortDescription: optionalNoEmojiString('shortDescription', 160).nullable().optional(),
  categoryId: z.string().uuid(),
  venueId: z.string().uuid().nullable().optional(),
  startDatetime: z.string().datetime(),
  endDatetime: z.string().datetime(),
  timezone: z.string().min(1).default('Africa/Accra'),
  totalCapacity: z.number().int().positive().nullable().optional(),
  isOnline: z.boolean(),
  onlineLink: z.string().url().nullable().optional(),
  customLocation: optionalNoEmojiString('customLocation', 200).nullable().optional(),
  tags: z.array(noEmojiString('tag', 1, 40)).max(20).optional(),
  ticketTypes: z.array(ticketTypeSchema).min(1)
});

export const updateEventSchema = createEventSchema.partial().extend({
  ticketTypes: z.array(ticketTypeSchema).optional()
});

export const eventQuerySchema = paginationSchema.extend({
  category: z.string().optional(),
  city: z.string().optional(),
  price: z.enum(['free', 'paid']).optional(),
  q: z.string().optional(),
  organizerId: z.string().uuid().optional()
});

export const cancelEventSchema = z.object({
  reason: optionalNoEmojiString('reason', 500).nullable().optional()
});
