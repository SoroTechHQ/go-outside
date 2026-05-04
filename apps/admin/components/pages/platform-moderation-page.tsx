import { supabaseAdmin } from "../../lib/supabase";
import { DashboardShell } from "../dashboard-shell";
import { MetricTile, MiniPill, PageHero, SectionBlock } from "../dashboard-primitives";
import { DismissQueueItemButton, CloseReportButton } from "../moderation/ModerationActions";

function daysAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

function priorityTone(priority: string | null): "coral" | "amber" | "cyan" | "brand" | "violet" {
  if (priority === "high") return "coral";
  if (priority === "medium") return "amber";
  return "cyan";
}

export async function PlatformModerationPage() {
  const [{ data: queue }, { data: reports }, { count: openQueueCount }, { count: openReportsCount }] =
    await Promise.all([
      supabaseAdmin
        .from("moderation_queue")
        .select(`
          id, entity_type, entity_id, reason, details, priority, status, created_at,
          reporter:users!moderation_queue_reporter_id_fkey(first_name, last_name, email)
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: true })
        .limit(50),
      supabaseAdmin
        .from("reports")
        .select(`
          id, entity_type, entity_id, reason, details, status, created_at,
          reporter:users!reports_reporter_id_fkey(first_name, last_name)
        `)
        .eq("status", "open")
        .order("created_at", { ascending: true })
        .limit(50),
      supabaseAdmin.from("moderation_queue").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabaseAdmin.from("reports").select("id", { count: "exact", head: true }).eq("status", "open"),
    ]);

  // Sort queue: high > medium > low then by created_at
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  const sortedQueue = [...(queue ?? [])].sort((a, b) => {
    const pa = priorityOrder[a.priority ?? "low"] ?? 2;
    const pb = priorityOrder[b.priority ?? "low"] ?? 2;
    if (pa !== pb) return pa - pb;
    return new Date(a.created_at as string).getTime() - new Date(b.created_at as string).getTime();
  });

  type QueueItem = {
    id: string;
    entity_type: string | null;
    entity_id: string | null;
    reason: string | null;
    details: string | null;
    priority: string | null;
    status: string | null;
    created_at: string | null;
    reporter: { first_name: string; last_name: string; email: string } | null;
  };

  type ReportItem = {
    id: string;
    entity_type: string | null;
    entity_id: string | null;
    reason: string | null;
    details: string | null;
    status: string | null;
    created_at: string | null;
    reporter: { first_name: string; last_name: string } | null;
  };

  const queueRows = sortedQueue as unknown as QueueItem[];
  const reportRows = (reports ?? []) as unknown as ReportItem[];

  return (
    <DashboardShell mode="admin" title="Moderation" subtitle="Reports queue and content review.">
      <div className="space-y-6">
        <PageHero
          eyebrow="Trust & Safety"
          title="Moderation"
          description="Reports queue and content review."
        />

        {/* KPI Row */}
        <div className="grid gap-5 sm:grid-cols-2">
          <MetricTile
            accent="coral"
            label="Open queue items"
            value={String(openQueueCount ?? 0)}
            trend="Pending"
            meta="Moderation queue items awaiting review"
          />
          <MetricTile
            accent="amber"
            label="Open reports"
            value={String(openReportsCount ?? 0)}
            trend="Open"
            meta="User-submitted reports awaiting action"
          />
        </div>

        {/* Moderation Queue */}
        <SectionBlock
          title="Moderation queue"
          subtitle="Pending items ordered by priority then age"
        >
          {queueRows.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--text-tertiary)]">Queue is clear.</p>
          ) : (
            <div className="space-y-4">
              {queueRows.map((item) => {
                const reporterName = item.reporter
                  ? `${item.reporter.first_name ?? ""} ${item.reporter.last_name ?? ""}`.trim() ||
                    item.reporter.email
                  : "Unknown";
                return (
                  <div
                    key={item.id}
                    className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <MiniPill tone="violet">{item.entity_type ?? "unknown"}</MiniPill>
                        {item.priority && (
                          <MiniPill tone={priorityTone(item.priority)}>
                            {item.priority} priority
                          </MiniPill>
                        )}
                      </div>
                      <span className="text-xs text-[var(--text-tertiary)]">
                        {item.created_at ? daysAgo(item.created_at) : "—"}
                      </span>
                    </div>
                    <p className="mt-3 font-medium text-[var(--text-primary)]">{item.reason ?? "No reason provided"}</p>
                    {item.details && (
                      <p className="mt-1 text-sm text-[var(--text-secondary)] line-clamp-2">{item.details}</p>
                    )}
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className="text-xs text-[var(--text-tertiary)]">Reported by: {reporterName}</span>
                      <DismissQueueItemButton id={item.id} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionBlock>

        {/* Reports */}
        <SectionBlock
          title="Open reports"
          subtitle="User-submitted reports awaiting resolution"
        >
          {reportRows.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--text-tertiary)]">No open reports.</p>
          ) : (
            <div className="space-y-4">
              {reportRows.map((report) => {
                const reporterName = report.reporter
                  ? `${report.reporter.first_name ?? ""} ${report.reporter.last_name ?? ""}`.trim() || "Unknown"
                  : "Unknown";
                return (
                  <div
                    key={report.id}
                    className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <MiniPill tone="amber">{report.entity_type ?? "unknown"}</MiniPill>
                      <span className="text-xs text-[var(--text-tertiary)]">
                        {report.created_at ? daysAgo(report.created_at) : "—"}
                      </span>
                    </div>
                    <p className="mt-3 font-medium text-[var(--text-primary)]">{report.reason ?? "No reason provided"}</p>
                    {report.details && (
                      <p className="mt-1 text-sm text-[var(--text-secondary)] line-clamp-2">{report.details}</p>
                    )}
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className="text-xs text-[var(--text-tertiary)]">Reported by: {reporterName}</span>
                      <CloseReportButton id={report.id} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionBlock>
      </div>
    </DashboardShell>
  );
}
