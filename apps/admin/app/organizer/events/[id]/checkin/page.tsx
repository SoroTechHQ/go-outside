import { demoData } from "@gooutside/demo-data";
import { ShellCard, StatusPill, TextInput } from "@gooutside/ui";
import { Button } from "@gooutside/ui";
import { DashboardShell } from "../../../../../components/dashboard-shell";

export default function CheckinPage() {
  const recentScans = demoData.organizerDashboard.recentReviews.slice(0, 3);

  return (
    <DashboardShell
      mode="organizer"
      title="Check-in Scanner"
      subtitle="Scan or manually enter QR codes to check in attendees."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-5">
          <ShellCard>
            <div className="relative h-64 rounded-[24px] bg-[#020702] border-2 border-[var(--neon)]/30 flex items-center justify-center overflow-hidden">
              <div className="absolute left-3 top-3 h-5 w-5 rounded-tl-[6px] border-l-2 border-t-2 border-[var(--neon)]" />
              <div className="absolute right-3 top-3 h-5 w-5 rounded-tr-[6px] border-r-2 border-t-2 border-[var(--neon)]" />
              <div className="absolute bottom-3 left-3 h-5 w-5 rounded-bl-[6px] border-b-2 border-l-2 border-[var(--neon)]" />
              <div className="absolute bottom-3 right-3 h-5 w-5 rounded-br-[6px] border-b-2 border-r-2 border-[var(--neon)]" />
              <p className="text-sm text-[var(--text-tertiary)] text-center px-8">
                Point camera at attendee QR code
              </p>
            </div>
          </ShellCard>

          <ShellCard>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
              Manual entry
            </p>
            <div className="mt-4 space-y-3">
              <TextInput value="Paste QR code or ticket reference" />
              <Button className="w-full">Check In</Button>
            </div>
          </ShellCard>
        </div>

        <div className="space-y-5">
          <ShellCard>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
              Check-in progress
            </p>
            <p className="mt-4 font-display text-4xl italic text-[var(--text-primary)]">48 / 212</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">attendees checked in</p>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-[var(--bg-muted)]">
              <div
                className="h-full rounded-full bg-[var(--neon)]"
                style={{ width: `${(48 / 212) * 100}%` }}
              />
            </div>
          </ShellCard>

          <ShellCard>
            <h3 className="font-display text-2xl italic text-[var(--text-primary)]">Recent scans</h3>
            <div className="mt-4 space-y-3">
              {recentScans.map((scan) => (
                <div
                  key={scan.author}
                  className="flex items-center justify-between gap-4 rounded-[14px] border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{scan.author}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">Just now</p>
                  </div>
                  <StatusPill tone="live">Checked in</StatusPill>
                </div>
              ))}
            </div>
          </ShellCard>
        </div>
      </div>
    </DashboardShell>
  );
}
