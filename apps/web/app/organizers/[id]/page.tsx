import { notFound } from "next/navigation";
import { events, getCategoryBySlug, getOrganizerById } from "@gooutside/demo-data";
import { EventCard, ShellCard } from "@gooutside/ui";
import { ShieldCheck } from "@phosphor-icons/react/dist/ssr";

export default async function OrganizerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const organizer = getOrganizerById(id);

  if (!organizer) {
    notFound();
  }

  const organizerEvents = events.filter((e) => e.organizerId === id);

  return (
    <main className="page-grid min-h-screen pb-24">
      <section className="container-shell py-10">
        <ShellCard className="mb-8">
          <div className="flex flex-wrap items-start gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-muted)] text-lg font-semibold text-[var(--text-primary)]">
              {organizer.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-display text-5xl italic text-[var(--text-primary)]">{organizer.name}</h1>
                {organizer.verified && (
                  <ShieldCheck size={22} className="text-[var(--neon)]" weight="fill" />
                )}
              </div>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{organizer.tag}</p>
              <p className="mt-1 text-xs text-[var(--text-tertiary)]">{organizer.city}</p>
              <div className="mt-3 flex gap-4 text-xs text-[var(--text-tertiary)]">
                <span>{organizer.followersLabel}</span>
                <span>{organizer.eventsLabel}</span>
              </div>
            </div>
          </div>
        </ShellCard>

        <div className="mb-6">
          <h2 className="font-display text-3xl italic text-[var(--text-primary)]">Events by {organizer.name}</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">{organizerEvents.length} listing{organizerEvents.length !== 1 ? "s" : ""}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {organizerEvents.map((event) => {
            const category = getCategoryBySlug(event.categorySlug);
            return category ? (
              <EventCard key={event.id} category={category} event={event} organizer={organizer} />
            ) : null;
          })}
        </div>
      </section>
    </main>
  );
}
