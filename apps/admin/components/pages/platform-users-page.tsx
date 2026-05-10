import { supabaseAdmin } from '../../lib/supabase'
import { DashboardShell } from '../dashboard-shell'
import { MetricTile, SectionBlock } from '../dashboard-primitives'
import { UsersTable } from '../UsersTable'
import { AdminTableControls } from '../AdminTableControls'
import { AdminPagination } from '../AdminPagination'

const SORT_OPTIONS = [
  { label: 'Date joined', value: 'created_at' },
  { label: 'Pulse score', value: 'pulse_score' },
  { label: 'Followers', value: 'followers_count' },
  { label: 'Name A–Z', value: 'first_name' },
]

type Props = { searchParams: Record<string, string> }

export async function PlatformUsersPage({ searchParams }: Props) {
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10))
  const limit = [25, 50, 100].includes(parseInt(searchParams.limit ?? '', 10))
    ? parseInt(searchParams.limit, 10)
    : 50
  const sort = SORT_OPTIONS.some((o) => o.value === searchParams.sort)
    ? searchParams.sort
    : 'created_at'
  const order = searchParams.order === 'asc'
  const sort2 = SORT_OPTIONS.some((o) => o.value === searchParams.sort2)
    ? searchParams.sort2
    : ''
  const order2 = searchParams.order2 === 'asc'
  const q = searchParams.q?.trim() ?? ''
  const regex = searchParams.regex === '1'
  const offset = (page - 1) * limit

  // KPI counts (independent of pagination)
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const [{ count: totalUsers }, { count: activeUsers }, { count: organizersCount }, { count: newThisWeek }] =
    await Promise.all([
      supabaseAdmin.from('users').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('users').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabaseAdmin.from('users').select('id', { count: 'exact', head: true }).eq('role', 'organizer'),
      supabaseAdmin.from('users').select('id', { count: 'exact', head: true }).gte('created_at', oneWeekAgo),
    ])

  // Build paginated query
  let query = supabaseAdmin
    .from('users')
    .select(
      'id, first_name, last_name, username, email, role, location_city, pulse_score, pulse_tier, created_at, is_active, avatar_url, followers_count, following_count',
      { count: 'exact' }
    )

  if (q) {
    if (regex) {
      query = query.filter('email', 'imatch', q)
    } else {
      query = query.or(
        `first_name.ilike.%${q}%,last_name.ilike.%${q}%,username.ilike.%${q}%,email.ilike.%${q}%,location_city.ilike.%${q}%`
      )
    }
  }

  let usersQuery = query.order(sort, { ascending: order })
  if (sort2) usersQuery = usersQuery.order(sort2, { ascending: order2 })
  const { data: users, count: filteredCount } = await usersQuery.range(offset, offset + limit - 1)

  const allUsers = users ?? []
  const total = filteredCount ?? 0

  const currentParams: Record<string, string> = {
    ...(q && { q }),
    limit: String(limit),
    sort,
    order: order ? 'asc' : 'desc',
    ...(sort2 && { sort2, order2: order2 ? 'asc' : 'desc' }),
    ...(regex && { regex: '1' }),
  }

  return (
    <DashboardShell mode="admin" title="Users" subtitle="Browse and manage all platform members.">
      <div className="space-y-6">
        {/* KPI row */}
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <MetricTile
            accent="brand"
            label="Total users"
            value={(totalUsers ?? 0).toLocaleString()}
            trend=""
            meta="All registered platform accounts"
          />
          <MetricTile
            accent="cyan"
            label="Active users"
            value={(activeUsers ?? 0).toLocaleString()}
            trend={totalUsers ? `${Math.round(((activeUsers ?? 0) / totalUsers) * 100)}%` : '—'}
            meta="Accounts currently in good standing"
          />
          <MetricTile
            accent="violet"
            label="Organizers"
            value={(organizersCount ?? 0).toLocaleString()}
            trend=""
            meta="Verified organizer accounts"
          />
          <MetricTile
            accent="amber"
            label="New this week"
            value={(newThisWeek ?? 0).toLocaleString()}
            trend="Last 7 days"
            meta="Fresh registrations entering discovery"
          />
        </div>

        <SectionBlock
          title="People index"
          subtitle="Account review and manual operations"
        >
          <AdminTableControls
            sortOptions={SORT_OPTIONS}
            currentParams={{ q, limit: String(limit), sort, order: order ? 'asc' : 'desc', sort2, order2: order2 ? 'asc' : 'desc', regex }}
            searchPlaceholder="Search name, email, city…"
          />

          {allUsers.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--text-tertiary)]">
              {q ? `No users matching "${q}".` : 'No users found.'}
            </p>
          ) : (
            <UsersTable users={allUsers} />
          )}

          <AdminPagination
            total={total}
            page={page}
            limit={limit}
            currentParams={currentParams}
          />
        </SectionBlock>
      </div>
    </DashboardShell>
  )
}
