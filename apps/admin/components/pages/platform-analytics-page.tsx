import { DashboardShell } from '../dashboard-shell'
import { SectionBlock } from '../dashboard-primitives'
import { supabaseAdmin } from '../../lib/supabase'
import { SignupTrendChart } from '../charts/SignupTrendChart'
import { CityBreakdownChart } from '../charts/CityBreakdownChart'
import { TierDistributionChart } from '../charts/TierDistributionChart'
import { CategoryChart } from '../charts/CategoryChart'
import { DeviceChart } from '../charts/DeviceChart'

function countBy<T>(arr: T[], key: (item: T) => string): Record<string, number> {
  return arr.reduce<Record<string, number>>((acc, item) => {
    const k = key(item)
    if (k) acc[k] = (acc[k] ?? 0) + 1
    return acc
  }, {})
}

export async function PlatformAnalyticsPage() {
  const thirtyAgo = new Date()
  thirtyAgo.setDate(thirtyAgo.getDate() - 30)

  const [
    { data: signupRows },
    { data: cityRows },
    { data: tierRows },
    { data: categoryRows },
    { data: deviceRows },
  ] = await Promise.all([
    supabaseAdmin
      .from('users')
      .select('created_at')
      .gte('created_at', thirtyAgo.toISOString()),
    supabaseAdmin
      .from('users')
      .select('location_city')
      .not('location_city', 'is', null),
    supabaseAdmin.from('users').select('pulse_tier'),
    supabaseAdmin
      .from('events')
      .select('category_id, categories(name)')
      .eq('status', 'published'),
    supabaseAdmin
      .from('interaction_sessions')
      .select('device_type')
      .not('device_type', 'is', null)
      .limit(1000),
  ])

  // Signups by date (YYYY-MM-DD)
  const signupsByDate = countBy(signupRows ?? [], (r) =>
    (r.created_at as string).slice(0, 10),
  )
  const signupData = Object.entries(signupsByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }))

  // City distribution — top 8
  const cityCounts = countBy(cityRows ?? [], (r) => r.location_city as string)
  const cityData = Object.entries(cityCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([city, count]) => ({ city, count }))

  // Pulse tier distribution
  const tierCounts = countBy(tierRows ?? [], (r) => (r.pulse_tier as string) ?? 'newcomer')
  const tierData = Object.entries(tierCounts).map(([tier, count]) => ({ tier, count }))

  // Events per category
  type CategoryRow = { categories: { name: string } | { name: string }[] | null }
  const catCounts = countBy(categoryRows as CategoryRow[] ?? [], (r) => {
    if (!r.categories) return ''
    const cats = Array.isArray(r.categories) ? r.categories : [r.categories]
    return cats[0]?.name ?? ''
  })
  const categoryData = Object.entries(catCounts)
    .filter(([name]) => name)
    .sort(([, a], [, b]) => b - a)
    .map(([category, count]) => ({ category, count }))

  // Device breakdown
  const deviceCounts = countBy(deviceRows ?? [], (r) => (r.device_type as string) ?? 'unknown')
  const deviceData = Object.entries(deviceCounts).map(([device, count]) => ({ device, count }))

  return (
    <DashboardShell mode="admin" title="Analytics" subtitle="Platform growth and user behavior.">
      <div className="space-y-6">
        {/* Signups trend */}
        <SectionBlock title="Signups (last 30 days)" subtitle="Daily new user registrations.">
          {signupData.length > 0 ? (
            <SignupTrendChart data={signupData} />
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">No signup data in the last 30 days.</p>
          )}
        </SectionBlock>

        <div className="grid gap-6 xl:grid-cols-2">
          {/* City breakdown */}
          <SectionBlock title="City Breakdown" subtitle="Top 8 cities by registered user count.">
            {cityData.length > 0 ? (
              <CityBreakdownChart data={cityData} />
            ) : (
              <p className="text-sm text-[var(--text-secondary)]">No city data available.</p>
            )}
          </SectionBlock>

          {/* Tier distribution */}
          <SectionBlock title="Pulse Tier Distribution" subtitle="User breakdown by pulse tier.">
            {tierData.length > 0 ? (
              <TierDistributionChart data={tierData} />
            ) : (
              <p className="text-sm text-[var(--text-secondary)]">No tier data available.</p>
            )}
          </SectionBlock>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          {/* Events per category */}
          <SectionBlock title="Events by Category" subtitle="Published events grouped by category.">
            {categoryData.length > 0 ? (
              <CategoryChart data={categoryData} />
            ) : (
              <p className="text-sm text-[var(--text-secondary)]">No published events found.</p>
            )}
          </SectionBlock>

          {/* Device breakdown */}
          <SectionBlock title="Device Types" subtitle="Session device breakdown (last 1,000 sessions).">
            {deviceData.length > 0 ? (
              <DeviceChart data={deviceData} />
            ) : (
              <p className="text-sm text-[var(--text-secondary)]">No session device data.</p>
            )}
          </SectionBlock>
        </div>
      </div>
    </DashboardShell>
  )
}
