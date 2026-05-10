import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '../../../../../lib/supabase';
import { getOrCreateSupabaseUser } from '../../../../../lib/db/users';
import { generateTicketPayload } from '../../../../../lib/qr-payload';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> },
) {
  const { ticketId } = await params;
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await getOrCreateSupabaseUser();
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const { data: ticket, error } = await supabaseAdmin
    .from('tickets')
    .select('id, event_id, status, token_version')
    .eq('id', ticketId)
    .eq('user_id', user.id)
    .single();

  if (error || !ticket) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
  }
  if (ticket.status === 'used') {
    return NextResponse.json({ error: 'Already checked in' }, { status: 400 });
  }
  if (ticket.status !== 'active') {
    return NextResponse.json({ error: `Ticket is ${ticket.status}` }, { status: 400 });
  }

  const { payload, nonce } = generateTicketPayload(
    ticket.id,
    ticket.event_id,
    ticket.token_version ?? 1,
  );

  await supabaseAdmin.from('qr_nonces').insert({
    nonce,
    ticket_id: ticket.id,
    expires_at: new Date(Date.now() + 90_000).toISOString(),
  });

  return NextResponse.json({ payload, expiresIn: 30 });
}
