import { z } from 'zod';

import { noEmojiString } from './common.js';

export const purchaseTicketSchema = z.object({
  eventId: z.string().uuid(),
  ticketTypeId: z.string().uuid(),
  quantity: z.number().int().min(1).max(10),
  attendeeInfo: z
    .object({
      name: noEmojiString('attendee name', 1, 120).optional(),
      email: z.string().email().optional()
    })
    .optional()
});

export const verifyQrSchema = z.object({
  eventId: z.string().uuid(),
  qrCode: z.string().min(1)
});
