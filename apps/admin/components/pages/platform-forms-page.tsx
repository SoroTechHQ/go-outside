import { Button, FauxSelect, FieldLabel, ShellCard, TextArea, TextInput } from "@gooutside/ui";
import { DashboardShell } from "../dashboard-shell";
import { MiniPill, PageHero, SectionBlock } from "../dashboard-primitives";
import { ThemeToggleSwitch } from "../theme-controls";

export function PlatformFormsPage() {
  return (
    <DashboardShell mode="admin" subtitle="Form patterns, states, toggles, and structured inputs" title="Forms">
      <div className="space-y-6">
        <PageHero
          eyebrow="Form page"
          title="Form primitives ported into our admin design system."
          description="This keeps the breadth of the boilerplate’s form examples, but wraps them in the GoOutside shell and palette so the app has a reusable reference page for future production forms."
        />

        <div className="grid gap-6 xl:grid-cols-2">
          <SectionBlock subtitle="Default inputs and stacked fields" title="Basic inputs">
            <div className="space-y-5">
              <div>
                <FieldLabel>Event title</FieldLabel>
                <TextInput value="Friday rooftop session with live vinyl and cocktails" />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <FieldLabel>Category</FieldLabel>
                  <FauxSelect value="Music + Nightlife" />
                </div>
                <div>
                  <FieldLabel>Capacity</FieldLabel>
                  <TextInput value="240 attendees" />
                </div>
              </div>
              <div>
                <FieldLabel>Description</FieldLabel>
                <TextArea value="Use this page as the house reference for text fields, selects, denser content entry, and the overall spacing language that future admin forms should inherit." />
              </div>
            </div>
          </SectionBlock>

          <SectionBlock subtitle="States and binary controls" title="Selections and toggles">
            <div className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Approval mode</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <MiniPill tone="brand">Auto-approve</MiniPill>
                    <MiniPill tone="coral">Manual review</MiniPill>
                  </div>
                </div>
                <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Theme setting</p>
                  <div className="mt-3">
                    <ThemeToggleSwitch />
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                {[
                  "Allow waitlist when sold out",
                  "Send organizer reminder 24 hours before launch",
                  "Pin event to the homepage rail",
                ].map((label, index) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-4"
                  >
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">{label}</p>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        {index === 0
                          ? "Operational flag for growth pressure."
                          : index === 1
                            ? "Lifecycle prompt for organizer teams."
                            : "Editorial placement override."}
                      </p>
                    </div>
                    <div className={`h-7 w-12 rounded-full border p-0.5 ${index === 1 ? "border-[var(--border-subtle)] bg-[var(--bg-card-alt)]" : "border-[rgba(74,222,128,0.24)] bg-[rgba(74,222,128,0.16)]"}`}>
                      <div className={`h-5.5 w-5.5 rounded-full bg-[var(--bg-card)] ${index === 1 ? "" : "ml-auto"}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SectionBlock>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr,0.85fr]">
          <SectionBlock subtitle="Upload and grouped field examples" title="Attachments">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="rounded-[22px] border border-dashed border-[var(--border-card)] bg-[var(--bg-muted)] p-6">
                <p className="font-semibold text-[var(--text-primary)]">Drop brand assets here</p>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">PNG, JPG, SVG, or MP4 up to 12MB each.</p>
                <Button className="mt-5" variant="secondary">Select files</Button>
              </div>
              <div className="space-y-4">
                <div>
                  <FieldLabel>Primary CTA</FieldLabel>
                  <TextInput value="Reserve your spot" />
                </div>
                <div>
                  <FieldLabel>Fallback URL</FieldLabel>
                  <TextInput value="https://gooutside.app/events/friday-vinyl" />
                </div>
              </div>
            </div>
          </SectionBlock>

          <ShellCard>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--accent-amber)]">Form guidance</p>
            <div className="mt-4 space-y-3">
              {[
                "Use these layouts as the baseline for admin CRUD pages.",
                "Favor two-column groupings on desktop, single-column on smaller screens.",
                "Preserve the rounded card language and the mixed accent palette.",
              ].map((item) => (
                <div key={item} className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-4 text-sm text-[var(--text-secondary)]">
                  {item}
                </div>
              ))}
            </div>
          </ShellCard>
        </div>
      </div>
    </DashboardShell>
  );
}
