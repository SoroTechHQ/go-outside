import { z } from 'zod';

import { noEmojiString, optionalNoEmojiString } from './common.js';

export const clerkWebhookSchema = z.object({
  type: z.enum(['user.created', 'user.updated', 'user.deleted']),
  data: z.object({
    id: z.string().min(1),
    email_addresses: z.array(z.object({ email_address: z.string().email() })).default([]),
    first_name: z.string().optional().default(''),
    last_name: z.string().optional().default(''),
    image_url: z.string().url().optional().nullable(),
    phone_numbers: z.array(z.object({ phone_number: z.string() })).default([])
  })
});

export const updateUserSchema = z.object({
  firstName: optionalNoEmojiString('firstName', 100),
  lastName: optionalNoEmojiString('lastName', 100),
  avatarUrl: z.string().url().optional().nullable(),
  phone: z.string().trim().max(30).optional().nullable(),
  locationCity: optionalNoEmojiString('locationCity', 120)
});

export const updateInterestsSchema = z.object({
  interests: z.array(noEmojiString('interest', 1, 40)).max(20)
});
