import { supabaseAdmin } from '../../lib/supabase'
import { DashboardShell } from '../dashboard-shell'
import { MetricTile, SectionBlock } from '../dashboard-primitives'
import { ApplicationCard, OrganizersTable } from '../OrganizersActions'
import { AdminTableControls } from '../AdminTableControls'
import { AdminPagination } from '../AdminPagination'

const SORT_OPTIONS = [
  { label: 'Date joined', value: 'created_at' },
  { label: 'Revenue (highest)', value: 'total_revenue' },
  { label: 'Total events', value: 'total_events' },
  { label: 'Name A–Z', value: 'organization_name' },
]

type Props = { searchParams: Record<string, string> }

export async function PlatformOrganizersPage({ searchParams }: Props) {
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

  // Applications (all pending — no pagination needed, usually small queue)
  const { data: applications } = await supabaseAdmin
    .from('organizer_applications')
    .select(
      `id, org_name, org_category, description, instagram_url, website_url, status, created_at,
       applicant:users!organizer_applications_user_id_fkey(id, first_name, last_name, email)`
    )
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  // KPI aggregates (global, not paginated)
  const [{ count: verifiedCount }, { count: paystackLinkedCount }, { data: revData }] = await Promise.all([
    supabaseAdmin.from('organizer_profiles').select('id', { count: 'exact', head: true }).eq('status', 'active').not('verified_at', 'is', null),
    supabaseAdmin.from('organizer_profiles').select('id', { count: 'exact', head: true }).not('paystack_subaccount', 'is', null),
    supabaseAdmin.from('organizer_profiles').select('total_revenue'),
  ])
  const totalRevenue = (revData ?? []).reduce((sum, o) => sum + (Number(o.total_revenue) || 0), 0)

  // Paginated organizer directory
  let query = supabaseAdmin
    .from('organizer_profiles')
    .select(
      `id, organization_name, status, verified_at, total_events, total_revenue, paystack_subaccount,
       organizer:users!organizer_profiles_user_id_fkey(id, first_name, last_name, email, location_city, is_active)`,
      { count: 'exact' }
    )

  if (q) {
    if (regex) {
      query = query.filter('organization_name', 'imatch', q)
    } else {
      query = query.or(`organization_name.ilike.%${q}%`)
    }
  }

  let orgsQuery = query.order(sort, { ascending: order })
  if (sort2) orgsQuery = orgsQuery.order(sort2, { ascending: order2 })
  const { data: organizers, count: filteredCount } = await orgsQuery.range(offset, offset + limit - 1)

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
    <DashboardShell mode="admin" title="Organizers" subtitle="Applications, verification, and directory.">
      <div className="space-y-6">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <MetricTile
            accent="amber"
            label="Pending applications"
            value={(applications ?? []).length.toLocaleString()}
            trend={(applications ?? []).length > 0 ? 'Needs review' : 'Clear'}
            meta="Awaiting approve or reject decision"
          />
          <MetricTile
            accent="brand"
            label="Verified organizers"
            value={(verifiedCount ?? 0).toLocaleString()}
            trend=""
            meta="Active verified accounts"
          />
          <MetricTile
            accent="cyan"
            label="Paystack linked"
            value={(paystackLinkedCount ?? 0).toLocaleString()}
            trend=""
            meta="Accounts with payout subaccounts"
          />
          <MetricTile
            accent="violet"
            label="Total revenue"
            value={`GHS ${totalRevenue.toLocaleString()}`}
            trend=""
            meta="Cumulative across all organizers"
          />
        </div>

        <SectionBlock title="Applications queue" subtitle="Pending organizer applications — oldest first">
          {(applications ?? []).length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm font-semibold text-[var(--brand)]">All clear — no pending applications.</p>
              <p className="mt-1 text-xs text-[var(--text-tertiary)]">New applications will appear here as they arrive.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {(applications ?? []).map((app) => (
                <ApplicationCard key={app.id} app={app as any} />
              ))}
            </div>
          )}
        </SectionBlock>

        <SectionBlock title="Verified organizers directory" subtitle="All organizer profiles on the platform">
          <AdminTableControls
            sortOptions={SORT_OPTIONS}
            currentParams={{ q, limit: String(limit), sort, order: order ? 'asc' : 'desc', sort2, order2: order2 ? 'asc' : 'desc', regex }}
            searchPlaceholder="Search organizer name…"
          />

          {(organizers ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--text-tertiary)]">
              {q ? `No organizers matching "${q}".` : 'No organizer profiles found.'}
            </p>
          ) : (
            <OrganizersTable organizers={organizers as any} />
          )}

          <AdminPagination total={total} page={page} limit={limit} currentParams={currentParams} />
        </SectionBlock>
      </div>
    </DashboardShell>
  )
}
