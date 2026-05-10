import { createHmac, timingSafeEqual } from 'crypto';

export type DecodeResult = {
  ticketId: string;
  eventId: string;
  tokenVersion: number;
  timestamp: number;
  nonce: string;
};

export function decodeAndVerify(encoded: string, secret: string): DecodeResult | null {
  try {
    const decoded = Buffer.from(encoded, 'base64url').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length !== 6) return null;

    const [ticketId, eventId, tokenVersionStr, timestampStr, nonce, sig] = parts;
    const message = `${ticketId}:${eventId}:${tokenVersionStr}:${timestampStr}:${nonce}`;
    const expected = createHmac('sha256', secret).update(message).digest('hex').slice(0, 32);

    // Constant-time comparison — prevents timing oracle
    const a = Buffer.from(sig.padEnd(32, '0').slice(0, 32));
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

    return {
      ticketId,
      eventId,
      tokenVersion: parseInt(tokenVersionStr, 10),
      timestamp: parseInt(timestampStr, 10),
      nonce,
    };
  } catch {
    return null;
  }
}

export function hashForLog(raw: string, logSecret: string): string {
  return createHmac('sha256', logSecret).update(raw).digest('hex').slice(0, 16);
}
