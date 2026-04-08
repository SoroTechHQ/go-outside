import { ZodSchema } from 'zod';

import { ApiError } from './errors.js';

export function parseWithSchema<T>(schema: ZodSchema<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new ApiError(400, 'Validation failed', result.error.flatten());
  }

  return result.data;
}
