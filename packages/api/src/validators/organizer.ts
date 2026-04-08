import { z } from 'zod';

import { noEmojiString, optionalNoEmojiString } from './common.js';

export const applyOrganizerSchema = z.object({
  organizationName: noEmojiString('organizationName', 2, 120),
  bio: optionalNoEmojiString('bio', 1000).nullable().optional(),
  websiteUrl: z.string().url().nullable().optional()
});

export const updateOrganizerSchema = applyOrganizerSchema.partial();
