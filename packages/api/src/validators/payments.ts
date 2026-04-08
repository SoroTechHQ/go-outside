import { z } from 'zod';

import { optionalNoEmojiString } from './common.js';

export const paystackWebhookSchema = z.object({
  event: z.string(),
  data: z.object({
    reference: z.string(),
    amount: z.number(),
    currency: z.string(),
    status: z.string(),
    paid_at: z.string().optional(),
    channel: z.string().optional(),
    metadata: z
      .object({
        ticket_type_id: z.string().uuid().optional(),
        event_id: z.string().uuid().optional(),
        user_id: z.string().uuid().optional(),
        quantity: z.number().int().optional()
      })
      .partial()
      .optional()
  })
});

export const refundPaymentSchema = z.object({
  reason: optionalNoEmojiString('reason', 500).nullable().optional()
});
