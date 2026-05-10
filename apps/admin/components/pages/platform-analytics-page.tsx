import { DashboardShell } from '../dashboard-shell'
import { MetricTile, SectionBlock } from '../dashboard-primitives'
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
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const [
    { data: signupRows },
    { data: cityRows },
    { data: tierRows },
    { data: categoryRows },
    { data: deviceRows },
    { count: liveSessionCount },
    { count: sessionsToday },
    { data: topEventHovers },
    { data: adBlockerData },
    { data: fpDeviceData },
  ] = await Promise.all([
    supabaseAdmin.from('users').select('created_at').gte('created_at', thirtyAgo.toISOString()),
    supabaseAdmin.from('users').select('location_city').not('location_city', 'is', null),
    supabaseAdmin.from('users').select('pulse_tier'),
    supabaseAdmin.from('events').select('category_id, categories(name)').eq('status', 'published'),
    supabaseAdmin.from('interaction_sessions').select('device_type').not('device_type', 'is', null).limit(1000),
    supabaseAdmin.from('interaction_sessions').select('id', { count: 'exact', head: true }).eq('is_active', true).gte('last_seen_at', fiveMinAgo),
    supabaseAdmin.from('interaction_sessions').select('id', { count: 'exact', head: true }).gte('started_at', oneDayAgo),
    supabaseAdmin.from('user_micro_events').select('target_entity_id, entity_type, hover_duration_ms').eq('event_type', 'hover_event').not('target_entity_id', 'is', null).order('hover_duration_ms', { ascending: false }).limit(200),
    supabaseAdmin.from('user_fingerprints').select('has_ad_blocker').limit(500),
    supabaseAdmin.from('user_fingerprints').select('device_type, browser_name, os_name').limit(500),
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

  // Ad blocker rate from fingerprints
  const adBlockTotal = (adBlockerData ?? []).length
  const adBlockCount = (adBlockerData ?? []).filter(r => r.has_ad_blocker).length
  const adBlockRate = adBlockTotal > 0 ? Math.round((adBlockCount / adBlockTotal) * 100) : 0

  // Top event hover targets
  const hoverByEntity: Record<string, { count: number; totalMs: number }> = {}
  for (const e of topEventHovers ?? []) {
    if (!e.target_entity_id) continue
    const k = e.target_entity_id
    if (!hoverByEntity[k]) hoverByEntity[k] = { count: 0, totalMs: 0 }
    hoverByEntity[k].count++
    hoverByEntity[k].totalMs += e.hover_duration_ms ?? 0
  }
  const topHoverList = Object.entries(hoverByEntity)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)

  // Browser breakdown from fingerprints
  const browserCounts = countBy(fpDeviceData ?? [], (r) => (r.browser_name as string) ?? 'Unknown')
  const browserData = Object.entries(browserCounts).sort((a, b) => b[1] - a[1]).slice(0, 6)

  // OS breakdown
  const osCounts = countBy(fpDeviceData ?? [], (r) => (r.os_name as string) ?? 'Unknown')
  const osData = Object.entries(osCounts).sort((a, b) => b[1] - a[1])

  return (
    <DashboardShell mode="admin" title="Analytics" subtitle="Platform growth and user behavior.">
      <div className="space-y-6">
        {/* Live session KPIs */}
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <MetricTile
            accent="brand"
            label="Live sessions"
            value={String(liveSessionCount ?? 0)}
            trend="Active"
            meta="Users active in the last 5 minutes"
          />
          <MetricTile
            accent="cyan"
            label="Sessions today"
            value={String(sessionsToday ?? 0)}
            trend="24h"
            meta="Sessions started in the last 24 hours"
          />
          <MetricTile
            accent="amber"
            label="Ad blocker rate"
            value={`${adBlockRate}%`}
            trend="Fingerprint"
            meta="Users with ad blockers detected"
          />
          <MetricTile
            accent="violet"
            label="Hover signals"
            value={(topEventHovers ?? []).length.toLocaleString()}
            trend="Collected"
            meta="Event hover micro-events logged"
          />
        </div>

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

        {/* Browser + OS breakdown from fingerprints */}
        <div className="grid gap-6 xl:grid-cols-2">
          <SectionBlock title="Browser Breakdown" subtitle="From collected browser fingerprints.">
            {browserData.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">No fingerprint data yet.</p>
            ) : (
              <div className="space-y-3">
                {browserData.map(([browser, count]) => {
                  const pct = Math.round((count / (fpDeviceData?.length ?? 1)) * 100)
                  return (
                    <div key={browser}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium text-[var(--text-primary)]">{browser}</span>
                        <span className="text-[var(--text-secondary)]">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-muted)]">
                        <div className="h-full rounded-full bg-[var(--brand)]" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </SectionBlock>

          <SectionBlock title="OS Breakdown" subtitle="Operating systems from fingerprints.">
            {osData.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">No fingerprint data yet.</p>
            ) : (
              <div className="space-y-3">
                {osData.map(([os, count]) => {
                  const pct = Math.round((count / (fpDeviceData?.length ?? 1)) * 100)
                  return (
                    <div key={os}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium text-[var(--text-primary)]">{os}</span>
                        <span className="text-[var(--text-secondary)]">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-muted)]">
                        <div className="h-full rounded-full bg-[var(--accent-cyan)]" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </SectionBlock>
        </div>

        {/* Top hovered events */}
        <SectionBlock title="Most Hovered Events" subtitle="Events users spent the most time examining (hover intent signals).">
          {topHoverList.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">No hover data collected yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)]">
                    {['Event ID', 'Hover count', 'Avg hover time'].map(h => (
                      <th key={h} className="pb-3 pr-4 text-left text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {topHoverList.map(([entityId, { count, totalMs }]) => (
                    <tr key={entityId}>
                      <td className="py-3 pr-4 font-mono text-xs text-[var(--text-primary)]">{entityId.slice(0, 16)}…</td>
                      <td className="py-3 pr-4 font-semibold text-[var(--text-primary)]">{count}</td>
                      <td className="py-3 text-[var(--text-secondary)]">{Math.round(totalMs / count / 1000)}s avg</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionBlock>
      </div>
    </DashboardShell>
  )
}
