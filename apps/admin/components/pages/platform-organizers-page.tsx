import { supabaseAdmin } from '../../lib/supabase'
import { DashboardShell } from '../dashboard-shell'
import { MetricTile, SectionBlock } from '../dashboard-primitives'
import { ApplicationCard, OrganizersTable } from '../OrganizersActions'

export async function PlatformOrganizersPage() {
  const [{ data: applications }, { data: organizers }] = await Promise.all([
    supabaseAdmin
      .from('organizer_applications')
      .select(
        `
        id, org_name, org_category, description, instagram_url, website_url, status, created_at,
        applicant:users!organizer_applications_user_id_fkey(id, first_name, last_name, email)
      `
      )
      .eq('status', 'pending')
      .order('created_at', { ascending: true }),

    supabaseAdmin
      .from('organizer_profiles')
      .select(
        `
        id, organization_name, status, verified_at, total_events, total_revenue, paystack_subaccount,
        organizer:users!organizer_profiles_user_id_fkey(id, first_name, last_name, email, location_city, is_active)
      `
      )
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const allApplications = applications ?? []
  const allOrganizers = organizers ?? []

  const verifiedCount = allOrganizers.filter(
    (o) => o.status === 'active' && o.verified_at
  ).length
  const paystackLinkedCount = allOrganizers.filter((o) => o.paystack_subaccount).length
  const totalRevenue = allOrganizers.reduce(
    (sum, o) => sum + (Number(o.total_revenue) || 0),
    0
  )

  return (
    <DashboardShell mode="admin" title="Organizers" subtitle="Applications, verification, and directory.">
      <div className="space-y-6">
        {/* KPI row */}
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <MetricTile
            accent="amber"
            label="Pending applications"
            value={allApplications.length.toLocaleString()}
            trend={allApplications.length > 0 ? 'Needs review' : 'Clear'}
            meta="Awaiting approve or reject decision"
          />
          <MetricTile
            accent="brand"
            label="Verified organizers"
            value={verifiedCount.toLocaleString()}
            trend=""
            meta="Active verified accounts"
          />
          <MetricTile
            accent="cyan"
            label="Paystack linked"
            value={paystackLinkedCount.toLocaleString()}
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

        {/* Applications queue */}
        <SectionBlock
          title="Applications queue"
          subtitle="Pending organizer applications — oldest first"
        >
          {allApplications.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm font-semibold text-[var(--brand)]">All clear — no pending applications.</p>
              <p className="mt-1 text-xs text-[var(--text-tertiary)]">New applications will appear here as they arrive.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {allApplications.map((app) => (
                <ApplicationCard key={app.id} app={app as any} />
              ))}
            </div>
          )}
        </SectionBlock>

        {/* Verified organizers directory */}
        <SectionBlock
          title="Verified organizers directory"
          subtitle="All organizer profiles on the platform"
        >
          {allOrganizers.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--text-tertiary)]">No organizer profiles found.</p>
          ) : (
            <OrganizersTable organizers={allOrganizers as any} />
          )}
        </SectionBlock>
      </div>
    </DashboardShell>
  )
}
