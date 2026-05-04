'use server'
import { supabaseAdmin } from '../../lib/supabase'
import { revalidatePath } from 'next/cache'

export async function toggleFeatured(id: string, current: boolean) {
  await supabaseAdmin.from('events').update({ is_featured: !current }).eq('id', id)
  revalidatePath('/promotions')
}

export async function toggleSponsored(id: string, current: boolean, until?: string) {
  await supabaseAdmin.from('events').update({
    is_sponsored: !current,
    sponsored_until: !current ? (until ?? null) : null,
  }).eq('id', id)
  revalidatePath('/promotions')
}

export async function updateCampaignStatus(id: string, status: 'active' | 'paused' | 'ended') {
  await supabaseAdmin.from('ad_campaigns').update({ status }).eq('id', id)
  revalidatePath('/promotions')
}
