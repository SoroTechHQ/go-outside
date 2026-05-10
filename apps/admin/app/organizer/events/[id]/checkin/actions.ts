'use server'

import { supabaseAdmin } from '../../../../../lib/supabase'
import { revalidatePath } from 'next/cache'

export async function checkInTicket(eventId: string, ticketRef: string) {
  const ref = ticketRef.trim()
  if (!ref) return { error: 'Please enter a ticket ID or reference.' }

  // Look up by ticket ID (UUID) or attendee email
  const { data: ticket, error: lookupError } = await supabaseAdmin
    .from('tickets')
    .select('id, status, checked_in_at, attendee_name, attendee_email, event_id')
    .eq('event_id', eventId)
    .or(`id.eq.${ref},attendee_email.eq.${ref}`)
    .maybeSingle()

  if (lookupError) return { error: lookupError.message }
  if (!ticket) return { error: 'Ticket not found for this event.' }
  if (ticket.status === 'refunded' || ticket.status === 'cancelled') {
    return { error: `Ticket is ${ticket.status} — cannot check in.` }
  }
  if (ticket.checked_in_at) {
    return { error: `Already checked in at ${new Date(ticket.checked_in_at).toLocaleTimeString()}.` }
  }

  const { error: updateError } = await supabaseAdmin
    .from('tickets')
    .update({ checked_in_at: new Date().toISOString(), status: 'used' })
    .eq('id', ticket.id)

  if (updateError) return { error: updateError.message }

  revalidatePath(`/organizer/events/${eventId}/checkin`)
  return {
    success: true,
    name: ticket.attendee_name ?? ticket.attendee_email ?? 'Attendee',
  }
}
