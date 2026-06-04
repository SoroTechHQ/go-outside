import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { supabaseAdmin } from '../../../../lib/supabase';

type Role = 'admin' | 'organizer' | 'attendee';
const VALID_ROLES: Role[] = ['admin', 'organizer', 'attendee'];

export async function PATCH(req: NextRequest) {
  const { userId, sessionClaims } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify caller is admin via JWT claim — no Supabase call needed
  if (sessionClaims?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json() as { targetClerkId?: string; role?: string };
  const { targetClerkId, role } = body;

  if (!targetClerkId || !role || !VALID_ROLES.includes(role as Role)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  if (targetClerkId === userId && role !== 'admin') {
    return NextResponse.json({ error: 'Cannot remove your own admin role' }, { status: 400 });
  }

  // Update Supabase and Clerk publicMetadata in parallel
  const client = await clerkClient();
  const [supabaseResult] = await Promise.all([
    supabaseAdmin
      .from('users')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('clerk_id', targetClerkId)
      .select('id, email, role, first_name, last_name')
      .single(),
    client.users.updateUserMetadata(targetClerkId, { publicMetadata: { role } }),
  ]);

  const { data, error } = supabaseResult;
  if (error || !data) {
    return NextResponse.json({ error: 'User not found or update failed' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, user: data });
}

export async function GET(req: NextRequest) {
  const { userId, sessionClaims } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify caller is admin via JWT claim — no Supabase call needed
  if (sessionClaims?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() ?? '';

  if (!q || q.length < 2) {
    return NextResponse.json({ users: [] });
  }

  const { data } = await supabaseAdmin
    .from('users')
    .select('clerk_id, email, first_name, last_name, username, role, avatar_url, created_at')
    .or(`email.ilike.%${q}%,username.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`)
    .limit(10);

  return NextResponse.json({ users: data ?? [] });
}
