import { DashboardShell } from '../dashboard-shell'
import { SectionBlock, MiniPill } from '../dashboard-primitives'
import { BroadcastComposer } from '../BroadcastComposer'
import { supabaseAdmin } from '../../lib/supabase'

function channelTone(channel: string) {
  if (channel === 'email') return 'cyan' as const
  if (channel === 'push') return 'violet' as const
  return 'brand' as const
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export async function PlatformBroadcastsPage() {
  const { data: broadcasts } = await supabaseAdmin
    .from('notifications')
    .select('type, title, body, channel, created_at')
    .eq('type', 'broadcast')
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <DashboardShell mode="admin" title="Broadcasts" subtitle="Send messages to user segments.">
      <div className="grid gap-6 xl:grid-cols-[1fr,1.4fr]">
        <SectionBlock title="Compose Broadcast" subtitle="Target a segment and send an in-app, email, or push message.">
          <BroadcastComposer />
        </SectionBlock>

        <SectionBlock title="Sent History" subtitle="Last 20 broadcast notifications.">
          {!broadcasts?.length ? (
            <p className="text-sm text-[var(--text-secondary)]">No broadcasts sent yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] text-left text-[10px] uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                    <th className="pb-3 pr-4">Title</th>
                    <th className="pb-3 pr-4">Channel</th>
                    <th className="pb-3 whitespace-nowrap">Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {broadcasts.map((b, i) => (
                    <tr key={i} className="border-b border-[var(--border-subtle)] last:border-0">
                      <td className="py-3 pr-4 font-medium text-[var(--text-primary)]">
                        <div>{b.title}</div>
                        <div className="mt-0.5 truncate max-w-[240px] text-xs text-[var(--text-secondary)]">{b.body}</div>
                      </td>
                      <td className="py-3 pr-4">
                        <MiniPill tone={channelTone(b.channel ?? 'in_app')}>
                          {b.channel ?? 'in_app'}
                        </MiniPill>
                      </td>
                      <td className="py-3 whitespace-nowrap text-[var(--text-secondary)]">
                        {b.created_at ? formatDate(b.created_at) : '—'}
                      </td>
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
