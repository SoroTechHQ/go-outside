'use server'
import { supabaseAdmin } from '../../lib/supabase'
import { revalidatePath } from 'next/cache'

export async function updateSetting(key: string, value: string) {
  let parsed: unknown = value
  try {
    parsed = JSON.parse(value)
  } catch {
    // value is a plain string — store as-is
  }
  await supabaseAdmin
    .from('platform_settings')
    .upsert({ key, value: parsed })
  revalidatePath('/settings')
}

export async function toggleCategory(id: string, current: boolean) {
  await supabaseAdmin
    .from('categories')
    .update({ is_active: !current })
    .eq('id', id)
  revalidatePath('/settings')
}
