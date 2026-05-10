'use server'

import { supabaseAdmin } from '../../../lib/supabase'
import { revalidatePath } from 'next/cache'

export async function getEventAttendees(eventId: string) {
  const { data, error } = await supabaseAdmin
    .from('tickets')
    .select(`
      id, status, purchase_price, checked_in_at, created_at, attendee_name, attendee_email,
      ticket_type:ticket_types!tickets_ticket_type_id_fkey(name)
    `)
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return { error: error.message, data: [] }
  return { data: data ?? [], error: null }
}

export async function createEvent(formData: FormData) {
  const status = (formData.get('_status') as string) || 'draft'

  // Fetch the demo organizer (top verified organizer)
  const { data: org } = await supabaseAdmin
    .from('organizer_profiles')
    .select('user_id')
    .eq('status', 'active')
    .not('verified_at', 'is', null)
    .order('total_revenue', { ascending: false })
    .limit(1)
    .single()

  if (!org?.user_id) return { error: 'No active organizer found.' }

  const title = (formData.get('title') as string)?.trim()
  const description = (formData.get('description') as string)?.trim()
  const shortDescription = (formData.get('short_description') as string)?.trim()
  const categorySlug = (formData.get('category') as string) || 'entertainment'
  const date = formData.get('date') as string
  const startTime = formData.get('start_time') as string
  const endTime = formData.get('end_time') as string
  const venueName = (formData.get('venue') as string)?.trim()
  const address = (formData.get('address') as string)?.trim()
  const capacity = Math.max(1, parseInt((formData.get('capacity') as string) || '100', 10))

  if (!title) return { error: 'Event title is required.' }
  if (!date) return { error: 'Event date is required.' }

  const slug =
    title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') +
    '-' +
    Date.now()

  let startDatetime: string | null = null
  let endDatetime: string | null = null
  if (date && startTime) {
    startDatetime = new Date(`${date}T${startTime || '00:00'}:00`).toISOString()
  }
  if (date && endTime) {
    endDatetime = new Date(`${date}T${endTime}:00`).toISOString()
  }

  const { data: event, error } = await supabaseAdmin
    .from('events')
    .insert({
      title,
      description,
      slug,
      category_slug: categorySlug,
      status,
      organizer_id: org.user_id,
      start_datetime: startDatetime,
      end_datetime: endDatetime,
      location_name: venueName || null,
      location_address: address || null,
      total_capacity: capacity,
      tickets_sold: 0,
    })
    .select('id, slug')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/organizer/events')
  return { success: true, eventId: event.id, slug: event.slug, status }
}
