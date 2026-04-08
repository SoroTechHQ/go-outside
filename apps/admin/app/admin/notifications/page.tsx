import { demoData } from "@gooutside/demo-data";
import { Button, FauxSelect, FieldLabel, ShellCard, TextArea, TextInput } from "@gooutside/ui";
import { DashboardShell } from "../../../components/dashboard-shell";

export default function AdminNotificationsPage() {
  return (
    <DashboardShell
      mode="admin"
      title="Notifications"
      subtitle="Send broadcast messages to attendees"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <ShellCard>
          <h2 className="font-display text-3xl italic text-[var(--text-primary)]">New Broadcast</h2>
          <div className="mt-6 space-y-5">
            <div>
              <FieldLabel>Title</FieldLabel>
              <TextInput value="e.g. Weekend picks are live" />
            </div>
            <div>
              <FieldLabel>Message</FieldLabel>
              <TextArea value="Write your broadcast message here..." />
            </div>
            <div>
              <FieldLabel>Audience</FieldLabel>
              <FauxSelect value="All attendees" />
            </div>
          </div>
          <div className="mt-6">
            <Button>Send Broadcast</Button>
          </div>
        </ShellCard>

        <ShellCard>
          <h2 className="font-display text-3xl italic text-[var(--text-primary)]">Recent broadcasts</h2>
          <div className="mt-6 space-y-4">
            {demoData.adminDashboard.activities.map((item) => (
              <div
                key={item.title}
                className="rounded-[14px] border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{item.title}</p>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">{item.meta}</p>
                  </div>
                  <span className="shrink-0 text-xs text-[var(--text-tertiary)]">{item.timeLabel}</span>
                </div>
              </div>
            ))}
          </div>
        </ShellCard>
      </div>
    </DashboardShell>
  );
}
