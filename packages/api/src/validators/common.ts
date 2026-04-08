import { z } from 'zod';

import { containsEmoji } from '../lib/no-emoji.js';

export const noEmojiString = (fieldName: string, min = 1, max = 5000) =>
  z
    .string()
    .trim()
    .min(min, `${fieldName} is too short`)
    .max(max, `${fieldName} is too long`)
    .refine((value) => !containsEmoji(value), `${fieldName} cannot contain emoji characters`);

export const optionalNoEmojiString = (fieldName: string, max = 5000) =>
  z
    .string()
    .trim()
    .max(max, `${fieldName} is too long`)
    .refine((value) => !containsEmoji(value), `${fieldName} cannot contain emoji characters`)
    .optional();

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});
