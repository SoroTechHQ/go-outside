import { DashboardShell } from '../dashboard-shell'
import { SectionBlock, MiniPill } from '../dashboard-primitives'
import { ToggleFeaturedButton, ToggleSponsoredButton, CampaignStatusButton } from '../PromotionActions'
import { supabaseAdmin } from '../../lib/supabase'

function campaignStatusTone(status: string) {
  if (status === 'active') return 'brand' as const
  if (status === 'paused') return 'amber' as const
  return 'coral' as const
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatDatetime(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export async function PlatformPromotionsPage() {
  const [{ data: featured }, { data: campaigns }] = await Promise.all([
    supabaseAdmin
      .from('events')
      .select('id, title, slug, is_featured, is_sponsored, sponsored_until, start_datetime, status')
      .or('is_featured.eq.true,is_sponsored.eq.true')
      .order('start_datetime', { ascending: true }),
    supabaseAdmin
      .from('ad_campaigns')
      .select(`
        id, title, body, cta_label, budget_ghs, impressions, clicks, status, starts_at, ends_at, created_at,
        organizer:users!ad_campaigns_organizer_id_fkey(first_name, last_name),
        event:events!ad_campaigns_event_id_fkey(title)
      `)
      .order('created_at', { ascending: false })
      .limit(30),
  ])

  return (
    <DashboardShell mode="admin" title="Promotions" subtitle="Featured events and ad campaigns.">
      <div className="space-y-8">
        {/* Section 1 — Featured Events */}
        <SectionBlock title="Featured Events" subtitle="Events currently marked as featured or sponsored.">
          {!featured?.length ? (
            <p className="text-sm text-[var(--text-secondary)]">No featured or sponsored events.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {featured.map((event) => (
                <div
                  key={event.id}
                  className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-4 space-y-3"
                >
                  <div>
                    <p className="font-semibold text-[var(--text-primary)] leading-tight">{event.title}</p>
                    <p className="mt-1 text-xs text-[var(--text-tertiary)]">{formatDatetime(event.start_datetime)}</p>
                    {event.sponsored_until && (
                      <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                        Sponsored until {formatDate(event.sponsored_until)}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {event.is_featured && <MiniPill tone="brand">Featured</MiniPill>}
                    {event.is_sponsored && <MiniPill tone="amber">Sponsored</MiniPill>}
                  </div>
                  <div className="flex gap-2">
                    <ToggleFeaturedButton id={event.id} current={!!event.is_featured} />
                    <ToggleSponsoredButton id={event.id} current={!!event.is_sponsored} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionBlock>

        {/* Section 2 — Ad Campaigns */}
        <SectionBlock title="Ad Campaigns" subtitle="Organizer-submitted campaigns with budget and performance.">
          {!campaigns?.length ? (
            <p className="text-sm text-[var(--text-secondary)]">No ad campaigns found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] text-left text-[10px] uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                    <th className="pb-3 pr-4">Campaign</th>
                    <th className="pb-3 pr-4">Organizer</th>
                    <th className="pb-3 pr-4">Event</th>
                    <th className="pb-3 pr-4 text-right">Budget (GHS)</th>
                    <th className="pb-3 pr-4 text-right">Impr.</th>
                    <th className="pb-3 pr-4 text-right">Clicks</th>
                    <th className="pb-3 pr-4 text-right">CTR</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => {
                    const impressions = c.impressions ?? 0
                    const clicks = c.clicks ?? 0
                    const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(1) : '0.0'
                    const organizer = Array.isArray(c.organizer) ? c.organizer[0] : c.organizer
                    const eventTitle = Array.isArray(c.event) ? c.event[0]?.title : (c.event as { title?: string } | null)?.title
                    return (
                      <tr key={c.id} className="border-b border-[var(--border-subtle)] last:border-0">
                        <td className="py-3 pr-4 font-medium text-[var(--text-primary)] max-w-[160px] truncate">
                          {c.title}
                        </td>
                        <td className="py-3 pr-4 text-[var(--text-secondary)] whitespace-nowrap">
                          {organizer ? `${organizer.first_name} ${organizer.last_name}` : '—'}
                        </td>
                        <td className="py-3 pr-4 text-[var(--text-secondary)] max-w-[140px] truncate">
                          {eventTitle ?? '—'}
                        </td>
                        <td className="py-3 pr-4 text-right text-[var(--text-primary)]">
                          {c.budget_ghs?.toLocaleString() ?? '—'}
                        </td>
                        <td className="py-3 pr-4 text-right text-[var(--text-secondary)]">
                          {impressions.toLocaleString()}
                        </td>
                        <td className="py-3 pr-4 text-right text-[var(--text-secondary)]">
                          {clicks.toLocaleString()}
                        </td>
                        <td className="py-3 pr-4 text-right font-semibold text-[var(--brand)]">
                          {ctr}%
                        </td>
                        <td className="py-3 pr-4">
                          <MiniPill tone={campaignStatusTone(c.status ?? 'ended')}>
                            {c.status ?? 'ended'}
                          </MiniPill>
                        </td>
                        <td className="py-3">
                          <CampaignStatusButton id={c.id} status={c.status ?? 'ended'} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionBlock>
      </div>
    </DashboardShell>
  )
}
