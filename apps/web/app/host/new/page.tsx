import { HostEventWizard } from "./HostEventWizard";

export const metadata = { title: "Host an Event — GoOutside" };

export default function HostNewEventPage() {
  return (
    <main className="page-grid min-h-screen bg-[var(--bg-base)] pb-32 text-[var(--text-primary)]">
      <div className="border-b border-[var(--border-subtle)] px-4 py-5 md:px-6">
        <h1 className="font-display text-[22px] font-bold italic text-[var(--text-primary)]">
          Host an Event
        </h1>
        <p className="mt-0.5 text-[12px] text-[var(--text-tertiary)]">
          Free get-together or ticketed event — anyone can host
        </p>
      </div>
      <HostEventWizard />
    </main>
  );
}
