import { Button, ShellCard, StatusPill } from "@gooutside/ui";
import { DashboardShell } from "../dashboard-shell";
import { DemoSwatch, MiniPill, PageHero, SectionBlock } from "../dashboard-primitives";
import { ThemeIconButton, ThemeToggleSwitch } from "../theme-controls";

export function PlatformComponentsPage() {
  return (
    <DashboardShell mode="admin" subtitle="Buttons, alerts, badges, colors, and theme controls" title="Components">
      <div className="space-y-6">
        <PageHero
          eyebrow="UI elements"
          title="The component playground is now native to our admin app."
          description="This is the place to review buttons, badges, alerts, and theme controls without bouncing back to the raw boilerplate. It makes future porting faster and keeps the design system visible."
        />

        <div className="grid gap-6 xl:grid-cols-2">
          <SectionBlock subtitle="Primary, ghost, secondary, and danger styles" title="Buttons">
            <div className="flex flex-wrap gap-3">
              <Button>Primary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="danger">Danger</Button>
            </div>
          </SectionBlock>

          <SectionBlock subtitle="Status pills and colored tags" title="Badges">
            <div className="flex flex-wrap gap-3">
              <StatusPill tone="live">Live</StatusPill>
              <StatusPill tone="pending">Pending</StatusPill>
              <StatusPill tone="review">Review</StatusPill>
              <StatusPill tone="draft">Draft</StatusPill>
              <MiniPill tone="cyan">Discovery</MiniPill>
              <MiniPill tone="violet">Experiment</MiniPill>
              <MiniPill tone="amber">Payment ops</MiniPill>
            </div>
          </SectionBlock>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
          <SectionBlock subtitle="Alerts adapted from the boilerplate’s alert page" title="Alerts">
            <div className="space-y-4">
              {[
                ["Success", "Feature rail was updated successfully.", "brand"],
                ["Info", "The next release includes redesigned payout rows.", "cyan"],
                ["Warning", "Two organizers still need KYC verification.", "amber"],
                ["Error", "One settlement batch failed and needs retry.", "coral"],
              ].map(([label, message, tone]) => (
                <div
                  key={label}
                  className={`rounded-[20px] border p-4 ${
                    tone === "brand"
                      ? "border-[rgba(74,222,128,0.2)] bg-[rgba(74,222,128,0.1)]"
                      : tone === "cyan"
                        ? "border-[rgba(56,189,248,0.2)] bg-[rgba(56,189,248,0.1)]"
                        : tone === "amber"
                          ? "border-[rgba(251,191,36,0.2)] bg-[rgba(251,191,36,0.1)]"
                          : "border-[rgba(251,113,133,0.2)] bg-[rgba(251,113,133,0.1)]"
                  }`}
                >
                  <p className="font-semibold text-[var(--text-primary)]">{label}</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{message}</p>
                </div>
              ))}
            </div>
          </SectionBlock>

          <SectionBlock subtitle="A button and a switch, both always visible in the system" title="Theme controls">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <ThemeIconButton />
                <span className="text-sm text-[var(--text-secondary)]">Header-friendly dark mode button</span>
              </div>
              <ThemeToggleSwitch />
            </div>
          </SectionBlock>
        </div>

        <SectionBlock subtitle="Expanded accent palette beyond the original green bias" title="Color system">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <DemoSwatch name="Brand" tone="brand" value="var(--brand)" />
            <DemoSwatch name="Cyan" tone="cyan" value="var(--accent-cyan)" />
            <DemoSwatch name="Violet" tone="violet" value="var(--accent-violet)" />
            <DemoSwatch name="Coral" tone="coral" value="var(--accent-coral)" />
            <DemoSwatch name="Amber" tone="amber" value="var(--accent-amber)" />
          </div>
        </SectionBlock>
      </div>
    </DashboardShell>
  );
}
