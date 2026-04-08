import { demoData } from "@gooutside/demo-data";
import {
  Button,
  FieldLabel,
  FauxSelect,
  ShellCard,
  TextArea,
  TextInput,
} from "@gooutside/ui";
import { DashboardShell } from "../../../../components/dashboard-shell";

export default function NewEventPage() {
  const draft = demoData.createEventDraft;

  return (
    <DashboardShell
      mode="organizer"
      subtitle="Static multi-step implementation using the PRD structure and demo data only."
      title="Create Event"
    >
      <div className="space-y-6">
        <ShellCard className="flex flex-wrap items-center gap-3">
          {draft.steps.map((step, index) => (
            <div
              key={step}
              className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                index === draft.steps.length - 1
                  ? "border-[var(--border-card)] bg-[var(--bg-muted)] text-[var(--text-secondary)]"
                  : index === 0
                    ? "border-[var(--border-card)] bg-[var(--neon)] text-[#020702]"
                    : "border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)]"
              }`}
            >
              {index + 1}. {step}
            </div>
          ))}
        </ShellCard>

        <div className="grid gap-6 xl:grid-cols-[1fr,360px]">
          <div className="space-y-6">
            <ShellCard>
              <FieldLabel>Title</FieldLabel>
              <TextInput value={draft.basics.title} />
              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <div>
                  <FieldLabel>Short Description</FieldLabel>
                  <TextArea className="min-h-28" value={draft.basics.shortDescription} />
                </div>
                <div>
                  <FieldLabel>Description</FieldLabel>
                  <TextArea className="min-h-28" value={draft.basics.description} />
                </div>
              </div>
              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <div>
                  <FieldLabel>Category</FieldLabel>
                  <FauxSelect value={draft.basics.categorySlug} />
                </div>
                <div>
                  <FieldLabel>Tags</FieldLabel>
                  <TextInput value={draft.basics.tags.join(", ")} />
                </div>
              </div>
            </ShellCard>

            <ShellCard>
              <div className="grid gap-5 lg:grid-cols-2">
                <div>
                  <FieldLabel>Date</FieldLabel>
                  <TextInput value={draft.schedule.date} />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <FieldLabel>Start</FieldLabel>
                    <TextInput value={draft.schedule.startTime} />
                  </div>
                  <div>
                    <FieldLabel>End</FieldLabel>
                    <TextInput value={draft.schedule.endTime} />
                  </div>
                </div>
              </div>
              <div className="mt-5 grid gap-5 lg:grid-cols-3">
                <div>
                  <FieldLabel>Venue</FieldLabel>
                  <TextInput value={draft.schedule.venue} />
                </div>
                <div>
                  <FieldLabel>Address</FieldLabel>
                  <TextInput value={draft.schedule.address} />
                </div>
                <div>
                  <FieldLabel>Timezone</FieldLabel>
                  <TextInput value={draft.schedule.timezone} />
                </div>
              </div>
            </ShellCard>

            <ShellCard>
              <div className="grid gap-5 lg:grid-cols-3">
                <div>
                  <FieldLabel>Banner Upload</FieldLabel>
                  <TextInput value={draft.media.bannerLabel} />
                </div>
                <div>
                  <FieldLabel>Gallery</FieldLabel>
                  <TextInput value={draft.media.galleryCountLabel} />
                </div>
                <div>
                  <FieldLabel>Video URL</FieldLabel>
                  <TextInput value={draft.media.videoUrl} />
                </div>
              </div>
            </ShellCard>
          </div>

          <div className="space-y-6">
            <ShellCard>
              <h3 className="font-display text-3xl italic text-[var(--text-primary)]">Ticket Types</h3>
              <div className="mt-5 space-y-4">
                {draft.ticketTypes.map((ticket) => (
                  <div key={ticket.name} className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-4">
                    <p className="font-semibold text-[var(--text-primary)]">{ticket.name}</p>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">{ticket.priceLabel} · {ticket.quantity} capacity · {ticket.limit}</p>
                  </div>
                ))}
              </div>
            </ShellCard>

            <ShellCard>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--neon)]">Review and publish</p>
              <h3 className="mt-3 font-display text-3xl italic text-[var(--text-primary)]">Event preview</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                This page deliberately mirrors the multi-step organizer prompt in the PRD. It is fully isolated from API writes and exists to validate form architecture, density, and step sequencing.
              </p>
              <div className="mt-6 grid gap-3">
                <Button>Publish Now</Button>
                <Button variant="ghost">Save as Draft</Button>
              </div>
            </ShellCard>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
