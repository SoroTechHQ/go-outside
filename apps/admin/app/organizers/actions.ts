'use server'

import { supabaseAdmin } from '../../lib/supabase'
import { revalidatePath } from 'next/cache'

export async function approveApplication(applicationId: string, userId: string) {
  await Promise.all([
    supabaseAdmin
      .from('organizer_applications')
      .update({ status: 'approved' })
      .eq('id', applicationId),
    supabaseAdmin
      .from('users')
      .update({ is_verified_organizer: true, account_type: 'organizer' })
      .eq('id', userId),
  ])
  revalidatePath('/organizers')
}

export async function rejectApplication(applicationId: string) {
  await supabaseAdmin
    .from('organizer_applications')
    .update({ status: 'rejected' })
    .eq('id', applicationId)
  revalidatePath('/organizers')
}

export async function verifyOrganizer(profileId: string) {
  await supabaseAdmin
    .from('organizer_profiles')
    .update({
      status: 'active',
      verified_at: new Date().toISOString(),
    })
    .eq('id', profileId)
  revalidatePath('/organizers')
}

export async function suspendOrganizerProfile(profileId: string) {
  await supabaseAdmin
    .from('organizer_profiles')
    .update({ status: 'suspended' })
    .eq('id', profileId)
  revalidatePath('/organizers')
}
