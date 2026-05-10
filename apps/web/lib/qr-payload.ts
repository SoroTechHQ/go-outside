import { createHmac, randomBytes } from 'crypto';

export function generateTicketPayload(
  ticketId: string,
  eventId: string,
  tokenVersion: number,
): { payload: string; nonce: string } {
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = randomBytes(8).toString('hex'); // 64-bit entropy
  const message = `${ticketId}:${eventId}:${tokenVersion}:${timestamp}:${nonce}`;
  const sig = createHmac('sha256', process.env.TICKET_SECRET!)
    .update(message)
    .digest('hex')
    .slice(0, 32); // 128-bit truncation
  const payload = Buffer.from(`${message}:${sig}`).toString('base64url');
  return { payload, nonce };
}
