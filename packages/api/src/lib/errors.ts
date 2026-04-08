export class ApiError extends Error {
  readonly statusCode: number;
  readonly details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function assertPresent<T>(value: T | null | undefined, statusCode: number, message: string): T {
  if (value === null || value === undefined) {
    throw new ApiError(statusCode, message);
  }

  return value;
}
