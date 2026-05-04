'use server'

import { supabaseAdmin } from '../../lib/supabase'
import { revalidatePath } from 'next/cache'

export async function suspendUser(id: string) {
  await supabaseAdmin.from('users').update({ is_active: false }).eq('id', id)
  revalidatePath('/users')
}

export async function activateUser(id: string) {
  await supabaseAdmin.from('users').update({ is_active: true }).eq('id', id)
  revalidatePath('/users')
}

export async function makeOrganizer(id: string) {
  await supabaseAdmin
    .from('users')
    .update({
      account_type: 'organizer',
      is_verified_organizer: true,
    })
    .eq('id', id)
  revalidatePath('/users')
}
