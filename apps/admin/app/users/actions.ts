'use server'

import { auth } from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/nextjs/server'
import { supabaseAdmin } from '../../lib/supabase'
import { revalidatePath } from 'next/cache'

async function assertCallerIsAdmin() {
  const { sessionClaims } = await auth()
  if (sessionClaims?.role !== 'admin') {
    throw new Error('Forbidden')
  }
}

async function getClerkIdForUser(supabaseId: string): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('clerk_id')
    .eq('id', supabaseId)
    .single()
  if (error || !data?.clerk_id) throw new Error('User not found or has no clerk_id')
  return data.clerk_id
}

export async function suspendUser(id: string) {
  await assertCallerIsAdmin()
  await supabaseAdmin.from('users').update({ is_active: false }).eq('id', id)
  revalidatePath('/users')
}

export async function activateUser(id: string) {
  await assertCallerIsAdmin()
  await supabaseAdmin.from('users').update({ is_active: true }).eq('id', id)
  revalidatePath('/users')
}

export async function makeOrganizer(id: string) {
  await assertCallerIsAdmin()
  await supabaseAdmin
    .from('users')
    .update({ account_type: 'organizer', is_verified_organizer: true })
    .eq('id', id)
  revalidatePath('/users')
}

export async function makeAdmin(id: string) {
  await assertCallerIsAdmin()

  const clerkId = await getClerkIdForUser(id)

  // Update Supabase and Clerk in parallel
  const client = await clerkClient()
  await Promise.all([
    supabaseAdmin.from('users').update({ role: 'admin' }).eq('id', id),
    client.users.updateUserMetadata(clerkId, { publicMetadata: { role: 'admin' } }),
  ])

  revalidatePath('/users')
}

export async function removeAdmin(id: string) {
  await assertCallerIsAdmin()

  const { userId: callerId } = await auth()
  const clerkId = await getClerkIdForUser(id)

  if (clerkId === callerId) {
    throw new Error('Cannot remove your own admin role')
  }

  const client = await clerkClient()
  await Promise.all([
    supabaseAdmin.from('users').update({ role: 'attendee' }).eq('id', id),
    client.users.updateUserMetadata(clerkId, { publicMetadata: { role: 'attendee' } }),
  ])

  revalidatePath('/users')
}
