'use server'
import { supabaseAdmin } from '../../lib/supabase'
import { revalidatePath } from 'next/cache'

export async function sendBroadcast(formData: FormData) {
  const title = formData.get('title') as string
  const body = formData.get('body') as string
  const audience = formData.get('audience') as string
  const channel = formData.get('channel') as string

  if (!title?.trim() || !body?.trim()) return { error: 'Title and body are required.' }

  let query = supabaseAdmin.from('users').select('id').eq('is_active', true)

  if (audience === 'attendees') {
    query = query.eq('account_type', 'user')
  } else if (audience === 'organizers') {
    query = query.eq('is_verified_organizer', true)
  } else if (audience.startsWith('city:')) {
    const city = audience.slice(5)
    query = query.eq('location_city', city)
  } else if (audience.startsWith('tier:')) {
    const tier = audience.slice(5)
    query = query.eq('pulse_tier', tier)
  }

  const { data: users } = await query
  if (!users?.length) return { error: 'No matching users found for the selected audience.' }

  const notifications = users.map((u) => ({
    user_id: u.id,
    type: 'broadcast',
    title,
    body,
    channel,
    data: { audience },
  }))

  for (let i = 0; i < notifications.length; i += 100) {
    await supabaseAdmin.from('notifications').insert(notifications.slice(i, i + 100))
  }

  revalidatePath('/broadcasts')
  return { success: true, count: users.length }
}
