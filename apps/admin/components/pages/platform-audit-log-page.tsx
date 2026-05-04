import { DashboardShell } from '../dashboard-shell'
import { SectionBlock, MiniPill } from '../dashboard-primitives'
import type { AccentTone } from '../dashboard-primitives'
import { supabaseAdmin } from '../../lib/supabase'

function actionTone(action: string): AccentTone {
  if (action.startsWith('delete') || action.startsWith('ban') || action.startsWith('remove')) return 'coral'
  if (action.startsWith('create') || action.startsWith('add') || action.startsWith('approve')) return 'brand'
  if (action.startsWith('update') || action.startsWith('edit') || action.startsWith('toggle')) return 'cyan'
  if (action.startsWith('reject') || action.startsWith('flag')) return 'amber'
  return 'violet'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function truncateId(id: string | null) {
  if (!id) return '—'
  return id.length > 12 ? `${id.slice(0, 8)}…` : id
}

function detailsPreview(details: unknown) {
  if (!details) return '—'
  const str = JSON.stringify(details)
  return str.length > 80 ? str.slice(0, 80) + '…' : str
}

export async function PlatformAuditLogPage() {
  const { data: logs } = await supabaseAdmin
    .from('admin_activity_log')
    .select(`
      id, action_type, entity_type, entity_id, details, ip_address, created_at,
      admin:users!admin_activity_log_admin_id_fkey(first_name, last_name, email)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <DashboardShell
      mode="admin"
      title="Audit Log"
      subtitle="Immutable record of all admin actions."
    >
      <SectionBlock title="Recent Admin Activity" subtitle="Last 100 actions, newest first. Read-only.">
        {!logs?.length ? (
          <p className="text-sm text-[var(--text-secondary)]">No admin activity recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] text-left text-[10px] uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                  <th className="pb-3 pr-4">Admin</th>
                  <th className="pb-3 pr-4">Action</th>
                  <th className="pb-3 pr-4">Entity</th>
                  <th className="pb-3 pr-4">Details</th>
                  <th className="pb-3 pr-4">IP</th>
                  <th className="pb-3 whitespace-nowrap">Date</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const admin = Array.isArray(log.admin) ? log.admin[0] : log.admin
                  return (
                    <tr key={log.id} className="border-b border-[var(--border-subtle)] last:border-0">
                      <td className="py-3 pr-4 whitespace-nowrap">
                        {admin ? (
                          <div>
                            <p className="font-medium text-[var(--text-primary)]">
                              {admin.first_name} {admin.last_name}
                            </p>
                            <p className="text-xs text-[var(--text-tertiary)]">{admin.email}</p>
                          </div>
                        ) : (
                          <span className="text-[var(--text-tertiary)]">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <MiniPill tone={actionTone(log.action_type ?? '')}>
                          {log.action_type ?? '—'}
                        </MiniPill>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="font-medium text-[var(--text-primary)]">{log.entity_type ?? '—'}</span>
                        <span className="ml-2 text-xs font-mono text-[var(--text-tertiary)]">
                          {truncateId(log.entity_id)}
                        </span>
                      </td>
                      <td className="py-3 pr-4 max-w-[220px]">
                        <span className="truncate text-xs font-mono text-[var(--text-secondary)]">
                          {detailsPreview(log.details)}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-xs font-mono text-[var(--text-secondary)]">
                        {log.ip_address ?? '—'}
                      </td>
                      <td className="py-3 whitespace-nowrap text-xs text-[var(--text-secondary)]">
                        {log.created_at ? formatDate(log.created_at) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionBlock>
    </DashboardShell>
  )
}
