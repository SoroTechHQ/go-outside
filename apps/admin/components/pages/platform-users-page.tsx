import { supabaseAdmin } from '../../lib/supabase'
import { DashboardShell } from '../dashboard-shell'
import { MetricTile, SectionBlock } from '../dashboard-primitives'
import { UsersTable } from '../UsersTable'

export async function PlatformUsersPage() {
  const { data: users } = await supabaseAdmin
    .from('users')
    .select(
      'id, first_name, last_name, username, email, role, location_city, pulse_score, pulse_tier, created_at, is_active, avatar_url, followers_count, following_count'
    )
    .order('created_at', { ascending: false })
    .limit(100)

  const allUsers = users ?? []

  const totalUsers = allUsers.length
  const activeUsers = allUsers.filter((u) => u.is_active).length
  const organizersCount = allUsers.filter(
    (u) => u.role === 'organizer'
  ).length

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const newThisWeek = allUsers.filter(
    (u) => u.created_at && u.created_at > oneWeekAgo
  ).length

  return (
    <DashboardShell mode="admin" title="Users" subtitle="Browse and manage all platform members.">
      <div className="space-y-6">
        {/* KPI row */}
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <MetricTile
            accent="brand"
            label="Total users"
            value={totalUsers.toLocaleString()}
            trend=""
            meta="All registered platform accounts"
          />
          <MetricTile
            accent="cyan"
            label="Active users"
            value={activeUsers.toLocaleString()}
            trend={totalUsers > 0 ? `${Math.round((activeUsers / totalUsers) * 100)}%` : '—'}
            meta="Accounts currently in good standing"
          />
          <MetricTile
            accent="violet"
            label="Organizers"
            value={organizersCount.toLocaleString()}
            trend=""
            meta="Verified organizer accounts"
          />
          <MetricTile
            accent="amber"
            label="New this week"
            value={newThisWeek.toLocaleString()}
            trend="Last 7 days"
            meta="Fresh registrations entering discovery"
          />
        </div>

        {/* Users table */}
        <SectionBlock
          title="People index"
          subtitle="Account review and manual operations"
        >
          {allUsers.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--text-tertiary)]">No users found.</p>
          ) : (
            <UsersTable users={allUsers} />
          )}
        </SectionBlock>
      </div>
    </DashboardShell>
  )
}
