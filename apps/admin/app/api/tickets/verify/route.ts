import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';
import { decodeAndVerify, hashForLog } from '../../../../lib/qr-verify';

const TICKET_SECRET = process.env.TICKET_SECRET!;
const LOG_SECRET = process.env.LOG_SECRET!;
const WINDOW_SECS = 90; // nonce TTL; must match qr-token route

type ScanResult =
  | 'ADMITTED'
  | 'ALREADY_CHECKED_IN'
  | 'WRONG_EVENT'
  | 'EXPIRED'
  | 'INVALID_TICKET';

async function logAttempt(
  result: ScanResult,
  payloadRaw: string,
  ticketId: string | null,
  eventId: string,
  scannerId: string | null,
) {
  await supabaseAdmin.from('scan_attempts').insert({
    ticket_id: ticketId,
    event_id: eventId,
    scanner_id: scannerId,
    result,
    payload_hash: hashForLog(payloadRaw, LOG_SECRET),
  });
}

export async function POST(req: NextRequest) {
  let body: { payload?: string; eventId?: string; scannerId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  const { payload: rawPayload, eventId: claimedEventId, scannerId = null } = body;

  if (!rawPayload || !claimedEventId) {
    return NextResponse.json({ error: 'Missing payload or eventId' }, { status: 400 });
  }

  // ── 1. Decode & verify HMAC ────────────────────────────────────────────────
  const decoded = decodeAndVerify(rawPayload, TICKET_SECRET);
  if (!decoded) {
    // Don't reveal which check failed
    await logAttempt('INVALID_TICKET', rawPayload, null, claimedEventId, scannerId);
    return NextResponse.json({ result: 'INVALID_TICKET' }, { status: 400 });
  }

  const { ticketId, eventId, tokenVersion, timestamp, nonce } = decoded;

  // ── 2. Check QR is not stale (wall-clock window) ──────────────────────────
  const ageSecs = Math.floor(Date.now() / 1000) - timestamp;
  if (ageSecs < 0 || ageSecs > WINDOW_SECS) {
    await logAttempt('EXPIRED', rawPayload, ticketId, claimedEventId, scannerId);
    return NextResponse.json({ result: 'EXPIRED' }, { status: 400 });
  }

  // ── 3. Check event matches scanner's event ────────────────────────────────
  if (eventId !== claimedEventId) {
    await logAttempt('WRONG_EVENT', rawPayload, ticketId, claimedEventId, scannerId);
    return NextResponse.json({ result: 'WRONG_EVENT' }, { status: 400 });
  }

  // ── 4. Consume nonce (single-use, prevents replay) ────────────────────────
  const { data: nonceRow, error: nonceLookupErr } = await supabaseAdmin
    .from('qr_nonces')
    .select('id, used_at, expires_at')
    .eq('ticket_id', ticketId)
    .eq('nonce', nonce)
    .maybeSingle();

  if (nonceLookupErr || !nonceRow || nonceRow.used_at || new Date(nonceRow.expires_at) < new Date()) {
    await logAttempt('INVALID_TICKET', rawPayload, ticketId, claimedEventId, scannerId);
    return NextResponse.json({ result: 'INVALID_TICKET' }, { status: 400 });
  }

  // Mark nonce used immediately
  await supabaseAdmin
    .from('qr_nonces')
    .update({ used_at: new Date().toISOString() })
    .eq('id', nonceRow.id);

  // ── 5. Atomic conditional check-in (prevents TOCTOU race) ────────────────
  const { data: updated, error: updateError } = await supabaseAdmin
    .from('tickets')
    .update({
      status: 'used',
      checked_in_at: new Date().toISOString(),
      checked_in_by: scannerId,
    })
    .eq('id', ticketId)
    .eq('status', 'active')
    .eq('token_version', tokenVersion)
    .select('id, user_id, attendee_name, attendee_email')
    .single();

  if (updateError || !updated) {
    // Determine why — was it already checked in or token version mismatch
    const { data: existing } = await supabaseAdmin
      .from('tickets')
      .select('status, checked_in_at')
      .eq('id', ticketId)
      .single();

    if (existing?.status === 'used') {
      const checkedInAt = existing.checked_in_at
        ? new Date(existing.checked_in_at).toLocaleTimeString('en-GH')
        : 'earlier';
      await logAttempt('ALREADY_CHECKED_IN', rawPayload, ticketId, claimedEventId, scannerId);
      return NextResponse.json({ result: 'ALREADY_CHECKED_IN', checkedInAt }, { status: 409 });
    }

    await logAttempt('INVALID_TICKET', rawPayload, ticketId, claimedEventId, scannerId);
    return NextResponse.json({ result: 'INVALID_TICKET' }, { status: 400 });
  }

  // ── 6. Fire-and-forget: award Pulse Points + graph edge ──────────────────
  if (updated.user_id) {
    Promise.all([
      supabaseAdmin.rpc('award_pulse_points', {
        p_user_id: updated.user_id,
        p_delta: 50,
        p_type: 'check_in',
        p_description: 'Checked in at event',
        p_event_id: eventId,
      }),
      supabaseAdmin.from('graph_edges').upsert(
        {
          from_id: updated.user_id,
          from_type: 'user',
          to_id: eventId,
          to_type: 'event',
          edge_type: 'check_in',
          weight: 1,
          source: 'qr_scan',
        },
        { onConflict: 'from_id,to_id,edge_type', ignoreDuplicates: true },
      ),
    ]).catch(() => {});
  }

  await logAttempt('ADMITTED', rawPayload, ticketId, claimedEventId, scannerId);

  return NextResponse.json({
    result: 'ADMITTED',
    name: updated.attendee_name ?? updated.attendee_email ?? 'Attendee',
  });
}
