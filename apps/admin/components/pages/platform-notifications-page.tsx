import { ShellCard } from "@gooutside/ui";
import { supabaseAdmin } from "../../lib/supabase";
import { DashboardShell } from "../dashboard-shell";
import { MiniPill, PageGuide, SectionBlock } from "../dashboard-primitives";
import { DonutChart, MultiBarChart } from "../charts/AdminCharts";
import { NotificationComposer } from "../NotificationComposer";

const channelMix = [
  { label: "Push", value: 44, tone: "brand" as const },
  { label: "Email", value: 28, tone: "cyan" as const },
  { label: "SMS", value: 16, tone: "amber" as const },
  { label: "In-app", value: 12, tone: "violet" as const },
];

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

type BroadcastRow = {
  title: string | null;
  body: string | null;
  channel: string | null;
  created_at: string | null;
};

export async function PlatformNotificationsPage() {
  // Fetch recent broadcast notifications — deduplicate by title to show unique campaigns
  const { data: rawNotifications } = await supabaseAdmin
    .from("notifications")
    .select("title, body, channel, created_at")
    .eq("type", "broadcast")
    .order("created_at", { ascending: false })
    .limit(200);

  // Deduplicate: keep the first (most recent) occurrence of each title
  const seen = new Set<string>();
  const recentSends: BroadcastRow[] = [];
  for (const row of rawNotifications ?? []) {
    const key = row.title ?? "";
    if (!seen.has(key)) {
      seen.add(key);
      recentSends.push(row as BroadcastRow);
      if (recentSends.length >= 8) break;
    }
  }

  const channelTone = (ch: string | null): "brand" | "cyan" | "amber" | "violet" => {
    if (ch === "push") return "brand";
    if (ch === "email") return "cyan";
    if (ch === "sms") return "amber";
    return "violet";
  };

  return (
    <DashboardShell mode="admin" subtitle="Broadcasts, lifecycle messaging, and campaign review" title="Notifications">
      <div className="space-y-6">
        <PageGuide
          title="Send messages and broadcasts to your users"
          tips={[
            "Choose your audience first — you can target all users, organizers only, a specific city, or a pulse tier.",
            "Push notifications reach users instantly on their phones. Email is better for detailed updates.",
            "Use Preview Templates to start from a pre-written message and edit it to fit your campaign.",
            "Save Draft stores your message locally so you can finish it later.",
          ]}
        />

        <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
          <ShellCard>
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--accent-cyan)]">
                  Campaign builder
                </p>
                <h2 className="mt-2 font-display text-xl font-semibold text-[var(--text-primary)]">New broadcast</h2>
              </div>
            </div>
            <NotificationComposer />
          </ShellCard>

          <SectionBlock subtitle="Which channels are driving engagement" title="Channel split">
            <DonutChart height={220} items={channelMix} />
            <div className="mt-4 space-y-3">
              {channelMix.map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">{item.label}</span>
                  <span className="text-sm font-semibold text-[var(--text-primary)]">{item.value}%</span>
                </div>
              ))}
            </div>
          </SectionBlock>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
          <SectionBlock subtitle="Open rate and delivery performance over six sends" title="Channel performance">
            <MultiBarChart
              categories={["S1", "S2", "S3", "S4", "S5", "S6"]}
              series={[
                { name: "Opens", data: [48, 55, 52, 58, 61, 64], tone: "brand" },
                { name: "Clicks", data: [18, 21, 20, 24, 28, 30], tone: "cyan" },
                { name: "Opt-outs", data: [4, 5, 5, 3, 4, 3], tone: "coral" },
              ]}
            />
          </SectionBlock>

          <ShellCard>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--accent-amber)]">Recent sends</p>
            <div className="mt-5 space-y-3">
              {recentSends.length === 0 ? (
                <p className="text-sm text-[var(--text-tertiary)]">No broadcasts sent yet.</p>
              ) : (
                recentSends.map((item) => (
                  <div
                    key={`${item.title}-${item.created_at}`}
                    className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[var(--text-primary)]">{item.title ?? "Untitled"}</p>
                        <p className="mt-0.5 line-clamp-1 text-sm text-[var(--text-secondary)]">{item.body}</p>
                      </div>
                      <MiniPill tone={channelTone(item.channel)}>
                        {item.channel ?? "in-app"}
                      </MiniPill>
                    </div>
                    <p className="mt-3 text-[11px] uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                      {item.created_at ? relativeTime(item.created_at) : "—"}
                    </p>
                  </div>
                ))
              )}
            </div>
          </ShellCard>
        </div>
      </div>
    </DashboardShell>
  );
}
